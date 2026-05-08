package repository

import (
	"errors"
	"strings"

	"chess-tutor/dto"
	"chess-tutor/model"

	"gorm.io/gorm"
)

type GameRepository interface {
	GetLatestPlayedAt(userID uint) (int64, error)
	ExistsByLichessID(lichessID string) (bool, error)
	Create(game *model.Game) error
	ListByUser(userID uint, lichessUsername string, q dto.GameListQuery) ([]model.Game, int64, error)
	FindByIDForUser(id uint, userID uint) (*model.Game, error)
}

type gameRepository struct {
	db *gorm.DB
}

func NewGameRepository(db *gorm.DB) GameRepository {
	return &gameRepository{db: db}
}

func (r *gameRepository) GetLatestPlayedAt(userID uint) (int64, error) {
	var latest model.Game

	err := r.db.
		Where("user_id = ?", userID).
		Order("played_at DESC").
		First(&latest).Error

	if errors.Is(err, gorm.ErrRecordNotFound) {
		return 0, nil
	}
	if err != nil {
		return 0, err
	}

	return latest.PlayedAt, nil
}

func (r *gameRepository) ExistsByLichessID(lichessID string) (bool, error) {
	var count int64

	err := r.db.
		Model(&model.Game{}).
		Where("lichess_id = ?", lichessID).
		Count(&count).Error

	return count > 0, err
}

func (r *gameRepository) Create(game *model.Game) error {
	return r.db.Create(game).Error
}

func (r *gameRepository) FindByIDForUser(id uint, userID uint) (*model.Game, error) {
	var game model.Game

	err := r.db.
		Where("id = ? AND user_id = ?", id, userID).
		First(&game).Error

	if err != nil {
		return nil, err
	}

	return &game, nil
}

func (r *gameRepository) ListByUser(
	userID uint,
	lichessUsername string,
	q dto.GameListQuery,
) ([]model.Game, int64, error) {
	tx := r.db.Model(&model.Game{}).Where("user_id = ?", userID)

	lower := strings.ToLower(lichessUsername)

	if q.Color == "white" {
		tx = tx.Where("LOWER(white) = ?", lower)
	} else if q.Color == "black" {
		tx = tx.Where("LOWER(black) = ?", lower)
	}

	switch q.Result {
	case "win":
		tx = tx.Where(
			"(winner = 'white' AND LOWER(white) = ?) OR (winner = 'black' AND LOWER(black) = ?)",
			lower, lower,
		)
	case "loss":
		tx = tx.Where(
			"(winner = 'white' AND LOWER(black) = ?) OR (winner = 'black' AND LOWER(white) = ?)",
			lower, lower,
		)
	case "draw":
		tx = tx.Where("winner IS NULL OR winner = ''")
	}

	if q.Speed != "" {
		tx = tx.Where("data->>'speed' = ?", q.Speed)
	}

	if q.Opening != "" {
		tx = tx.Where("data->'opening'->>'name' ILIKE ?", "%"+q.Opening+"%")
	}

	if q.Since > 0 {
		tx = tx.Where("played_at >= ?", q.Since)
	}
	if q.Until > 0 {
		tx = tx.Where("played_at <= ?", q.Until)
	}

	var total int64
	if err := tx.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	limit := q.Limit
	if limit <= 0 || limit > 200 {
		limit = 50
	}

	var games []model.Game
	err := tx.
		Order("played_at DESC").
		Limit(limit).
		Offset(q.Offset).
		Find(&games).Error

	return games, total, err
}
