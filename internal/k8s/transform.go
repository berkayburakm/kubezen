package k8s

import (
	appsv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// stripHeavyFields removes rarely-used fields to shrink payloads cached by informers.
func stripHeavyFields(obj any) (any, error) {
	switch v := obj.(type) {
	case *corev1.Pod:
		v.ManagedFields = nil
		return v, nil
	case *corev1.Node:
		v.ManagedFields = nil
		return v, nil
	case *corev1.Namespace:
		v.ManagedFields = nil
		return v, nil
	case *appsv1.Deployment:
		v.ManagedFields = nil
		return v, nil
	default:
		if accessor, ok := obj.(metav1.Object); ok {
			accessor.SetManagedFields(nil)
		}
		return obj, nil
	}
}
