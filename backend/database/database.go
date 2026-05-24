package database

import (
	"fmt"
	"log"
	"os"

	"chess-tutor/model"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func InitDB() {
	dsn := buildDSN()

	var err error
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect DB:", err)
	}

	fmt.Println("Running migrations...")
	err = DB.AutoMigrate(&model.User{}, &model.Game{})
	fmt.Println("Finished migrations")

	if err != nil {
		log.Fatal("Failed to migrate DB:", err)
	}

	fmt.Println("Connected to PostgreSQL and migrated")
}

func buildDSN() string {
	if url := os.Getenv("DATABASE_URL"); url != "" {
		return url
	}
	return fmt.Sprintf(
		"host=%s user=%s password=%s dbname=%s port=%s sslmode=disable",
		os.Getenv("DB_HOST"),
		os.Getenv("DB_USER"),
		os.Getenv("DB_PASSWORD"),
		os.Getenv("DB_NAME"),
		os.Getenv("DB_PORT"),
	)
}
