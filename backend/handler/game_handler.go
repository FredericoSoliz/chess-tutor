package handler

import (
	"net/http"

	"chess-tutor/dto"
	"chess-tutor/repository"
	"chess-tutor/service"

	"github.com/gin-gonic/gin"
)

type GameHandler struct {
	gameService service.GameService
	userRepo    repository.UserRepository
}

func NewGameHandler(gameService service.GameService, userRepo repository.UserRepository) *GameHandler {
	return &GameHandler{
		gameService: gameService,
		userRepo:    userRepo,
	}
}

func (h *GameHandler) ListGames(c *gin.Context) {
	usernameInterface, exists := c.Get("username")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"status": http.StatusUnauthorized, "message": "Unauthorized"})
		return
	}

	user, err := h.userRepo.FindByUsername(usernameInterface.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"status": http.StatusInternalServerError, "message": "User not found"})
		return
	}

	var query dto.GameListQuery
	if err := c.ShouldBindQuery(&query); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": http.StatusBadRequest, "message": "Invalid query parameters"})
		return
	}

	games, total, err := h.gameService.ListByUser(user.ID, user.LichessUsername, query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"status": http.StatusInternalServerError, "message": "Failed to list games"})
		return
	}

	c.JSON(http.StatusOK, dto.GameListResponse{
		Games: dto.ToGameListItems(games, user.LichessUsername),
		Total: total,
	})
}
