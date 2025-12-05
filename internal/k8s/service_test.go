package k8s

import (
	"context"
	"testing"
	"time"

	appsv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/informers"
	"k8s.io/client-go/kubernetes/fake"
)

func TestListPodsWithFiltersAndPagination(t *testing.T) {
	pods := []*corev1.Pod{
		{ObjectMeta: metav1.ObjectMeta{Name: "api-1", Namespace: "default", UID: "1", Labels: map[string]string{"app": "api"}}, Status: corev1.PodStatus{Phase: corev1.PodRunning}},
		{ObjectMeta: metav1.ObjectMeta{Name: "api-2", Namespace: "default", UID: "2", Labels: map[string]string{"app": "api"}}, Status: corev1.PodStatus{Phase: corev1.PodPending}},
		{ObjectMeta: metav1.ObjectMeta{Name: "web-1", Namespace: "web", UID: "3", Labels: map[string]string{"app": "web"}}, Status: corev1.PodStatus{Phase: corev1.PodRunning}},
	}

	service := newTestService(t, pods, nil, nil, nil)

	items, total, err := service.ListPods(context.Background(), ListOptions{
		Namespace: "default",
		Status:    "running",
		Limit:     1,
		Offset:    0,
	})
	if err != nil {
		t.Fatalf("list pods: %v", err)
	}
	if total != 1 {
		t.Fatalf("expected total 1, got %d", total)
	}
	if len(items) != 1 || items[0].Name != "api-1" {
		t.Fatalf("unexpected items: %#v", items)
	}
}

func TestGetPodIncludesEvents(t *testing.T) {
	pod := &corev1.Pod{
		ObjectMeta: metav1.ObjectMeta{Name: "api-1", Namespace: "default", UID: "1"},
		Status: corev1.PodStatus{
			Phase: corev1.PodRunning,
			PodIP: "10.0.0.10",
			ContainerStatuses: []corev1.ContainerStatus{
				{
					Name:         "app",
					Ready:        true,
					RestartCount: 1,
					State:        corev1.ContainerState{Running: &corev1.ContainerStateRunning{StartedAt: metav1.Time{Time: time.Now()}}},
				},
			},
			Conditions: []corev1.PodCondition{
				{Type: corev1.PodReady, Status: corev1.ConditionTrue, LastTransitionTime: metav1.Time{Time: time.Now()}},
			},
		},
	}

	event := &corev1.Event{
		ObjectMeta: metav1.ObjectMeta{Name: "ev1", Namespace: "default"},
		InvolvedObject: corev1.ObjectReference{
			Kind:      "Pod",
			Name:      "api-1",
			Namespace: "default",
		},
		Reason:        "Started",
		Message:       "Pod started",
		Count:         1,
		LastTimestamp: metav1.Time{Time: time.Now()},
	}

	service := newTestService(t, []*corev1.Pod{pod}, nil, nil, []*corev1.Event{event})
	detail, err := service.GetPod(context.Background(), "default", "api-1")
	if err != nil {
		t.Fatalf("get pod: %v", err)
	}
	if len(detail.Events) != 1 {
		t.Fatalf("expected events to be included")
	}
	if detail.PodIP != "10.0.0.10" {
		t.Fatalf("expected pod IP to be set")
	}
}

func newTestService(t *testing.T, pods []*corev1.Pod, nodes []*corev1.Node, deployments []*appsv1.Deployment, events []*corev1.Event) *Service {
	t.Helper()
	client := fake.NewSimpleClientset()
	factory := informers.NewSharedInformerFactory(client, 0)

	podIndexer := factory.Core().V1().Pods().Informer().GetIndexer()
	for _, p := range pods {
		_ = podIndexer.Add(p)
	}

	nodeIndexer := factory.Core().V1().Nodes().Informer().GetIndexer()
	for _, n := range nodes {
		_ = nodeIndexer.Add(n)
	}

	deployIndexer := factory.Apps().V1().Deployments().Informer().GetIndexer()
	for _, d := range deployments {
		_ = deployIndexer.Add(d)
	}

	eventIndexer := factory.Core().V1().Events().Informer().GetIndexer()
	for _, e := range events {
		_ = eventIndexer.Add(e)
	}

	return NewService(client, factory)
}
