package main

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"log"
	"os"
	"time"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"

	"long-backup-app/backend/internal/auth"
	"long-backup-app/backend/internal/db"
	"long-backup-app/backend/internal/model"
	"long-backup-app/backend/internal/response"
)

type verifyPaymentRequest struct {
	RazorpayPaymentID string `json:"razorpay_payment_id"`
	RazorpayOrderID   string `json:"razorpay_order_id"`
	RazorpaySignature string `json:"razorpay_signature"`
	PlanID            string `json:"planId"`
	Interval          string `json:"interval"`
}

func handler(ctx context.Context, event events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	if event.RequestContext.HTTPMethod == "OPTIONS" {
		return response.Options(), nil
	}

	claims := auth.ExtractClaims(event.RequestContext.Authorizer)
	userID := auth.UserID(claims)
	if userID == "" {
		return response.Unauthorized("Missing user ID"), nil
	}
	email := auth.Email(claims)

	var req verifyPaymentRequest
	if err := json.Unmarshal([]byte(event.Body), &req); err != nil {
		return response.BadRequest("Invalid request body"), nil
	}

	keySecret := os.Getenv("RAZORPAY_KEY_SECRET")
	if keySecret == "" {
		log.Printf("Razorpay secret not configured")
		return response.ServerError(nil), nil
	}

	expectedSignature := hmacSHA256(req.RazorpayOrderID+"|"+req.RazorpayPaymentID, keySecret)
	if !hmac.Equal([]byte(expectedSignature), []byte(req.RazorpaySignature)) {
		return response.Error(400, "Payment verification failed"), nil
	}

	limit, ok := model.PlanLimits[req.PlanID]
	if !ok {
		return response.BadRequest("Invalid plan"), nil
	}

	awsCfg, err := config.LoadDefaultConfig(ctx)
	if err != nil {
		log.Printf("load config: %v", err)
		return response.ServerError(err), nil
	}

	dynamoClient := dynamodb.NewFromConfig(awsCfg)
	userRepo := db.NewUserRepository(dynamoClient)

	user, err := userRepo.Get(ctx, userID)
	if err != nil {
		log.Printf("get user: %v", err)
		return response.ServerError(err), nil
	}
	if user == nil {
		if err := userRepo.Create(ctx, userID, email); err != nil {
			log.Printf("create user: %v", err)
			return response.ServerError(err), nil
		}
	}

	if err := userRepo.UpdatePlan(ctx, userID, req.PlanID, limit); err != nil {
		log.Printf("update plan: %v", err)
		return response.ServerError(err), nil
	}

	subRepo := db.NewSubscriptionRepository(dynamoClient)
	now := time.Now().UTC().Format(time.RFC3339)
	expiresAt := time.Now().UTC().AddDate(0, 1, 0).Format(time.RFC3339)
	if req.Interval == model.PlanIntervalYearly {
		expiresAt = time.Now().UTC().AddDate(1, 0, 0).Format(time.RFC3339)
	}

	record := db.SubscriptionRecord{
		UserID:         userID,
		SubscriptionID: req.RazorpayPaymentID,
		Plan:           req.PlanID,
		PaymentID:      req.RazorpayPaymentID,
		OrderID:        req.RazorpayOrderID,
		Status:         "active",
		Interval:       req.Interval,
		CreatedAt:      now,
		ExpiresAt:      expiresAt,
	}

	if err := subRepo.Create(ctx, record); err != nil {
		log.Printf("create subscription record: %v", err)
	}

	return response.JSON(200, map[string]any{
		"success": true,
		"plan":    req.PlanID,
		"limit":   limit,
	}), nil
}

func hmacSHA256(data, secret string) string {
	h := hmac.New(sha256.New, []byte(secret))
	h.Write([]byte(data))
	return hex.EncodeToString(h.Sum(nil))
}

func main() {
	lambda.Start(handler)
}
