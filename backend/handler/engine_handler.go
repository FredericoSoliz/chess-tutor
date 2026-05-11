package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"chess-tutor/dto"
	"chess-tutor/repository"
	"chess-tutor/service"

	"github.com/gin-gonic/gin"
)

type EngineHandler struct {
	service  service.EngineService
	gameRepo repository.GameRepository
	userRepo repository.UserRepository
}

func NewEngineHandler(
	service service.EngineService,
	gameRepo repository.GameRepository,
	userRepo repository.UserRepository,
) *EngineHandler {
	return &EngineHandler{
		service:  service,
		gameRepo: gameRepo,
		userRepo: userRepo,
	}
}

func (h *EngineHandler) AnalyzePosition(c *gin.Context) {
	var req dto.AnalyzePositionRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  http.StatusBadRequest,
			"message": "Invalid request body",
		})
		return
	}

	if req.Depth <= 0 || req.Depth > 25 {
		req.Depth = 15
	}

	result, err := h.service.AnalyzePosition(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  http.StatusInternalServerError,
			"message": "Failed to analyze position",
		})
		return
	}

	c.JSON(http.StatusOK, result)
}

func (h *EngineHandler) AnalyzeGame(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid game id"})
		return
	}

	usernameVal, exists := c.Get("username")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Unauthorized"})
		return
	}

	user, err := h.userRepo.FindByUsername(usernameVal.(string))
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Unauthorized"})
		return
	}

	game, err := h.gameRepo.FindByIDForUser(uint(id), user.ID)
	if err != nil || game == nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "Game not found"})
		return
	}

	var raw struct {
		PGN string `json:"pgn"`
	}
	if err := json.Unmarshal(game.Data, &raw); err != nil || raw.PGN == "" {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Game has no PGN"})
		return
	}

	result, err := h.service.AnalyzeGame(raw.PGN, 0.1)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Analysis failed"})
		return
	}

	result.GameID = idParam
	c.JSON(http.StatusOK, result)
}
