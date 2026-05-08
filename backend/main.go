package main

import (
	"chess-tutor/database"
	"chess-tutor/handler"
	"chess-tutor/middleware"
	"chess-tutor/repository"
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

	gameRepo := repository.NewGameRepository(database.DB)
	userRepo := repository.NewUserRepository(database.DB)

	lichessService := service.NewLichessService()
	gameService := service.NewGameService(gameRepo)
	lichessHandler := handler.NewLichessHandler(lichessService, gameService, userRepo)
	gameHandler := handler.NewGameHandler(gameService, userRepo)

	engineService := service.NewEngineService()
	engineHandler := handler.NewEngineHandler(engineService)

	authService := service.NewAuthService(userRepo)
	jwtService := service.NewJWTService()

	authHandler := handler.NewAuthHandler(authService, jwtService)

	r.POST("/auth/register", authHandler.Register)
	r.POST("/auth/login", authHandler.Login)

	protected := r.Group("/")
	protected.Use(middleware.AuthMiddleware(jwtService))

	protected.POST("/lichess/sync", lichessHandler.SyncGames)
	protected.GET("/api/games", gameHandler.ListGames)
	protected.GET("/api/games/:id", gameHandler.GetGame)
	protected.POST("/api/analyze/position", engineHandler.AnalyzePosition)

	r.Run(":8080")
}
