package k8s

import (
	"context"
	"fmt"
	"strings"
	"time"

	appsv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/labels"
	appsinformers "k8s.io/client-go/informers/apps"
	coreinformers "k8s.io/client-go/informers/core"
	"k8s.io/client-go/kubernetes"
	appslisters "k8s.io/client-go/listers/apps/v1"
	corelisters "k8s.io/client-go/listers/core/v1"
)

// Service exposes read-only operations backed by informer caches.
type Service struct {
	client       kubernetes.Interface
	pods         corelisters.PodLister
	nodes        corelisters.NodeLister
	deployments  appslisters.DeploymentLister
	namespaces   corelisters.NamespaceLister
	events       corelisters.EventLister
	defaultSince func(time.Time) string
}

func NewService(client kubernetes.Interface, factory informerFactory) *Service {
	return &Service{
		client:      client,
		pods:        factory.Core().V1().Pods().Lister(),
		nodes:       factory.Core().V1().Nodes().Lister(),
		deployments: factory.Apps().V1().Deployments().Lister(),
		namespaces:  factory.Core().V1().Namespaces().Lister(),
		events:      factory.Core().V1().Events().Lister(),
		defaultSince: func(t time.Time) string {
			return humanizeDuration(time.Since(t))
		},
	}
}

// informerFactory abstracts the informer groups we need (allows easier testing).
type informerFactory interface {
	Core() coreinformers.Interface
	Apps() appsinformers.Interface
}

func (s *Service) ListPods(ctx context.Context, opts ListOptions) ([]PodSummary, int, error) {
	selector := labels.Everything()
	if opts.LabelSelector != "" {
		parsed, err := labels.Parse(opts.LabelSelector)
		if err != nil {
			return nil, 0, fmt.Errorf("invalid label selector: %w", err)
		}
		selector = parsed
	}

	var pods []*corev1.Pod
	var err error
	if opts.Namespace != "" && opts.Namespace != "all" {
		pods, err = s.pods.Pods(opts.Namespace).List(selector)
	} else {
		pods, err = s.pods.List(selector)
	}
	if err != nil {
		return nil, 0, fmt.Errorf("list pods: %w", err)
	}

	if err := ctx.Err(); err != nil {
		return nil, 0, err
	}

	query := strings.TrimSpace(strings.ToLower(opts.Query))
	statusFilter := strings.TrimSpace(strings.ToLower(opts.Status))

	filtered := make([]PodSummary, 0, len(pods))
	for _, pod := range pods {
		if statusFilter != "" && statusFilter != "all" && strings.ToLower(string(pod.Status.Phase)) != statusFilter {
			continue
		}

		if query != "" && !matchesPodQuery(pod, query) {
			continue
		}

		filtered = append(filtered, toPodSummary(pod))
	}
	total := len(filtered)
	start, end := paginate(total, opts.Offset, opts.Limit)
	return filtered[start:end], total, nil
}

func (s *Service) ListNodes(ctx context.Context) ([]NodeSummary, error) {
	nodes, err := s.nodes.List(labels.Everything())
	if err != nil {
		return nil, fmt.Errorf("list nodes: %w", err)
	}

	if err := ctx.Err(); err != nil {
		return nil, err
	}

	out := make([]NodeSummary, 0, len(nodes))
	for _, node := range nodes {
		out = append(out, toNodeSummary(node))
	}
	return out, nil
}

func (s *Service) ListDeployments(ctx context.Context, namespace string) ([]DeploymentSummary, error) {
	var deployments []*appsv1.Deployment
	var err error
	if namespace != "" && namespace != "all" {
		deployments, err = s.deployments.Deployments(namespace).List(labels.Everything())
	} else {
		deployments, err = s.deployments.List(labels.Everything())
	}
	if err != nil {
		return nil, fmt.Errorf("list deployments: %w", err)
	}

	if err := ctx.Err(); err != nil {
		return nil, err
	}

	out := make([]DeploymentSummary, 0, len(deployments))
	for _, deploy := range deployments {
		out = append(out, toDeploymentSummary(deploy))
	}
	return out, nil
}

func (s *Service) ListNamespaces(ctx context.Context) ([]NamespaceSummary, error) {
	namespaces, err := s.namespaces.List(labels.Everything())
	if err != nil {
		return nil, fmt.Errorf("list namespaces: %w", err)
	}

	if err := ctx.Err(); err != nil {
		return nil, err
	}

	out := make([]NamespaceSummary, 0, len(namespaces))
	for _, ns := range namespaces {
		out = append(out, NamespaceSummary{
			Name:   ns.Name,
			Status: string(ns.Status.Phase),
			Age:    s.defaultSince(ns.CreationTimestamp.Time),
		})
	}
	return out, nil
}

