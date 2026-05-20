package service

import (
	"bytes"
	"chess-tutor/dto"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"time"
)

type EngineService interface {
	AnalyzePosition(req dto.AnalyzePositionRequest) (*dto.AnalyzePositionResponse, error)
	AnalyzeGame(pgn string, timePerMove float64) (*dto.GameAnalysisResponse, error)
	CoachMove(req dto.CoachMoveRequest) (*dto.CoachMoveResponse, error)
}

type engineService struct {
}

func NewEngineService() EngineService {
	return &engineService{}
}

func (s *engineService) AnalyzePosition(req dto.AnalyzePositionRequest) (*dto.AnalyzePositionResponse, error) {
	if req.Depth == 0 {
		req.Depth = 15
	}

	url := os.Getenv("ENGINE_SERVICE_URL")
	if url == "" {
		url = "http://localhost:5000"
	}

	body, err := json.Marshal(req)
	if err != nil {
		return nil, err
	}

	resp, err := http.Post(
		url+"/analyze",
		"application/json",
		bytes.NewBuffer(body),
	)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("failed to analyze position")
	}

	var response dto.AnalyzePositionResponse

	if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
		return nil, err
	}

	return &response, nil
}

func (s *engineService) AnalyzeGame(pgn string, timePerMove float64) (*dto.GameAnalysisResponse, error) {
	if timePerMove <= 0 {
		timePerMove = 0.1
	}

	url := os.Getenv("ENGINE_SERVICE_URL")
	if url == "" {
		url = "http://localhost:5000"
	}

	reqBody := dto.AnalyzeGameRequest{
		PGN:         pgn,
		TimePerMove: timePerMove,
	}

	body, err := json.Marshal(reqBody)
	if err != nil {
		return nil, err
	}

	client := &http.Client{Timeout: 5 * time.Minute}
	resp, err := client.Post(
		url+"/analyze/pgn",
		"application/json",
		bytes.NewBuffer(body),
	)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("AI service returned status %d", resp.StatusCode)
	}

	var aiResp dto.GameAnalysisResponse
	if err := json.NewDecoder(resp.Body).Decode(&aiResp); err != nil {
		return nil, err
	}

	return &aiResp, nil
}

func (s *engineService) CoachMove(req dto.CoachMoveRequest) (*dto.CoachMoveResponse, error) {
	url := os.Getenv("ENGINE_SERVICE_URL")
	if url == "" {
		url = "http://localhost:5000"
	}

	body, err := json.Marshal(req)
	if err != nil {
		return nil, err
	}

	resp, err := http.Post(
		url+"/play/coach-move",
		"application/json",
		bytes.NewBuffer(body),
	)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("engine service returned status %d", resp.StatusCode)
	}

	var out dto.CoachMoveResponse
	if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
		return nil, err
	}

	return &out, nil
}
