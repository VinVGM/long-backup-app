package main

import (
	"context"
	"encoding/json"
	"log"
	"os"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	razorpay "github.com/razorpay/razorpay-go"

	"long-backup-app/backend/internal/auth"
	"long-backup-app/backend/internal/model"
	"long-backup-app/backend/internal/response"
)

type createOrderRequest struct {
	PlanID   string `json:"planId"`
	Interval string `json:"interval"`
}

type createOrderResponse struct {
	OrderID  string `json:"orderId"`
	Amount   int64  `json:"amount"`
	Currency string `json:"currency"`
	KeyID    string `json:"keyId"`
	PlanName string `json:"planName"`
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

	var req createOrderRequest
	if err := json.Unmarshal([]byte(event.Body), &req); err != nil {
		return response.BadRequest("Invalid request body"), nil
	}

	var plan *model.PlanInfo
	for _, p := range model.Plans {
		if p.ID == req.PlanID {
			plan = &p
			break
		}
	}
	if plan == nil {
		return response.BadRequest("Invalid plan"), nil
	}

	var pricing model.PlanPricing
	switch req.Interval {
	case model.PlanIntervalMonthly:
		pricing = plan.Monthly
	case model.PlanIntervalYearly:
		pricing = plan.Yearly
	default:
		return response.BadRequest("Invalid interval"), nil
	}

	keyID := os.Getenv("RAZORPAY_KEY_ID")
	keySecret := os.Getenv("RAZORPAY_KEY_SECRET")
	if keyID == "" || keySecret == "" {
		log.Printf("Razorpay credentials not configured")
		return response.ServerError(nil), nil
	}

	client := razorpay.NewClient(keyID, keySecret)
	orderData := map[string]any{
		"amount":          pricing.Amount,
		"currency":        pricing.Currency,
		"receipt":         userID[:8] + "_" + req.PlanID,
		"notes": map[string]string{
			"userId":   userID,
			"plan":     req.PlanID,
			"interval": req.Interval,
		},
	}

	body, err := client.Order.Create(orderData, nil)
	if err != nil {
		log.Printf("create razorpay order: %v", err)
		return response.ServerError(err), nil
	}

	orderID, _ := body["id"].(string)

	return response.JSON(200, createOrderResponse{
		OrderID:  orderID,
		Amount:   pricing.Amount,
		Currency: pricing.Currency,
		KeyID:    keyID,
		PlanName: plan.Name,
	}), nil
}

func main() {
	lambda.Start(handler)
}
