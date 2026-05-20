package service

import (
	"errors"
	"strings"

	"golang.org/x/crypto/bcrypt"

	"chess-tutor/dto"
	"chess-tutor/model"
	"chess-tutor/repository"
)

var validDifficulties = map[string]bool{
	"beginner": true,
	"easy":     true,
	"medium":   true,
	"hard":     true,
	"master":   true,
}

type ProfileService interface {
	GetProfile(user *model.User) (*dto.ProfileResponse, error)
	UpdateProfile(user *model.User, req dto.UpdateProfileRequest) (*dto.ProfileResponse, error)
	ChangePassword(user *model.User, req dto.ChangePasswordRequest) error
}

type profileService struct {
	userRepo repository.UserRepository
	gameRepo repository.GameRepository
}

func NewProfileService(userRepo repository.UserRepository, gameRepo repository.GameRepository) ProfileService {
	return &profileService{userRepo: userRepo, gameRepo: gameRepo}
}

func (s *profileService) GetProfile(user *model.User) (*dto.ProfileResponse, error) {
	_, total, err := s.gameRepo.ListByUser(user.ID, user.LichessUsername, dto.GameListQuery{Limit: 1})
	if err != nil {
		return nil, err
	}

	defaultDiff := user.DefaultCoachDifficulty
	if defaultDiff == "" {
		defaultDiff = "medium"
	}

	var memberSince int64
	if user.CreatedAt.Year() >= 2000 {
		memberSince = user.CreatedAt.UnixMilli()
	}

	return &dto.ProfileResponse{
		Username:               user.Username,
		LichessUsername:        user.LichessUsername,
		MemberSince:            memberSince,
		GamesCount:             total,
		LastSyncedAt:           user.LastSyncedAt,
		DefaultCoachDifficulty: defaultDiff,
	}, nil
}

func (s *profileService) UpdateProfile(user *model.User, req dto.UpdateProfileRequest) (*dto.ProfileResponse, error) {
	updates := map[string]interface{}{}

	if req.LichessUsername != nil {
		trimmed := strings.TrimSpace(*req.LichessUsername)
		updates["lichess_username"] = trimmed
	}

	if req.DefaultCoachDifficulty != nil {
		d := strings.ToLower(strings.TrimSpace(*req.DefaultCoachDifficulty))
		if !validDifficulties[d] {
			return nil, errors.New("invalid difficulty")
		}
		updates["default_coach_difficulty"] = d
	}

	if len(updates) > 0 {
		if err := s.userRepo.UpdateFields(user.ID, updates); err != nil {
			return nil, err
		}
	}

	// Re-fetch the user so the response reflects the new state
	updated, err := s.userRepo.FindByID(user.ID)
	if err != nil {
		return nil, err
	}

	return s.GetProfile(updated)
}

func (s *profileService) ChangePassword(user *model.User, req dto.ChangePasswordRequest) error {
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.CurrentPassword)); err != nil {
		return errors.New("current password is incorrect")
	}

	if len(req.NewPassword) < 6 {
		return errors.New("new password must be at least 6 characters")
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	return s.userRepo.UpdateFields(user.ID, map[string]interface{}{
		"password": string(hash),
	})
}
