package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"kubezen/internal/auth"
	"kubezen/internal/store"
)

type authStatusResponse struct {
	NeedsSetup  bool     `json:"needsSetup"`
	AuthMethods []string `json:"authMethods"`
}

type setupRequest struct {
	Username string `json:"username" binding:"required,min=3,max=50"`
	Password string `json:"password" binding:"required,min=6"`
}

type loginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

// AuthStatus returns whether initial setup is needed and available auth methods.
func AuthStatus(userStore *store.Store, oidcEnabled bool) gin.HandlerFunc {
	return func(c *gin.Context) {
		count, err := userStore.CountUsers()
		if err != nil {
			respondError(c, http.StatusInternalServerError, err)
			return
		}

		methods := []string{"local"}
		if oidcEnabled {
			methods = append(methods, "oidc")
		}

		respondOK(c, authStatusResponse{
			NeedsSetup:  count == 0,
			AuthMethods: methods,
		})
	}
}

// InitialSetup creates the first admin user. Only works when no users exist.
func InitialSetup(userStore *store.Store, manager *auth.Manager, defaultContext string) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Check if setup is already done
		count, err := userStore.CountUsers()
		if err != nil {
			respondError(c, http.StatusInternalServerError, err)
			return
		}
		if count > 0 {
			respondError(c, http.StatusForbidden, ErrBadRequest)
			return
		}

		var req setupRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			respondError(c, http.StatusBadRequest, err)
			return
		}

		// Create admin user
		user, err := userStore.CreateUser(req.Username, req.Password, "admin")
		if err != nil {
			if err == store.ErrUserAlreadyExists {
				respondError(c, http.StatusConflict, err)
				return
			}
			respondError(c, http.StatusInternalServerError, err)
			return
		}

		// Create session
		session := manager.NewSessionFromLocal(user.Username, user.Role, defaultContext)
		manager.WriteSessionCookie(c, session.ID)

		respondOK(c, sessionResponse{
			Subject:    session.Subject,
			Source:     string(session.Source),
			Context:    session.Context,
			HasRefresh: false,
		})
	}
}

// LocalLogin authenticates a user with username and password.
func LocalLogin(userStore *store.Store, manager *auth.Manager, defaultContext string) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req loginRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			respondError(c, http.StatusBadRequest, err)
			return
		}

		// Get user
		user, err := userStore.GetUserByUsername(req.Username)
		if err != nil {
			if err == store.ErrUserNotFound {
				respondError(c, http.StatusUnauthorized, store.ErrInvalidPassword)
				return
			}
			respondError(c, http.StatusInternalServerError, err)
			return
		}

		// Verify password
		if !userStore.VerifyPassword(user, req.Password) {
			respondError(c, http.StatusUnauthorized, store.ErrInvalidPassword)
			return
		}

		// Create session
		session := manager.NewSessionFromLocal(user.Username, user.Role, defaultContext)
		manager.WriteSessionCookie(c, session.ID)

		respondOK(c, sessionResponse{
			Subject:    session.Subject,
			Source:     string(session.Source),
			Context:    session.Context,
			HasRefresh: false,
		})
	}
}
