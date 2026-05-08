package service

import (
	"errors"

	"golang.org/x/crypto/bcrypt"

	"chess-tutor/dto"
	"chess-tutor/model"
	"chess-tutor/repository"
)

type AuthService interface {
	Register(req dto.RegisterRequest) (*model.User, error)
	Login(req dto.LoginRequest) (*model.User, error)
}

type authService struct {
	userRepo repository.UserRepository
}

func NewAuthService(userRepo repository.UserRepository) AuthService {
	return &authService{userRepo: userRepo}
}

func (s *authService) Register(req dto.RegisterRequest) (*model.User, error) {
	exists, err := s.userRepo.UsernameExists(req.Username)
	if err != nil {
		return nil, err
	}
	if exists {
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

	if err := s.userRepo.Create(user); err != nil {
		return nil, err
	}

	return user, nil
}

func (s *authService) Login(req dto.LoginRequest) (*model.User, error) {
	user, err := s.userRepo.FindByUsername(req.Username)
	if err != nil {
		return nil, errors.New("invalid credentials")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		return nil, errors.New("invalid credentials")
	}

	return user, nil
}
