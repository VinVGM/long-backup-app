package main

import (
	"context"
	"log"
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

func handler(ctx context.Context, event events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	if event.RequestContext.HTTPMethod == "OPTIONS" {
		return response.Options(), nil
	}

	claims := auth.ExtractClaims(event.RequestContext.Authorizer)
	userID := auth.UserID(claims)
	if userID == "" {
		return response.Unauthorized("Missing user ID"), nil
	}

	awsCfg, err := config.LoadDefaultConfig(ctx)
	if err != nil {
		log.Printf("load config: %v", err)
		return response.ServerError(err), nil
	}

	dynamoClient := dynamodb.NewFromConfig(awsCfg)
	userRepo := db.NewUserRepository(dynamoClient)
	subRepo := db.NewSubscriptionRepository(dynamoClient)

	user, err := userRepo.Get(ctx, userID)
	if err != nil {
		log.Printf("get user: %v", err)
		return response.ServerError(err), nil
	}
	if user == nil {
		return response.NotFound("User not found"), nil
	}
	if user.Plan == model.PlanFree {
		return response.BadRequest("You are already on the Free plan"), nil
	}

	if err := userRepo.UpdatePlan(ctx, userID, model.PlanFree, model.PlanLimits[model.PlanFree]); err != nil {
		log.Printf("update plan: %v", err)
		return response.ServerError(err), nil
	}

	sub, err := subRepo.GetByUserID(ctx, userID)
	if err == nil && sub != nil {
		now := time.Now().UTC().Format(time.RFC3339)
		if err := subRepo.UpdateStatus(ctx, userID, sub.SubscriptionID, "cancelled", now); err != nil {
			log.Printf("update subscription status: %v", err)
		}
	}

	return response.JSON(200, map[string]any{
		"success": true,
		"plan":    model.PlanFree,
		"limit":   model.PlanLimits[model.PlanFree],
	}), nil
}

func main() {
	lambda.Start(handler)
}
