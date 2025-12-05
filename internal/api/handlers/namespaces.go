package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"kubezen/internal/k8s"
)

func ListNamespaces(svc *k8s.Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		namespaces, err := svc.ListNamespaces(c.Request.Context())
		if err != nil {
			respondError(c, http.StatusInternalServerError, err)
			return
		}

		respondOK(c, k8s.ListResponse[k8s.NamespaceSummary]{
			Items: namespaces,
			Count: len(namespaces),
		})
	}
}

type namespaceRequest struct {
	Name string `json:"name" binding:"required"`
}

func CreateNamespace(svc *k8s.Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req namespaceRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			respondError(c, http.StatusBadRequest, err)
			return
		}
		if err := svc.CreateNamespace(c.Request.Context(), req.Name); err != nil {
			respondError(c, http.StatusInternalServerError, err)
			return
		}
		c.Status(http.StatusCreated)
	}
}

func DeleteNamespace(svc *k8s.Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		name := c.Param("name")
		if name == "" {
			respondError(c, http.StatusBadRequest, ErrBadRequest)
			return
		}
		if err := svc.DeleteNamespace(c.Request.Context(), name); err != nil {
			respondError(c, http.StatusInternalServerError, err)
			return
		}
		c.Status(http.StatusNoContent)
	}
}
