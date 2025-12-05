package handlers

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"

	"kubezen/internal/k8s"
)

func ListPods(svc *k8s.Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		limit, offset := parsePagination(c)
		options := k8s.ListOptions{
			Namespace:     strings.TrimSpace(c.Query("namespace")),
			Status:        strings.TrimSpace(c.Query("status")),
			LabelSelector: strings.TrimSpace(c.Query("labels")),
			Query:         strings.TrimSpace(c.Query("q")),
			Limit:         limit,
			Offset:        offset,
		}

		pods, total, err := svc.ListPods(c.Request.Context(), options)
		if err != nil {
			respondError(c, http.StatusInternalServerError, err)
			return
		}

		respondOK(c, k8s.ListResponse[k8s.PodSummary]{
			Items: pods,
			Count: total,
		})
	}
}

func GetPod(svc *k8s.Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		namespace := c.Param("namespace")
		name := c.Param("name")
		pod, err := svc.GetPod(c.Request.Context(), namespace, name)
		if err != nil {
			respondError(c, http.StatusNotFound, err)
			return
		}
		respondOK(c, pod)
	}
}
