package dto

type AnalyzePositionRequest struct {
	FEN   string `json:"fen" binding:"required"`
	Depth int    `json:"depth"`
}

type AnalyzePositionResponse struct {
	FEN        string      `json:"fen"`
	BestMove   string      `json:"best_move"`
	Evaluation interface{} `json:"evaluation"`
}
