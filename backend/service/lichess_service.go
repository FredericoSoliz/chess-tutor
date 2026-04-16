package service

import (
	"bufio"
	"encoding/json"
	"fmt"
	"net/http"

	"chess-tutor/dto"
)

type LichessService interface {
	GetUserGames(username string) ([]dto.LichessGame, error)
}

type lichessService struct {
}

func NewLichessService() LichessService {
	return &lichessService{}
}

func (s *lichessService) GetUserGames(username string) ([]dto.LichessGame, error) {
	url := fmt.Sprintf("https://lichess.org/api/games/user/%s?max=30&pgnInJson=true&opening=true", username)

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}

	req.Header.Add("Accept", "application/x-ndjson")

	client := &http.Client{}

	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var games []dto.LichessGame

	scanner := bufio.NewScanner(resp.Body)

	for scanner.Scan() {
		var game dto.LichessGame

		err := json.Unmarshal(scanner.Bytes(), &game)
		if err == nil {
			games = append(games, game)
		}
	}

	if err := scanner.Err(); err != nil {
		return nil, err
	}

	return games, nil
}
