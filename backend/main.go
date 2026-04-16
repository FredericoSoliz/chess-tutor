package main

import (
	"chess-tutor/database"
	"chess-tutor/handler"
	"chess-tutor/service"

	"github.com/gin-gonic/gin"
)

func main() {
	database.InitDB()

	r := gin.Default()

	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status": "ok",
		})
	})

	lichessService := service.NewLichessService()
	lichessHandler := handler.NewLichessHandler(lichessService)

	engineService := service.NewEngineService()
	engineHandler := handler.NewEngineHandler(engineService)

	r.GET("/lichess/games/:username", lichessHandler.GetLichessGames)
	r.POST("/api/analyze/position", engineHandler.AnalyzePosition)

	r.Run(":8080")
}
