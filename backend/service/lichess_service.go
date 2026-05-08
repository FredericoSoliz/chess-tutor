package service

import (
	"bufio"
	"encoding/json"
	"fmt"
	"net/http"
	"os"

	"chess-tutor/dto"
)

type LichessService interface {
	GetUserGames(username string, since int64) ([]dto.LichessGame, error)
}

type lichessService struct{}

func NewLichessService() LichessService {
	return &lichessService{}
}

func (s *lichessService) GetUserGames(username string, since int64) ([]dto.LichessGame, error) {
	url := fmt.Sprintf("https://lichess.org/api/games/user/%s?pgnInJson=true&opening=true", username)
	if since > 0 {
		// +1 ms so we don't re-fetch the last known game
		url += fmt.Sprintf("&since=%d", since+1)
	}

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Accept", "application/x-ndjson")

	if token := os.Getenv("LICHESS_TOKEN"); token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}

	client := &http.Client{}

	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var games []dto.LichessGame

	scanner := bufio.NewScanner(resp.Body)
	scanner.Buffer(make([]byte, 1024*1024), 1024*1024)

	for scanner.Scan() {
		line := scanner.Bytes()
		if len(line) == 0 {
			continue
		}

		var game dto.LichessGame
		if err := json.Unmarshal(line, &game); err == nil {
			games = append(games, game)
		}
	}

	if err := scanner.Err(); err != nil {
		return nil, err
	}

	return games, nil
}
