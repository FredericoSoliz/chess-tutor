package handler

import (
	"chess-tutor/dto"
	"chess-tutor/service"
	"net/http"

	"github.com/gin-gonic/gin"
)

type EngineHandler struct {
	service service.EngineService
}

func NewEngineHandler(service service.EngineService) *EngineHandler {
	return &EngineHandler{service: service}
}

func (h *EngineHandler) AnalyzePosition(c *gin.Context) {
	var req dto.AnalyzePositionRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  http.StatusBadRequest,
			"message": "Check request!",
		})
		return
	}

	if req.Depth == 0 {
		req.Depth = 15
	}

	result, err := h.service.AnalyzePosition(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  http.StatusInternalServerError,
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status": http.StatusOK,
		"data":   result,
	})
}
