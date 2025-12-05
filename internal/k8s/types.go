package k8s

import "time"

// ListOptions captures common list filters.
type ListOptions struct {
	Namespace     string
	Status        string
	LabelSelector string
	Query         string
	Limit         int
	Offset        int
}

type PodSummary struct {
	ID                string            `json:"id"`
	Name              string            `json:"name"`
	Namespace         string            `json:"namespace"`
	Status            string            `json:"status"`
	Restarts          int32             `json:"restarts"`
	NodeName          string            `json:"nodeName,omitempty"`
	CreationTimestamp time.Time         `json:"creationTimestamp"`
	Labels            map[string]string `json:"labels,omitempty"`
}

type NodeSummary struct {
	Name           string `json:"name"`
	Status         string `json:"status"`
	Version        string `json:"version"`
	Pods           int    `json:"pods"`
	CPUCapacity    string `json:"cpuCapacity"`
	MemoryCapacity string `json:"memoryCapacity"`
}

type DeploymentSummary struct {
	Name          string    `json:"name"`
	Namespace     string    `json:"namespace"`
	ReadyReplicas int32     `json:"readyReplicas"`
	Replicas      int32     `json:"replicas"`
	UpdatedAt     time.Time `json:"updatedAt"`
}

type NamespaceSummary struct {
	Name   string `json:"name"`
	Status string `json:"status"`
	Age    string `json:"age"`
}

// ListResponse is a simple envelope for list endpoints.
type ListResponse[T any] struct {
	Items []T `json:"items"`
	Count int `json:"count"`
}

type ContainerStatus struct {
	Name         string `json:"name"`
	Image        string `json:"image"`
	Ready        bool   `json:"ready"`
	RestartCount int32  `json:"restartCount"`
	State        string `json:"state"`
	Reason       string `json:"reason,omitempty"`
	Message      string `json:"message,omitempty"`
}

type PodCondition struct {
	Type           string    `json:"type"`
	Status         string    `json:"status"`
	Reason         string    `json:"reason,omitempty"`
	Message        string    `json:"message,omitempty"`
	LastTransition time.Time `json:"lastTransitionTime"`
}

type EventSummary struct {
	Type           string    `json:"type"`
	Reason         string    `json:"reason"`
	Message        string    `json:"message"`
	Count          int32     `json:"count"`
	FirstTimestamp time.Time `json:"firstTimestamp"`
	LastTimestamp  time.Time `json:"lastTimestamp"`
}

type PodDetail struct {
	PodSummary
	Containers []ContainerStatus `json:"containers"`
	Conditions []PodCondition    `json:"conditions"`
	Events     []EventSummary    `json:"events,omitempty"`
	NodeIP     string            `json:"nodeIP,omitempty"`
	PodIP      string            `json:"podIP,omitempty"`
}

type NodeCondition struct {
	Type           string    `json:"type"`
	Status         string    `json:"status"`
	Reason         string    `json:"reason,omitempty"`
	Message        string    `json:"message,omitempty"`
	LastTransition time.Time `json:"lastTransitionTime"`
}

type NodeDetail struct {
	NodeSummary
	Conditions  []NodeCondition   `json:"conditions"`
	Capacity    map[string]string `json:"capacity"`
	Allocatable map[string]string `json:"allocatable"`
}

type DeploymentCondition struct {
	Type           string    `json:"type"`
	Status         string    `json:"status"`
	Reason         string    `json:"reason,omitempty"`
	Message        string    `json:"message,omitempty"`
	LastTransition time.Time `json:"lastTransitionTime"`
}

type DeploymentDetail struct {
	DeploymentSummary
	Conditions []DeploymentCondition `json:"conditions"`
}
