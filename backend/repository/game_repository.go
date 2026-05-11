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
	GetOverallStats(userID uint, lichessUsername string) (*GameStatsRow, error)
	GetTopOpenings(userID uint, lichessUsername string, limit int) ([]dto.OpeningStat, error)
	GetRatingHistory(userID uint, lichessUsername string, speed string) ([]dto.RatingPoint, error)
	GetRecentGames(userID uint, limit int) ([]model.Game, error)
}

type GameStatsRow struct {
	Total       int64
	Wins        int64
	Losses      int64
	Draws       int64
	WhiteGames  int64
	WhiteWins   int64
	WhiteLosses int64
	WhiteDraws  int64
	BlackGames  int64
	BlackWins   int64
	BlackLosses int64
	BlackDraws  int64
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

func (r *gameRepository) GetOverallStats(userID uint, lichessUsername string) (*GameStatsRow, error) {
	lower := strings.ToLower(lichessUsername)

	var row GameStatsRow

	query := `
		SELECT
			COUNT(*) AS total,
			COUNT(*) FILTER (WHERE (winner = 'white' AND LOWER(white) = ?) OR (winner = 'black' AND LOWER(black) = ?)) AS wins,
			COUNT(*) FILTER (WHERE (winner = 'white' AND LOWER(black) = ?) OR (winner = 'black' AND LOWER(white) = ?)) AS losses,
			COUNT(*) FILTER (WHERE winner IS NULL OR winner = '') AS draws,
			COUNT(*) FILTER (WHERE LOWER(white) = ?) AS white_games,
			COUNT(*) FILTER (WHERE LOWER(white) = ? AND winner = 'white') AS white_wins,
			COUNT(*) FILTER (WHERE LOWER(white) = ? AND winner = 'black') AS white_losses,
			COUNT(*) FILTER (WHERE LOWER(white) = ? AND (winner IS NULL OR winner = '')) AS white_draws,
			COUNT(*) FILTER (WHERE LOWER(black) = ?) AS black_games,
			COUNT(*) FILTER (WHERE LOWER(black) = ? AND winner = 'black') AS black_wins,
			COUNT(*) FILTER (WHERE LOWER(black) = ? AND winner = 'white') AS black_losses,
			COUNT(*) FILTER (WHERE LOWER(black) = ? AND (winner IS NULL OR winner = '')) AS black_draws
		FROM games WHERE user_id = ?
	`

	err := r.db.Raw(query,
		lower, lower, lower, lower,
		lower, lower, lower, lower,
		lower, lower, lower, lower,
		userID,
	).Scan(&row).Error

	return &row, err
}

func (r *gameRepository) GetTopOpenings(userID uint, lichessUsername string, limit int) ([]dto.OpeningStat, error) {
	lower := strings.ToLower(lichessUsername)

	if limit <= 0 {
		limit = 5
	}

	var results []dto.OpeningStat

	query := `
		SELECT
			COALESCE(data->'opening'->>'eco', '') AS eco,
			COALESCE(data->'opening'->>'name', '') AS name,
			COUNT(*) AS total,
			COUNT(*) FILTER (WHERE (winner = 'white' AND LOWER(white) = ?) OR (winner = 'black' AND LOWER(black) = ?)) AS wins,
			COUNT(*) FILTER (WHERE (winner = 'white' AND LOWER(black) = ?) OR (winner = 'black' AND LOWER(white) = ?)) AS losses,
			COUNT(*) FILTER (WHERE winner IS NULL OR winner = '') AS draws
		FROM games
		WHERE user_id = ? AND data->'opening'->>'name' IS NOT NULL
		GROUP BY eco, name
		ORDER BY total DESC
		LIMIT ?
	`

	err := r.db.Raw(query,
		lower, lower, lower, lower,
		userID, limit,
	).Scan(&results).Error

	return results, err
}

func (r *gameRepository) GetRatingHistory(userID uint, lichessUsername string, speed string) ([]dto.RatingPoint, error) {
	lower := strings.ToLower(lichessUsername)

	var results []dto.RatingPoint

	query := `
		SELECT
			played_at,
			CASE WHEN LOWER(white) = ? THEN white_rating ELSE black_rating END AS rating
		FROM games
		WHERE user_id = ?
			AND (LOWER(white) = ? OR LOWER(black) = ?)
	`
	args := []interface{}{lower, userID, lower, lower}

	if speed != "" {
		query += ` AND data->>'speed' = ?`
		args = append(args, speed)
	}

	query += ` ORDER BY played_at ASC`

	err := r.db.Raw(query, args...).Scan(&results).Error
	return results, err
}

func (r *gameRepository) GetRecentGames(userID uint, limit int) ([]model.Game, error) {
	if limit <= 0 {
		limit = 5
	}

	var games []model.Game
	err := r.db.
		Where("user_id = ?", userID).
		Order("played_at DESC").
		Limit(limit).
		Find(&games).Error

	return games, err
}
