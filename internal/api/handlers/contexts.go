package handlers

import (
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/gin-gonic/gin"
	"k8s.io/client-go/tools/clientcmd"
	"k8s.io/client-go/util/homedir"
)

type ContextInfo struct {
	Name      string `json:"name"`
	Cluster   string `json:"cluster"`
	User      string `json:"user"`
	Namespace string `json:"namespace,omitempty"`
	IsCurrent bool   `json:"isCurrent"`
}

type ContextsResponse struct {
	Contexts       []ContextInfo `json:"contexts"`
	CurrentContext string        `json:"currentContext"`
}

// ListContexts returns all available contexts from kubeconfig
func ListContexts(kubeconfigPath, currentContext string) gin.HandlerFunc {
	return func(c *gin.Context) {
		path := kubeconfigPath
		if path == "" {
			// Try default locations
			if home := homedir.HomeDir(); home != "" {
				path = filepath.Join(home, ".kube", "config")
			}
		}
		// Expand ~ if present
		if strings.HasPrefix(path, "~") {
			if home := homedir.HomeDir(); home != "" {
				path = strings.Replace(path, "~", home, 1)
			}
		}
		// Check KUBECONFIG env var
		if envPath := os.Getenv("KUBECONFIG"); envPath != "" && path == "" {
			path = envPath
		}

		if path == "" {
			respondError(c, http.StatusNotFound, ErrNotFound)
			return
		}

		cfg, err := clientcmd.LoadFromFile(path)
		if err != nil {
			respondError(c, http.StatusInternalServerError, err)
			return
		}

		// Determine which context is current (priority: env var > kubeconfig)
		activeContext := currentContext
		if activeContext == "" {
			activeContext = cfg.CurrentContext
		}

		var contexts []ContextInfo
		for name, ctx := range cfg.Contexts {
			contexts = append(contexts, ContextInfo{
				Name:      name,
				Cluster:   ctx.Cluster,
				User:      ctx.AuthInfo,
				Namespace: ctx.Namespace,
				IsCurrent: name == activeContext,
			})
		}

		// Sort to put current context first
		for i, ctx := range contexts {
			if ctx.IsCurrent {
				contexts[0], contexts[i] = contexts[i], contexts[0]
				break
			}
		}

		respondOK(c, ContextsResponse{
			Contexts:       contexts,
			CurrentContext: activeContext,
		})
	}
}

