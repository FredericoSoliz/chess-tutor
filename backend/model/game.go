package model

import (
	"gorm.io/datatypes"
)

type Game struct {
	ID        uint   `gorm:"primaryKey"`
	LichessID string `gorm:"uniqueIndex;not null"`

	UserID uint
	User   User `gorm:"foreignKey:UserID"`

	White string `gorm:"not null"`
	Black string `gorm:"not null"`

	WhiteRating int
	BlackRating int

	Winner   string
	PlayedAt int64 `gorm:"index"`

	Data datatypes.JSON `gorm:"type:jsonb"`
}
