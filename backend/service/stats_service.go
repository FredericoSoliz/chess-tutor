package service

import (
	"chess-tutor/dto"
	"chess-tutor/repository"
)

type StatsService interface {
	GetDashboard(userID uint, lichessUsername string, speed string) (*dto.DashboardSummary, error)
}

type statsService struct {
	gameRepo repository.GameRepository
}

func NewStatsService(gameRepo repository.GameRepository) StatsService {
	return &statsService{gameRepo: gameRepo}
}

func (s *statsService) GetDashboard(userID uint, lichessUsername string, speed string) (*dto.DashboardSummary, error) {
	if speed == "" {
		speed = "rapid"
	}

	stats, err := s.gameRepo.GetOverallStats(userID, lichessUsername)
	if err != nil {
		return nil, err
	}

	summary := &dto.DashboardSummary{
		TotalGames: stats.Total,
		Wins:       stats.Wins,
		Losses:     stats.Losses,
		Draws:      stats.Draws,
		ByColor: dto.ColorBreakdown{
			WhiteGames:  stats.WhiteGames,
			WhiteWins:   stats.WhiteWins,
			WhiteLosses: stats.WhiteLosses,
			WhiteDraws:  stats.WhiteDraws,
			BlackGames:  stats.BlackGames,
			BlackWins:   stats.BlackWins,
			BlackLosses: stats.BlackLosses,
			BlackDraws:  stats.BlackDraws,
		},
	}

	if stats.Total > 0 {
		summary.WinRate = float64(stats.Wins) / float64(stats.Total) * 100.0
	}

	// Top openings
	openings, err := s.gameRepo.GetTopOpenings(userID, lichessUsername, 5)
	if err != nil {
		return nil, err
	}
	summary.TopOpenings = openings

	// Rating history (for chosen speed)
	history, err := s.gameRepo.GetRatingHistory(userID, lichessUsername, speed)
	if err != nil {
		return nil, err
	}
	summary.RatingHistory = history

	// Current rating + change
	if len(history) > 0 {
		current := history[len(history)-1]
		snap := &dto.RatingSnapshot{
			Speed:   speed,
			Current: current.Rating,
		}

		weekMs := int64(7 * 24 * 60 * 60 * 1000)
		monthMs := int64(30 * 24 * 60 * 60 * 1000)

		// Find rating at week ago / month ago (closest before)
		weekAgo := current.PlayedAt - weekMs
		monthAgo := current.PlayedAt - monthMs

		var weekRating, monthRating int
		weekFound, monthFound := false, false

		for _, p := range history {
			if !weekFound && p.PlayedAt >= weekAgo {
				weekRating = p.Rating
				weekFound = true
			}
			if !monthFound && p.PlayedAt >= monthAgo {
				monthRating = p.Rating
				monthFound = true
			}
		}

		if weekFound {
			diff := current.Rating - weekRating
			snap.ChangeWeek = &diff
		}
		if monthFound {
			diff := current.Rating - monthRating
			snap.ChangeMonth = &diff
		}

		summary.CurrentRating = snap
	}

	// Recent games (last 5)
	recent, err := s.gameRepo.GetRecentGames(userID, 5)
	if err != nil {
		return nil, err
	}
	summary.RecentGames = dto.ToGameListItems(recent, lichessUsername)

	return summary, nil
}