func (s *Service) GetPod(ctx context.Context, namespace, name string) (PodDetail, error) {
	pod, err := s.pods.Pods(namespace).Get(name)
	if err != nil {
		return PodDetail{}, fmt.Errorf("get pod: %w", err)
	}
	events, _ := s.events.Events(namespace).List(labels.Everything())
	filteredEvents := make([]EventSummary, 0)
	for _, ev := range events {
		if ev.InvolvedObject.Name != name {
			continue
		}
		filteredEvents = append(filteredEvents, toEventSummary(ev))
	}

	return PodDetail{
		PodSummary: toPodSummary(pod),
		Containers: toContainerStatuses(pod),
		Conditions: toPodConditions(pod),
		Events:     filteredEvents,
		NodeIP:     pod.Status.HostIP,
		PodIP:      pod.Status.PodIP,
	}, nil
}

func (s *Service) GetNode(ctx context.Context, name string) (NodeDetail, error) {
	node, err := s.nodes.Get(name)
	if err != nil {
		return NodeDetail{}, fmt.Errorf("get node: %w", err)
	}
	return NodeDetail{
		NodeSummary: toNodeSummary(node),
		Conditions:  toNodeConditions(node),
		Capacity:    quantityMap(node.Status.Capacity),
		Allocatable: quantityMap(node.Status.Allocatable),
	}, nil
}

func (s *Service) GetDeployment(ctx context.Context, namespace, name string) (DeploymentDetail, error) {
	if namespace == "" || namespace == "all" {
		return DeploymentDetail{}, fmt.Errorf("namespace required")
	}
	deploy, err := s.deployments.Deployments(namespace).Get(name)
	if err != nil {
		return DeploymentDetail{}, fmt.Errorf("get deployment: %w", err)
	}
	return DeploymentDetail{
		DeploymentSummary: toDeploymentSummary(deploy),
		Conditions:        toDeploymentConditions(deploy),
	}, nil
}

func (s *Service) ListEvents(ctx context.Context, namespace string) ([]EventSummary, error) {
	var evts []*corev1.Event
	var err error
	if namespace != "" && namespace != "all" {
		evts, err = s.events.Events(namespace).List(labels.Everything())
	} else {
		evts, err = s.events.List(labels.Everything())
	}
	if err != nil {
		return nil, fmt.Errorf("list events: %w", err)
	}
	out := make([]EventSummary, 0, len(evts))
	for _, ev := range evts {
		out = append(out, toEventSummary(ev))
	}
	return out, nil
}

func (s *Service) CreateNamespace(ctx context.Context, name string) error {
	ns := &corev1.Namespace{ObjectMeta: metav1.ObjectMeta{Name: name}}
	_, err := s.client.CoreV1().Namespaces().Create(ctx, ns, metav1.CreateOptions{})
	return err
}

func (s *Service) DeleteNamespace(ctx context.Context, name string) error {
	return s.client.CoreV1().Namespaces().Delete(ctx, name, metav1.DeleteOptions{})
}

func matchesPodQuery(pod *corev1.Pod, query string) bool {
	if strings.Contains(strings.ToLower(pod.Name), query) {
		return true
	}
	if strings.Contains(strings.ToLower(pod.Namespace), query) {
		return true
	}
	if pod.Spec.NodeName != "" && strings.Contains(strings.ToLower(pod.Spec.NodeName), query) {
		return true
	}
	for k, v := range pod.Labels {
		if strings.Contains(strings.ToLower(k), query) || strings.Contains(strings.ToLower(v), query) {
			return true
		}
	}
	return false
}

func toPodSummary(pod *corev1.Pod) PodSummary {
	return PodSummary{
		ID:                string(pod.UID),
		Name:              pod.Name,
		Namespace:         pod.Namespace,
		Status:            string(pod.Status.Phase),
		Restarts:          totalRestarts(pod),
		NodeName:          pod.Spec.NodeName,
		CreationTimestamp: pod.CreationTimestamp.Time,
		Labels:            pod.Labels,
	}
}

func toNodeSummary(node *corev1.Node) NodeSummary {
	return NodeSummary{
		Name:           node.Name,
		Status:         nodeReadyStatus(node),
		Version:        node.Status.NodeInfo.KubeletVersion,
		Pods:           int(node.Status.Capacity.Pods().Value()),
		CPUCapacity:    node.Status.Capacity.Cpu().String(),
		MemoryCapacity: node.Status.Capacity.Memory().String(),
	}
}

func toDeploymentSummary(deploy *appsv1.Deployment) DeploymentSummary {
	return DeploymentSummary{
		Name:          deploy.Name,
		Namespace:     deploy.Namespace,
		ReadyReplicas: deploy.Status.ReadyReplicas,
		Replicas:      deploy.Status.Replicas,
		UpdatedAt:     latestDeploymentUpdate(deploy),
	}
}

