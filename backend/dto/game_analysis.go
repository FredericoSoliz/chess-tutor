package dto

type AnalyzeGameRequest struct {
	PGN         string  `json:"pgn"`
	TimePerMove float64 `json:"time_per_move"`
}

type MoveAnalysis struct {
	Ply           int     `json:"ply"`
	San           string  `json:"san"`
	Uci           string  `json:"uci"`
	Turn          string  `json:"turn"`
	ScoreCpBefore *int    `json:"score_cp_before"`
	ScoreCpAfter  *int    `json:"score_cp_after"`
	MateBefore    *int    `json:"mate_before"`
	MateAfter     *int    `json:"mate_after"`
	BestMove      string  `json:"best_move"`
	CpLoss        int     `json:"cp_loss"`
	Accuracy      float64 `json:"accuracy"`
	Category      string  `json:"category"`
}

type GameAnalysisResponse struct {
	GameID        string         `json:"game_id"`
	Moves         []MoveAnalysis `json:"moves"`
	AccuracyWhite *float64       `json:"accuracy_white"`
	AccuracyBlack *float64       `json:"accuracy_black"`
}
