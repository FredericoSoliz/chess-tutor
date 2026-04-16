package service

import (
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

type JWTService interface {
	GenerateToken(username string) (string, error)
	GetUsernameFromToken(c *gin.Context) (string, error)
	ValidateToken(c *gin.Context) bool
}

type jwtService struct {
	secretKey []byte
}

type Claims struct {
	Username string `json:"username"`
	jwt.RegisteredClaims
}

func NewJWTService() JWTService {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "secret"
	}

	return &jwtService{
		secretKey: []byte(secret),
	}
}

func (s *jwtService) GenerateToken(username string) (string, error) {
	expirationTime := time.Now().Add(24 * time.Hour)

	claims := &Claims{
		Username: username,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	return token.SignedString(s.secretKey)
}

func (s *jwtService) ValidateToken(c *gin.Context) bool {
	tokenStr := extractToken(c)

	claims := &Claims{}

	token, err := jwt.ParseWithClaims(tokenStr, claims, func(token *jwt.Token) (interface{}, error) {
		return s.secretKey, nil
	})

	return err == nil && token.Valid
}

func (s *jwtService) GetUsernameFromToken(c *gin.Context) (string, error) {
	tokenStr := extractToken(c)

	claims := &Claims{}

	token, err := jwt.ParseWithClaims(tokenStr, claims, func(token *jwt.Token) (interface{}, error) {
		return s.secretKey, nil
	})

	if err != nil || !token.Valid {
		return "", fmt.Errorf("invalid token")
	}

	return claims.Username, nil
}

func extractToken(c *gin.Context) string {
	reqToken := c.Request.Header.Get("Authorization")

	if strings.HasPrefix(reqToken, "Bearer ") {
		return strings.TrimPrefix(reqToken, "Bearer ")
	}

	return reqToken
}
