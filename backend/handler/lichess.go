package handler

import (
	"errors"
	"net/http"

	"chess-tutor/database"
	"chess-tutor/dto"
	"chess-tutor/model"
	"chess-tutor/service"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type LichessHandler struct {
	service service.LichessService
}

func NewLichessHandler(service service.LichessService) *LichessHandler {
	return &LichessHandler{service: service}
}

func (h *LichessHandler) GetLichessGames(c *gin.Context) {
	var req dto.GetLichessGamesRequest

	if err := c.ShouldBindUri(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  http.StatusBadRequest,
			"message": "Invalid username!",
		})
		return
	}

	gamesDTO, err := h.service.GetUserGames(req.Username)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  http.StatusInternalServerError,
			"message": "Failed to fetch games!",
		})
		return
	}

	var user model.User

	database.DB.FirstOrCreate(&user, model.User{
		Username: req.Username,
	})

	games := dto.ToGameList(gamesDTO, user.ID)

	inserted := 0

	for _, g := range games {
		var existing model.Game

		err := database.DB.
			Where("lichess_id = ?", g.LichessID).
			First(&existing).Error

		if errors.Is(err, gorm.ErrRecordNotFound) {
			database.DB.Create(&g)
			inserted++
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"status":   http.StatusOK,
		"message":  "Games processed!",
		"received": len(games),
		"inserted": inserted,
	})
}
