package handler

import (
	"net/http"

	"chess-tutor/dto"
	"chess-tutor/model"
	"chess-tutor/repository"
	"chess-tutor/service"

	"github.com/gin-gonic/gin"
)

type ProfileHandler struct {
	profileService service.ProfileService
	userRepo       repository.UserRepository
}

func NewProfileHandler(profileService service.ProfileService, userRepo repository.UserRepository) *ProfileHandler {
	return &ProfileHandler{
		profileService: profileService,
		userRepo:       userRepo,
	}
}

func (h *ProfileHandler) loadUser(c *gin.Context) *model.User {
	usernameVal, exists := c.Get("username")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Unauthorized"})
		return nil
	}
	user, err := h.userRepo.FindByUsername(usernameVal.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "User not found"})
		return nil
	}
	return user
}

func (h *ProfileHandler) Get(c *gin.Context) {
	user := h.loadUser(c)
	if user == nil {
		return
	}

	profile, err := h.profileService.GetProfile(user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to load profile"})
		return
	}
	c.JSON(http.StatusOK, profile)
}

func (h *ProfileHandler) Update(c *gin.Context) {
	user := h.loadUser(c)
	if user == nil {
		return
	}

	var req dto.UpdateProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid request body"})
		return
	}

	profile, err := h.profileService.UpdateProfile(user, req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, profile)
}

func (h *ProfileHandler) ChangePassword(c *gin.Context) {
	user := h.loadUser(c)
	if user == nil {
		return
	}

	var req dto.ChangePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "current_password and new_password (min 6 chars) are required"})
		return
	}

	if err := h.profileService.ChangePassword(user, req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Password updated"})
}
