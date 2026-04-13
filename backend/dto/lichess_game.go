package dto

import "chess-tutor/model"

type LichessGame struct {
	ID      string `json:"id"`
	Variant string `json:"variant"`
	Speed   string `json:"speed"`
	Winner  string `json:"winner"`

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

	Moves string `json:"moves"`
}

// converts game
func ToGame(g LichessGame, userID uint) model.Game {
	return model.Game{
		LichessID: g.ID,
		UserID:    userID,
		White:     g.Players.White.User.Name,
		Black:     g.Players.Black.User.Name,
		Winner:    g.Winner,
		Moves:     g.Moves,
	}
}

// converts list of games
func ToGameList(games []LichessGame, userID uint) []model.Game {
	result := make([]model.Game, len(games))

	for i, g := range games {
		result[i] = ToGame(g, userID)
	}

	return result
}
