package handler

import (
	"net/http"

	"chess-tutor/dto"
	"chess-tutor/service"

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
			"message": "Invalid request body",
		})
		return
	}

	if req.Depth <= 0 || req.Depth > 25 {
		req.Depth = 15
	}

	result, err := h.service.AnalyzePosition(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  http.StatusInternalServerError,
			"message": "Failed to analyze position",
		})
		return
	}

	c.JSON(http.StatusOK, result)
}
