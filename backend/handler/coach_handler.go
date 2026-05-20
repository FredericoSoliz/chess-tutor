package handler

import (
	"net/http"

	"chess-tutor/dto"
	"chess-tutor/service"

	"github.com/gin-gonic/gin"
)

type CoachHandler struct {
	engineService service.EngineService
}

func NewCoachHandler(engineService service.EngineService) *CoachHandler {
	return &CoachHandler{engineService: engineService}
}

func (h *CoachHandler) Move(c *gin.Context) {
	var req dto.CoachMoveRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid request body"})
		return
	}

	if req.Elo <= 0 {
		req.Elo = 1700
	}

	result, err := h.engineService.CoachMove(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Coach move failed"})
		return
	}

	c.JSON(http.StatusOK, result)
}
