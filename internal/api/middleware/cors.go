package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

// CORS allows simple configuration using an allowed list. If "*" is present,
// all origins are accepted (useful for local development).
func CORS(allowedOrigins []string) gin.HandlerFunc {
	normalized := normalizeOrigins(allowedOrigins)
	return func(c *gin.Context) {
		origin := c.GetHeader("Origin")
		if origin == "" {
			c.Next()
			return
		}

		if normalized["*"] || normalized[strings.ToLower(origin)] {
			c.Header("Access-Control-Allow-Origin", origin)
			c.Header("Vary", "Origin")
			c.Header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS")
			c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")
			c.Header("Access-Control-Allow-Credentials", "true")
		}

		if c.Request.Method == http.MethodOptions {
			c.Status(http.StatusNoContent)
			c.Abort()
			return
		}

		c.Next()
	}
}

func normalizeOrigins(origins []string) map[string]bool {
	allowed := make(map[string]bool, len(origins))
	for _, o := range origins {
		trimmed := strings.ToLower(strings.TrimSpace(o))
		if trimmed == "" {
			continue
		}
		allowed[trimmed] = true
	}
	if len(allowed) == 0 {
		allowed["*"] = true
	}
	return allowed
}
