package handler

import (
	"net/http"

	"chess-tutor/dto"
	"chess-tutor/service"

	"github.com/gin-gonic/gin"
)

type AuthHandler struct {
	service service.AuthService
	jwt     service.JWTService
}

func NewAuthHandler(service service.AuthService, jwt service.JWTService) *AuthHandler {
	return &AuthHandler{
		service: service,
		jwt:     jwt,
	}
}

func (h *AuthHandler) Register(c *gin.Context) {
	var req dto.RegisterRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  http.StatusBadRequest,
			"message": "Bad request!",
		})
		return
	}

	user, err := h.service.Register(req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  http.StatusBadRequest,
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"status":  http.StatusCreated,
		"userId":  user.ID,
		"message": "User created!",
	})
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req dto.LoginRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  http.StatusBadRequest,
			"message": "Bad request!",
		})
		return
	}

	user, err := h.service.Login(req)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"status":  http.StatusUnauthorized,
			"message": "Invalid credentials!",
		})
		return
	}

	token, err := h.jwt.GenerateToken(user.Username)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  http.StatusInternalServerError,
			"message": "Failed to generate token",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  http.StatusOK,
		"token":   token,
		"message": "Success!",
	})
}
