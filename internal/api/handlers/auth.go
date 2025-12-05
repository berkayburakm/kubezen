package handlers

import (
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"k8s.io/client-go/tools/clientcmd"

	"kubezen/internal/auth"
)

type kubeconfigRequest struct {
	Kubeconfig string `json:"kubeconfig"`
	Context    string `json:"context"`
	User       string `json:"user"`
}

type sessionResponse struct {
	Subject    string `json:"subject"`
	Source     string `json:"source"`
	Context    string `json:"context,omitempty"`
	HasRefresh bool   `json:"hasRefresh"`
	ExpiresAt  string `json:"expiresAt,omitempty"`
}

func OIDCStart(manager *auth.Manager, client *auth.OIDCClient) gin.HandlerFunc {
	return func(c *gin.Context) {
		if client == nil {
			respondError(c, http.StatusServiceUnavailable, ErrServiceUnavailable)
			return
		}
		state := manager.NewState()
		url, codeVerifier, err := client.AuthCodeURL(state)
		if err != nil {
			respondError(c, http.StatusInternalServerError, err)
			return
		}
		// Store codeVerifier with state for PKCE flow
		manager.StoreCodeVerifier(state, codeVerifier)
		respondOK(c, gin.H{"url": url, "state": state})
	}
}

func OIDCCallback(manager *auth.Manager, client *auth.OIDCClient) gin.HandlerFunc {
	return func(c *gin.Context) {
		if client == nil {
			respondError(c, http.StatusServiceUnavailable, ErrServiceUnavailable)
			return
		}
		state := c.Query("state")
		if !manager.ValidateState(state) {
			respondError(c, http.StatusBadRequest, auth.ErrInvalidState)
			return
		}
		code := c.Query("code")
		if code == "" {
			respondError(c, http.StatusBadRequest, ErrBadRequest)
			return
		}
		// Retrieve codeVerifier for PKCE
		codeVerifier := manager.GetCodeVerifier(state)
		payload, err := client.Exchange(c.Request.Context(), code, codeVerifier)
		if err != nil {
			respondError(c, http.StatusBadRequest, err)
			return
		}
		session := manager.NewSessionFromOIDC(auth.DisplayName(payload), payload)
		manager.WriteSessionCookie(c, session.ID)
		respondOK(c, toSessionResponse(session))
	}
}

func KubeconfigLogin(manager *auth.Manager) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req kubeconfigRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			respondError(c, http.StatusBadRequest, err)
			return
		}
		req.Context = strings.TrimSpace(req.Context)
		cfg, err := clientcmd.Load([]byte(req.Kubeconfig))
		if err != nil {
			respondError(c, http.StatusBadRequest, err)
			return
		}
		contextName := req.Context
		if contextName == "" {
			contextName = cfg.CurrentContext
		}
		if _, ok := cfg.Contexts[contextName]; !ok {
			respondError(c, http.StatusBadRequest, ErrBadRequest)
			return
		}

		subject := req.User
		if subject == "" {
			subject = contextName
		}

		session := manager.NewSessionFromKubeconfig(subject, req.Kubeconfig, contextName)
		manager.WriteSessionCookie(c, session.ID)
		respondOK(c, toSessionResponse(session))
	}
}

func SessionInfo(manager *auth.Manager) gin.HandlerFunc {
	return func(c *gin.Context) {
		session, ok := manager.SessionFromRequest(c)
		if !ok {
			c.AbortWithStatus(http.StatusUnauthorized)
			return
		}
		respondOK(c, toSessionResponse(session))
	}
}

func Logout(manager *auth.Manager) gin.HandlerFunc {
	return func(c *gin.Context) {
		session, ok := manager.SessionFromRequest(c)
		if ok {
			manager.DeleteSession(session.ID)
		}
		manager.ClearSessionCookie(c)
		c.Status(http.StatusNoContent)
	}
}

func toSessionResponse(session auth.Session) sessionResponse {
	resp := sessionResponse{
		Subject:    session.Subject,
		Source:     string(session.Source),
		Context:    session.Context,
		HasRefresh: session.RefreshToken != "",
	}
	if !session.ExpiresAt.IsZero() {
		resp.ExpiresAt = session.ExpiresAt.UTC().Format(time.RFC3339)
	}
	return resp
}
