package repository

import (
	"chess-tutor/model"

	"gorm.io/gorm"
)

type UserRepository interface {
	FindByUsername(username string) (*model.User, error)
	FindByID(id uint) (*model.User, error)
	Create(user *model.User) error
	UsernameExists(username string) (bool, error)
}

type userRepository struct {
	db *gorm.DB
}

func NewUserRepository(db *gorm.DB) UserRepository {
	return &userRepository{db: db}
}

func (r *userRepository) FindByUsername(username string) (*model.User, error) {
	var user model.User

	if err := r.db.Where("username = ?", username).First(&user).Error; err != nil {
		return nil, err
	}

	return &user, nil
}

func (r *userRepository) FindByID(id uint) (*model.User, error) {
	var user model.User

	if err := r.db.First(&user, id).Error; err != nil {
		return nil, err
	}

	return &user, nil
}

func (r *userRepository) Create(user *model.User) error {
	return r.db.Create(user).Error
}

func (r *userRepository) UsernameExists(username string) (bool, error) {
	var count int64

	err := r.db.
		Model(&model.User{}).
		Where("username = ?", username).
		Count(&count).Error

	return count > 0, err
}