func totalRestarts(pod *corev1.Pod) int32 {
	var restarts int32
	for _, status := range pod.Status.ContainerStatuses {
		restarts += status.RestartCount
	}
	return restarts
}

func nodeReadyStatus(node *corev1.Node) string {
	for _, cond := range node.Status.Conditions {
		if cond.Type == corev1.NodeReady {
			if cond.Status == corev1.ConditionTrue {
				return "Ready"
			}
			return "NotReady"
		}
	}
	return "Unknown"
}

func latestDeploymentUpdate(deploy *appsv1.Deployment) time.Time {
	var last time.Time
	for _, cond := range deploy.Status.Conditions {
		if cond.LastUpdateTime.Time.After(last) {
			last = cond.LastUpdateTime.Time
		}
	}
	if last.IsZero() {
		return deploy.CreationTimestamp.Time
	}
	return last
}

func humanizeDuration(d time.Duration) string {
	switch {
	case d < time.Minute:
		return "just now"
	case d < time.Hour:
		return fmt.Sprintf("%dm", int(d.Minutes()))
	case d < 24*time.Hour:
		return fmt.Sprintf("%dh", int(d.Hours()))
	case d < 30*24*time.Hour:
		return fmt.Sprintf("%dd", int(d.Hours()/24))
	default:
		return fmt.Sprintf("%dmo", int(d.Hours()/(24*30)))
	}
}

func toContainerStatuses(pod *corev1.Pod) []ContainerStatus {
	out := make([]ContainerStatus, 0, len(pod.Status.ContainerStatuses))
	for _, cs := range pod.Status.ContainerStatuses {
		state, reason, message := containerState(cs)
		out = append(out, ContainerStatus{
			Name:         cs.Name,
			Image:        cs.Image,
			Ready:        cs.Ready,
			RestartCount: cs.RestartCount,
			State:        state,
			Reason:       reason,
			Message:      message,
		})
	}
	return out
}

func containerState(cs corev1.ContainerStatus) (state, reason, message string) {
	switch {
	case cs.State.Running != nil:
		state = "Running"
		if cs.State.Running.StartedAt.Time.After(time.Time{}) {
			reason = "Started"
		}
	case cs.State.Waiting != nil:
		state = "Waiting"
		reason = cs.State.Waiting.Reason
		message = cs.State.Waiting.Message
	case cs.State.Terminated != nil:
		state = "Terminated"
		reason = cs.State.Terminated.Reason
		message = cs.State.Terminated.Message
	default:
		state = "Unknown"
	}
	return
}

func toPodConditions(pod *corev1.Pod) []PodCondition {
	out := make([]PodCondition, 0, len(pod.Status.Conditions))
	for _, cond := range pod.Status.Conditions {
		out = append(out, PodCondition{
			Type:           string(cond.Type),
			Status:         string(cond.Status),
			Reason:         cond.Reason,
			Message:        cond.Message,
			LastTransition: cond.LastTransitionTime.Time,
		})
	}
	return out
}

func toNodeConditions(node *corev1.Node) []NodeCondition {
	out := make([]NodeCondition, 0, len(node.Status.Conditions))
	for _, cond := range node.Status.Conditions {
		out = append(out, NodeCondition{
			Type:           string(cond.Type),
			Status:         string(cond.Status),
			Reason:         cond.Reason,
			Message:        cond.Message,
			LastTransition: cond.LastTransitionTime.Time,
		})
	}
	return out
}

func toDeploymentConditions(deploy *appsv1.Deployment) []DeploymentCondition {
	out := make([]DeploymentCondition, 0, len(deploy.Status.Conditions))
	for _, cond := range deploy.Status.Conditions {
		out = append(out, DeploymentCondition{
			Type:           string(cond.Type),
			Status:         string(cond.Status),
			Reason:         cond.Reason,
			Message:        cond.Message,
			LastTransition: cond.LastUpdateTime.Time,
		})
	}
	return out
}

func toEventSummary(ev *corev1.Event) EventSummary {
	return EventSummary{
		Type:           ev.Type,
		Reason:         ev.Reason,
		Message:        ev.Message,
		Count:          ev.Count,
		FirstTimestamp: ev.EventTime.Time,
		LastTimestamp:  ev.LastTimestamp.Time,
	}
}

func quantityMap(resources corev1.ResourceList) map[string]string {
	out := make(map[string]string, len(resources))
	for k, v := range resources {
		out[string(k)] = v.String()
	}
	return out
}

func paginate(total, offset, limit int) (int, int) {
	if limit <= 0 || limit > 1000 {
		limit = 200
	}
	if offset < 0 {
		offset = 0
	}
	if offset > total {
		offset = total
	}
	end := offset + limit
	if end > total {
		end = total
	}
	return offset, end
}
