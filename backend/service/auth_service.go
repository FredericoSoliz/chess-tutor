package service

import (
	"errors"

	"golang.org/x/crypto/bcrypt"

	"chess-tutor/database"
	"chess-tutor/dto"
	"chess-tutor/model"
)

type AuthService interface {
	Register(req dto.RegisterRequest) (*model.User, error)
	Login(req dto.LoginRequest) (*model.User, error)
}

type authService struct{}

func NewAuthService() AuthService {
	return &authService{}
}

func (s *authService) Register(req dto.RegisterRequest) (*model.User, error) {
	var existing model.User

	if err := database.DB.Where("username = ?", req.Username).First(&existing).Error; err == nil {
		return nil, errors.New("username already exists")
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	user := &model.User{
		Username:        req.Username,
		Password:        string(hash),
		LichessUsername: req.LichessUsername,
	}

	if err := database.DB.Create(user).Error; err != nil {
		return nil, err
	}

	return user, nil
}

func (s *authService) Login(req dto.LoginRequest) (*model.User, error) {
	var user model.User

	if err := database.DB.Where("username = ?", req.Username).First(&user).Error; err != nil {
		return nil, errors.New("invalid credentials")
	}

	err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password))
	if err != nil {
		return nil, errors.New("invalid credentials")
	}

	return &user, nil
}
