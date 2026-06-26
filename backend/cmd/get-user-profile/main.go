package main

import (
	"context"
	"log"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"

	"long-backup-app/backend/internal/auth"
	"long-backup-app/backend/internal/db"
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

	user, err := userRepo.Get(ctx, userID)
	if err != nil {
		log.Printf("get user: %v", err)
		return response.ServerError(err), nil
	}
	if user == nil {
		return response.NotFound("User not found"), nil
	}

	return response.JSON(200, user), nil
}

func main() {
	lambda.Start(handler)
}
