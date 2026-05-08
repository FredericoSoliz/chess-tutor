package dto

type AnalyzePositionRequest struct {
	FEN   string `json:"fen" binding:"required"`
	Depth int    `json:"depth"`
}

type AnalyzePositionResponse struct {
	FEN      string   `json:"fen"`
	BestMove string   `json:"best_move"`
	ScoreCP  *int     `json:"score_cp"`
	Mate     *int     `json:"mate"`
	PV       []string `json:"pv"`
	Depth    int      `json:"depth"`
}
