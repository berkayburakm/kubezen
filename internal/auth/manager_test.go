package auth

import (
	"testing"
	"time"

	"kubezen/internal/config"
)

func TestStateLifecycle(t *testing.T) {
	m := NewManager(config.AuthConfig{SessionTTL: time.Hour})
	state := m.NewState()
	if !m.ValidateState(state) {
		t.Fatalf("expected state to be valid")
	}
	if m.ValidateState(state) {
		t.Fatalf("expected state to be single-use")
	}
}

func TestSessionLifecycle(t *testing.T) {
	m := NewManager(config.AuthConfig{SessionTTL: time.Hour})
	session := m.NewSessionFromKubeconfig("user", "raw-config", "ctx")
	found, ok := m.SessionByID(session.ID)
	if !ok {
		t.Fatalf("session not found")
	}
	if found.Subject != "user" || found.Context != "ctx" {
		t.Fatalf("unexpected session data")
	}
	m.DeleteSession(session.ID)
	if _, ok := m.SessionByID(session.ID); ok {
		t.Fatalf("session should be deleted")
	}
}
