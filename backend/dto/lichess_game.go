package dto

import (
	"encoding/json"

	"chess-tutor/model"
)

type LichessGame struct {
	ID     string `json:"id"`
	Winner string `json:"winner"`

	Players struct {
		White struct {
			User struct {
				Name string `json:"name"`
			} `json:"user"`
			Rating int `json:"rating"`
		} `json:"white"`

		Black struct {
			User struct {
				Name string `json:"name"`
			} `json:"user"`
			Rating int `json:"rating"`
		} `json:"black"`
	} `json:"players"`

	Variant   string `json:"variant"`
	Speed     string `json:"speed"`
	Perf      string `json:"perf"`
	CreatedAt int64  `json:"createdAt"`

	Opening struct {
		ECO  string `json:"eco"`
		Name string `json:"name"`
	} `json:"opening"`

	Moves string `json:"moves"`
	PGN   string `json:"pgn"`
}

func ToGame(g LichessGame, userID uint) model.Game {
	rawJSON, _ := json.Marshal(g)

	return model.Game{
		LichessID:   g.ID,
		UserID:      userID,
		White:       g.Players.White.User.Name,
		Black:       g.Players.Black.User.Name,
		WhiteRating: g.Players.White.Rating,
		BlackRating: g.Players.Black.Rating,
		Winner:      g.Winner,
		PlayedAt:    g.CreatedAt,
		Data:        rawJSON,
	}
}

func ToGameList(games []LichessGame, userID uint) []model.Game {
	result := make([]model.Game, len(games))

	for i, g := range games {
		result[i] = ToGame(g, userID)
	}

	return result
}
