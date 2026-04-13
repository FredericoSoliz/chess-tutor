package handler

import (
	"net/http"

	"chess-tutor/database"
	"chess-tutor/dto"
	"chess-tutor/model"
	"chess-tutor/service"

	"github.com/gin-gonic/gin"
)

func GetLichessGames(c *gin.Context) {
	username := c.Param("username")

	gamesDTO, err := service.GetUserGames(username)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	var user model.User
	database.DB.FirstOrCreate(&user, model.User{
		Username: username,
	})

	games := dto.ToGameList(gamesDTO, user.ID)

	for _, g := range games {
		var existing model.Game

		err := database.DB.
			Where("lichess_id = ?", g.LichessID).
			First(&existing).Error

		if err != nil {
			database.DB.Create(&g)
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "games saved",
		"count":   len(games),
	})
}
