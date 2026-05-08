package service

import (
	"chess-tutor/dto"
	"chess-tutor/model"
	"chess-tutor/repository"
)

type GameService interface {
	GetLatestPlayedAt(userID uint) (int64, error)
	InsertNewGames(games []model.Game) (int, error)
	ListByUser(userID uint, lichessUsername string, q dto.GameListQuery) ([]model.Game, int64, error)
}

type gameService struct {
	repo repository.GameRepository
}

func NewGameService(repo repository.GameRepository) GameService {
	return &gameService{repo: repo}
}

func (s *gameService) GetLatestPlayedAt(userID uint) (int64, error) {
	return s.repo.GetLatestPlayedAt(userID)
}

func (s *gameService) InsertNewGames(games []model.Game) (int, error) {
	inserted := 0

	for i := range games {
		exists, err := s.repo.ExistsByLichessID(games[i].LichessID)
		if err != nil {
			return inserted, err
		}
		if exists {
			continue
		}

		if err := s.repo.Create(&games[i]); err != nil {
			return inserted, err
		}
		inserted++
	}

	return inserted, nil
}

func (s *gameService) ListByUser(
	userID uint,
	lichessUsername string,
	q dto.GameListQuery,
) ([]model.Game, int64, error) {
	return s.repo.ListByUser(userID, lichessUsername, q)
}
