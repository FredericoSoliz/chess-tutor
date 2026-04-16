package service

import (
	"bytes"
	"chess-tutor/dto"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
)

type EngineService interface {
	AnalyzePosition(req dto.AnalyzePositionRequest) (*dto.AnalyzePositionResponse, error)
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

	url := os.Getenv("AI_SERVICE_URL")
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
