package dto

type ProfileResponse struct {
	Username               string `json:"username"`
	LichessUsername        string `json:"lichess_username"`
	MemberSince            int64  `json:"member_since"`
	GamesCount             int64  `json:"games_count"`
	LastSyncedAt           int64  `json:"last_synced_at"`
	DefaultCoachDifficulty string `json:"default_coach_difficulty"`
}

type UpdateProfileRequest struct {
	LichessUsername        *string `json:"lichess_username"`
	DefaultCoachDifficulty *string `json:"default_coach_difficulty"`
}

type ChangePasswordRequest struct {
	CurrentPassword string `json:"current_password" binding:"required"`
	NewPassword     string `json:"new_password" binding:"required,min=6"`
}
