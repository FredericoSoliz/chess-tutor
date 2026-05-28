package main

import (
	"chess-tutor/database"
	"chess-tutor/handler"
	"chess-tutor/middleware"
	"chess-tutor/repository"
	"chess-tutor/service"
	"os"
	"strings"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	database.InitDB()

	r := gin.Default()

	allowedOrigins := []string{"http://localhost:5173"}
	if raw := os.Getenv("CORS_ALLOWED_ORIGINS"); raw != "" {
		allowedOrigins = strings.Split(raw, ",")
		for i, o := range allowedOrigins {
			allowedOrigins[i] = strings.TrimSpace(o)
		}
	}

	r.Use(cors.New(cors.Config{
		AllowOrigins:     allowedOrigins,
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":  "ok",
			"service": "backend",
		})
	})

	gameRepo := repository.NewGameRepository(database.DB)
	userRepo := repository.NewUserRepository(database.DB)

	lichessService := service.NewLichessService()
	gameService := service.NewGameService(gameRepo)
	lichessHandler := handler.NewLichessHandler(lichessService, gameService, userRepo)
	gameHandler := handler.NewGameHandler(gameService, userRepo)

	engineService := service.NewEngineService()
	engineHandler := handler.NewEngineHandler(engineService, gameRepo, userRepo)

	statsService := service.NewStatsService(gameRepo)
	statsHandler := handler.NewStatsHandler(statsService, userRepo)

	coachHandler := handler.NewCoachHandler(engineService)

	profileService := service.NewProfileService(userRepo, gameRepo)
	profileHandler := handler.NewProfileHandler(profileService, userRepo)

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
	protected.POST("/api/analyze/game/:id", engineHandler.AnalyzeGame)
	protected.POST("/api/analyze/pgn", engineHandler.AnalyzePgn)
	protected.GET("/api/dashboard", statsHandler.GetDashboard)
	protected.POST("/api/coach/move", coachHandler.Move)
	protected.GET("/api/profile", profileHandler.Get)
	protected.PATCH("/api/profile", profileHandler.Update)
	protected.POST("/api/profile/password", profileHandler.ChangePassword)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	r.Run(":" + port)
}
