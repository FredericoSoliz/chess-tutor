package model

type Game struct {
	ID        uint   `gorm:"primaryKey"`
	LichessID string `gorm:"uniqueIndex"`

	UserID uint
	User   User `gorm:"foreignKey:UserID"`

	White  string
	Black  string
	Winner string
	Moves  string
}
