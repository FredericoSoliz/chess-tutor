package handler

import (
	"net/http"

	"chess-tutor/repository"
	"chess-tutor/service"

	"github.com/gin-gonic/gin"
)

type StatsHandler struct {
	statsService service.StatsService
	userRepo     repository.UserRepository
}

func NewStatsHandler(statsService service.StatsService, userRepo repository.UserRepository) *StatsHandler {
	return &StatsHandler{
		statsService: statsService,
		userRepo:     userRepo,
	}
}

func (h *StatsHandler) GetDashboard(c *gin.Context) {
	usernameVal, exists := c.Get("username")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Unauthorized"})
		return
	}

	user, err := h.userRepo.FindByUsername(usernameVal.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "User not found"})
		return
	}

	speed := c.Query("speed")

	summary, err := h.statsService.GetDashboard(user.ID, user.LichessUsername, speed)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to load dashboard"})
		return
	}

	c.JSON(http.StatusOK, summary)
}
