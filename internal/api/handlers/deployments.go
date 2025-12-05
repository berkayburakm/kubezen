package handlers

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"

	"kubezen/internal/k8s"
)

func ListDeployments(svc *k8s.Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		namespace := strings.TrimSpace(c.Query("namespace"))

		deployments, err := svc.ListDeployments(c.Request.Context(), namespace)
		if err != nil {
			respondError(c, http.StatusInternalServerError, err)
			return
		}

		respondOK(c, k8s.ListResponse[k8s.DeploymentSummary]{
			Items: deployments,
			Count: len(deployments),
		})
	}
}

func GetDeployment(svc *k8s.Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		namespace := c.Param("namespace")
		name := c.Param("name")
		deploy, err := svc.GetDeployment(c.Request.Context(), namespace, name)
		if err != nil {
			respondError(c, http.StatusNotFound, err)
			return
		}
		respondOK(c, deploy)
	}
}
