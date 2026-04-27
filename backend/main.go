package main

import (
	"chess-tutor/database"
	"chess-tutor/handler"
	"chess-tutor/middleware"
	"chess-tutor/service"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	database.InitDB()

	r := gin.Default()

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status": "ok",
		})
	})

	lichessService := service.NewLichessService()
	lichessHandler := handler.NewLichessHandler(lichessService)

	engineService := service.NewEngineService()
	engineHandler := handler.NewEngineHandler(engineService)

	authService := service.NewAuthService()
	jwtService := service.NewJWTService()

	authHandler := handler.NewAuthHandler(authService, jwtService)

	r.POST("/auth/register", authHandler.Register)
	r.POST("/auth/login", authHandler.Login)

	protected := r.Group("/")
	protected.Use(middleware.AuthMiddleware(jwtService))

	protected.GET("/lichess/games/:username", lichessHandler.GetLichessGames)
	protected.POST("/api/analyze/position", engineHandler.AnalyzePosition)

	r.Run(":8080")
}
