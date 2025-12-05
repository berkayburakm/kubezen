package api

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"kubezen/internal/api/handlers"
	"kubezen/internal/api/middleware"
	"kubezen/internal/auth"
	"kubezen/internal/config"
	"kubezen/internal/k8s"
	"kubezen/internal/store"
	"kubezen/internal/version"
)

// NewRouter wires all HTTP routes and middleware.
func NewRouter(cfg config.Config, svc *k8s.Service, userStore *store.Store, authManager *auth.Manager, oidcClient *auth.OIDCClient) *gin.Engine {
	if cfg.Env == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	router := gin.New()
	router.Use(gin.Logger(), gin.Recovery(), middleware.CORS(cfg.Server.AllowedOrigins))
	router.GET("/healthz", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status": "ok",
		})
	})
	router.GET("/readyz", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status": "ready",
		})
	})

	oidcEnabled := oidcClient != nil
	defaultContext := cfg.Kube.Context

	apiGroup := router.Group("/api")
	authGroup := apiGroup.Group("/auth")
	authGroup.GET("/status", handlers.AuthStatus(userStore, oidcEnabled))
	authGroup.POST("/setup", handlers.InitialSetup(userStore, authManager, defaultContext))
	authGroup.POST("/login", handlers.LocalLogin(userStore, authManager, defaultContext))
	authGroup.POST("/kubeconfig", handlers.KubeconfigLogin(authManager))
	authGroup.GET("/oidc/start", handlers.OIDCStart(authManager, oidcClient))
	authGroup.GET("/oidc/callback", handlers.OIDCCallback(authManager, oidcClient))
	authGroup.GET("/session", handlers.SessionInfo(authManager))
	authGroup.POST("/logout", handlers.Logout(authManager))

	apiGroup.Use(middleware.Auth(authManager, cfg.Auth))
	apiGroup.GET("/version", func(c *gin.Context) {
		c.JSON(http.StatusOK, version.Info())
	})

	v1 := apiGroup.Group("/v1")
	v1.GET("/contexts", handlers.ListContexts(cfg.Kube.KubeconfigPath, cfg.Kube.Context))
	v1.GET("/pods", handlers.ListPods(svc))
	v1.GET("/pods/:namespace/:name", handlers.GetPod(svc))
	v1.GET("/nodes", handlers.ListNodes(svc))
	v1.GET("/nodes/:name", handlers.GetNode(svc))
	v1.GET("/deployments", handlers.ListDeployments(svc))
	v1.GET("/deployments/:namespace/:name", handlers.GetDeployment(svc))
	v1.GET("/namespaces", handlers.ListNamespaces(svc))
	v1.POST("/namespaces", handlers.CreateNamespace(svc))
	v1.DELETE("/namespaces/:name", handlers.DeleteNamespace(svc))
	v1.GET("/events", handlers.ListEvents(svc))

	return router
}


