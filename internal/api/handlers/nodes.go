package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"kubezen/internal/k8s"
)

func ListNodes(svc *k8s.Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		nodes, err := svc.ListNodes(c.Request.Context())
		if err != nil {
			respondError(c, http.StatusInternalServerError, err)
			return
		}

		respondOK(c, k8s.ListResponse[k8s.NodeSummary]{
			Items: nodes,
			Count: len(nodes),
		})
	}
}

func GetNode(svc *k8s.Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		name := c.Param("name")
		node, err := svc.GetNode(c.Request.Context(), name)
		if err != nil {
			respondError(c, http.StatusNotFound, err)
			return
		}
		respondOK(c, node)
	}
}
