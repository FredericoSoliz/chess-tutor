package dto

type CoachMoveRequest struct {
	FenBefore        string             `json:"fen_before"`
	UserMove         string             `json:"user_move"`
	FenAfter         string             `json:"fen_after" binding:"required"`
	Elo              int                `json:"elo"`
	History          []string           `json:"history"`
	RecentUserMoves  []RecentUserMove   `json:"recent_user_moves"`
}

type RecentUserMove struct {
	San      string `json:"san"`
	Category string `json:"category"`
	CpLoss   int    `json:"cp_loss"`
}

type CoachUserMove struct {
	Uci      string `json:"uci"`
	Category string `json:"category"`
	CpLoss   int    `json:"cp_loss"`
	BestMove string `json:"best_move"`
	ScoreCp  *int   `json:"score_cp"`
	Mate     *int   `json:"mate"`
}



type CoachBotMove struct {
	Uci string `json:"uci"`
}

type CoachMoveResponse struct {
	UserMove     *CoachUserMove `json:"user_move"`
	BotMove      *CoachBotMove  `json:"bot_move"`
	FenAfterBot  string         `json:"fen_after_bot"`
	GameOver     bool           `json:"game_over"`
	Result       *string        `json:"result"`
	CoachMessage *string        `json:"coach_message"`
}
