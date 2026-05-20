package model

import "time"

type User struct {
	ID                     uint      `gorm:"primaryKey"`
	Username               string    `gorm:"uniqueIndex;not null"`
	Password               string    `gorm:"not null"`
	LichessUsername        string    `gorm:"default:null"`
	LastSyncedAt           int64     `gorm:"default:0"`
	DefaultCoachDifficulty string    `gorm:"default:'medium'"`
	CreatedAt              time.Time
}
