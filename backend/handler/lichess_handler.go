package handler

import (
	"net/http"

	"chess-tutor/dto"
	"chess-tutor/repository"
	"chess-tutor/service"

	"github.com/gin-gonic/gin"
)

type LichessHandler struct {
	lichessService service.LichessService
	gameService    service.GameService
	userRepo       repository.UserRepository
}

func NewLichessHandler(
	lichessService service.LichessService,
	gameService service.GameService,
	userRepo repository.UserRepository,
) *LichessHandler {
	return &LichessHandler{
		lichessService: lichessService,
		gameService:    gameService,
		userRepo:       userRepo,
	}
}

func (h *LichessHandler) SyncGames(c *gin.Context) {
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

	if user.LichessUsername == "" {
		c.JSON(http.StatusBadRequest, gin.H{"status": http.StatusBadRequest, "message": "No Lichess username linked to this account"})
		return
	}

	since, err := h.gameService.GetLatestPlayedAt(user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"status": http.StatusInternalServerError, "message": "Failed to read latest game"})
		return
	}

	gamesDTO, err := h.lichessService.GetUserGames(user.LichessUsername, since)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"status": http.StatusInternalServerError, "message": "Failed to fetch games from Lichess"})
		return
	}

	inserted, err := h.gameService.InsertNewGames(dto.ToGameList(gamesDTO, user.ID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"status": http.StatusInternalServerError, "message": "Failed to store games"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":   http.StatusOK,
		"message":  "Sync complete",
		"received": len(gamesDTO),
		"inserted": inserted,
	})
}
