package handlers

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"

	"kubezen/internal/k8s"
)

func ListEvents(svc *k8s.Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		namespace := strings.TrimSpace(c.Query("namespace"))
		events, err := svc.ListEvents(c.Request.Context(), namespace)
		if err != nil {
			respondError(c, http.StatusInternalServerError, err)
			return
		}
		respondOK(c, k8s.ListResponse[k8s.EventSummary]{
			Items: events,
			Count: len(events),
		})
	}
}
