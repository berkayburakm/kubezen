package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"kubezen/internal/auth"
	"kubezen/internal/config"
)

// Auth ensures a valid session exists unless dev bypass is enabled.
func Auth(manager *auth.Manager, cfg config.AuthConfig) gin.HandlerFunc {
	return func(c *gin.Context) {
		if cfg.EnableDevBypass {
			c.Next()
			return
		}

		session, ok := manager.SessionFromRequest(c)
		if !ok {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": "unauthorized",
			})
			return
		}

		auth.SetSession(c, session)
		c.Next()
	}
}
