package dto

import (
	"encoding/json"
	"strings"

	"chess-tutor/model"
)

type GameListQuery struct {
	Result  string `form:"result"`  // win, loss, draw
	Color   string `form:"color"`   // white, black
	Speed   string `form:"speed"`   // bullet, blitz, rapid, classical
	Opening string `form:"opening"` // partial match on opening name
	Since   int64  `form:"since"`   // played_at >= since (Unix ms)
	Until   int64  `form:"until"`   // played_at <= until (Unix ms)
	Limit   int    `form:"limit"`
	Offset  int    `form:"offset"`
}

type GameListItem struct {
	ID             uint   `json:"id"`
	LichessID      string `json:"lichess_id"`
	Opponent       string `json:"opponent"`
	OpponentRating int    `json:"opponent_rating"`
	UserColor      string `json:"user_color"`
	UserResult     string `json:"user_result"`
	OpeningName    string `json:"opening_name"`
	OpeningECO     string `json:"opening_eco"`
	Speed          string `json:"speed"`
	PlayedAt       int64  `json:"played_at"`
}

type GameListResponse struct {
	Games []GameListItem `json:"games"`
	Total int64          `json:"total"`
}

func ToGameListItem(g model.Game, lichessUsername string) GameListItem {
	item := GameListItem{
		ID:        g.ID,
		LichessID: g.LichessID,
		PlayedAt:  g.PlayedAt,
	}

	userIsWhite := strings.EqualFold(g.White, lichessUsername)
	userIsBlack := strings.EqualFold(g.Black, lichessUsername)

	switch {
	case userIsWhite:
		item.UserColor = "white"
		item.Opponent = g.Black
		item.OpponentRating = g.BlackRating
	case userIsBlack:
		item.UserColor = "black"
		item.Opponent = g.White
		item.OpponentRating = g.WhiteRating
	}

	switch {
	case g.Winner == "":
		item.UserResult = "draw"
	case g.Winner == item.UserColor:
		item.UserResult = "win"
	default:
		item.UserResult = "loss"
	}

	var raw LichessGame
	if err := json.Unmarshal(g.Data, &raw); err == nil {
		item.OpeningName = raw.Opening.Name
		item.OpeningECO = raw.Opening.ECO
		item.Speed = raw.Speed
	}

	return item
}

func ToGameListItems(games []model.Game, lichessUsername string) []GameListItem {
	items := make([]GameListItem, len(games))
	for i, g := range games {
		items[i] = ToGameListItem(g, lichessUsername)
	}
	return items
}
