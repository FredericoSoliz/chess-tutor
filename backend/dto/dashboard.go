package dto

type DashboardSummary struct {
	TotalGames    int64           `json:"total_games"`
	Wins          int64           `json:"wins"`
	Losses        int64           `json:"losses"`
	Draws         int64           `json:"draws"`
	WinRate       float64         `json:"win_rate"`
	ByColor       ColorBreakdown  `json:"by_color"`
	CurrentRating *RatingSnapshot `json:"current_rating"`
	TopOpenings   []OpeningStat   `json:"top_openings"`
	RatingHistory []RatingPoint   `json:"rating_history"`
	RecentGames   []GameListItem  `json:"recent_games"`
}

type ColorBreakdown struct {
	WhiteGames  int64 `json:"white_games"`
	WhiteWins   int64 `json:"white_wins"`
	WhiteLosses int64 `json:"white_losses"`
	WhiteDraws  int64 `json:"white_draws"`
	BlackGames  int64 `json:"black_games"`
	BlackWins   int64 `json:"black_wins"`
	BlackLosses int64 `json:"black_losses"`
	BlackDraws  int64 `json:"black_draws"`
}

type RatingSnapshot struct {
	Speed       string `json:"speed"`
	Current     int    `json:"current"`
	ChangeWeek  *int   `json:"change_week"`
	ChangeMonth *int   `json:"change_month"`
}

type OpeningStat struct {
	ECO    string `json:"eco"`
	Name   string `json:"name"`
	Total  int64  `json:"total"`
	Wins   int64  `json:"wins"`
	Losses int64  `json:"losses"`
	Draws  int64  `json:"draws"`
}

type RatingPoint struct {
	PlayedAt int64 `json:"played_at"`
	Rating   int   `json:"rating"`
}
