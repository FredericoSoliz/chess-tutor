package dto

type GetLichessGamesRequest struct {
	Username string `uri:"username" binding:"required"`
}
