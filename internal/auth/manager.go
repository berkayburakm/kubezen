package auth

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"

	"kubezen/internal/config"
)

type SessionSource string

const (
	SourceOIDC       SessionSource = "oidc"
	SourceKubeconfig SessionSource = "kubeconfig"
	SourceLocal      SessionSource = "local"
)

type Session struct {
	ID           string
	Source       SessionSource
	Subject      string
	AccessToken  string
	RefreshToken string
	TokenType    string
	ExpiresAt    time.Time
	Kubeconfig   string
	Context      string
	CreatedAt    time.Time
}

// Manager holds in-memory sessions and OIDC state for CSRF protection.
type Manager struct {
	cfg               config.AuthConfig
	mu                sync.RWMutex
	sessions          map[string]Session
	stateStore        map[string]time.Time
	codeVerifierStore map[string]string // state -> codeVerifier for PKCE
}

func NewManager(cfg config.AuthConfig) *Manager {
	return &Manager{
		cfg:               cfg,
		sessions:          make(map[string]Session),
		stateStore:        make(map[string]time.Time),
		codeVerifierStore: make(map[string]string),
	}
}

func (m *Manager) NewSessionFromOIDC(subject string, token OIDCTokenPayload) Session {
	id := newID()
	s := Session{
		ID:           id,
		Source:       SourceOIDC,
		Subject:      subject,
		AccessToken:  token.AccessToken,
		RefreshToken: token.RefreshToken,
		TokenType:    token.TokenType,
		ExpiresAt:    token.Expiry,
		Context:      m.cfg.DefaultContext, // Use backend's kube context
		CreatedAt:    time.Now(),
	}
	m.mu.Lock()
	m.sessions[id] = s
	m.mu.Unlock()
	return s
}

func (m *Manager) NewSessionFromKubeconfig(subject, rawConfig, context string) Session {
	id := newID()
	s := Session{
		ID:          id,
		Source:      SourceKubeconfig,
		Subject:     subject,
		Kubeconfig:  rawConfig,
		Context:     context,
		ExpiresAt:   time.Now().Add(m.cfg.SessionTTL),
		CreatedAt:   time.Now(),
		AccessToken: "",
	}
	m.mu.Lock()
	m.sessions[id] = s
	m.mu.Unlock()
	return s
}

func (m *Manager) NewSessionFromLocal(username, role, context string) Session {
	id := newID()
	s := Session{
		ID:        id,
		Source:    SourceLocal,
		Subject:   username,
		Context:   context,
		ExpiresAt: time.Now().Add(m.cfg.SessionTTL),
		CreatedAt: time.Now(),
	}
	m.mu.Lock()
	m.sessions[id] = s
	m.mu.Unlock()
	return s
}

func (m *Manager) SessionByID(id string) (Session, bool) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	s, ok := m.sessions[id]
	if !ok {
		return Session{}, false
	}
	if s.ExpiresAt.Before(time.Now()) && s.Source != SourceOIDC {
		return Session{}, false
	}
	return s, true
}

func (m *Manager) DeleteSession(id string) {
	m.mu.Lock()
	delete(m.sessions, id)
	m.mu.Unlock()
}

func (m *Manager) WriteSessionCookie(c *gin.Context, sessionID string) {
	httpOnly := true
	secure := m.cfg.SessionSecure
	sameSite := http.SameSiteLaxMode
	domain := m.cfg.SessionDomain

	c.SetCookie(
		m.cookieName(),
		sessionID,
		int(m.cfg.SessionTTL.Seconds()),
		"/",
		domain,
		secure,
		httpOnly,
	)
	c.SetSameSite(sameSite)
}

func (m *Manager) ClearSessionCookie(c *gin.Context) {
	c.SetCookie(m.cookieName(), "", -1, "/", m.cfg.SessionDomain, m.cfg.SessionSecure, true)
}

func (m *Manager) SessionFromRequest(c *gin.Context) (Session, bool) {
	sessionID, err := c.Cookie(m.cookieName())
	if err != nil {
		return Session{}, false
	}
	return m.SessionByID(sessionID)
}

// State helpers -------------------------------------------------------------

func (m *Manager) NewState() string {
	state := newID()
	m.mu.Lock()
	m.stateStore[state] = time.Now().Add(10 * time.Minute)
	m.mu.Unlock()
	return state
}

func (m *Manager) ValidateState(state string) bool {
	m.mu.Lock()
	defer m.mu.Unlock()
	expiry, ok := m.stateStore[state]
	if !ok {
		return false
	}
	delete(m.stateStore, state)
	return time.Now().Before(expiry)
}

// StoreCodeVerifier saves the PKCE code verifier for a given state
func (m *Manager) StoreCodeVerifier(state, verifier string) {
	m.mu.Lock()
	m.codeVerifierStore[state] = verifier
	m.mu.Unlock()
}

// GetCodeVerifier retrieves and removes the PKCE code verifier for a given state
func (m *Manager) GetCodeVerifier(state string) string {
	m.mu.Lock()
	defer m.mu.Unlock()
	verifier := m.codeVerifierStore[state]
	delete(m.codeVerifierStore, state)
	return verifier
}

func (m *Manager) cookieName() string {
	if m.cfg.SessionName != "" {
		return m.cfg.SessionName
	}
	return "kz_session"
}

// Token payload coming back from OIDC exchange.
type OIDCTokenPayload struct {
	AccessToken  string
	RefreshToken string
	TokenType    string
	Expiry       time.Time
	Subject      string
	Email        string
	Name         string
}

// Helper to pick the best display subject.
func DisplayName(payload OIDCTokenPayload) string {
	switch {
	case payload.Email != "":
		return payload.Email
	case payload.Name != "":
		return payload.Name
	case payload.Subject != "":
		return payload.Subject
	default:
		return "user"
	}
}

// Errors
var ErrInvalidState = errors.New("invalid OIDC state")

func newID() string {
	buf := make([]byte, 16)
	_, _ = rand.Read(buf)
	return hex.EncodeToString(buf)
}
