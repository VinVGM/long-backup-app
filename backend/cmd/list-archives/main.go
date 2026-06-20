package main

import (
	"context"
	"log"
	"strconv"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"

	"long-backup-app/backend/internal/auth"
	"long-backup-app/backend/internal/db"
	"long-backup-app/backend/internal/model"
	"long-backup-app/backend/internal/response"
)

const defaultLimit = 20

func handler(ctx context.Context, event events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	if event.RequestContext.HTTPMethod == "OPTIONS" {
		return response.Options(), nil
	}

	claims := auth.ExtractClaims(event.RequestContext.Authorizer)
	userID := auth.UserID(claims)
	if userID == "" {
		return response.Unauthorized("Missing user ID"), nil
	}

	limit := defaultLimit
	if l, err := strconv.Atoi(event.QueryStringParameters["limit"]); err == nil && l > 0 && l <= 100 {
		limit = l
	}

	nextToken := event.QueryStringParameters["nextToken"]

	awsCfg, err := config.LoadDefaultConfig(ctx)
	if err != nil {
		log.Printf("load config: %v", err)
		return response.ServerError(err), nil
	}

	dynamoClient := dynamodb.NewFromConfig(awsCfg)
	archiveRepo := db.NewArchiveRepository(dynamoClient)

	archives, token, err := archiveRepo.List(ctx, userID, limit, nextToken)
	if err != nil {
		log.Printf("list archives: %v", err)
		return response.ServerError(err), nil
	}

	if archives == nil {
		archives = []model.Archive{}
	}

	return response.JSON(200, map[string]any{
		"archives":  archives,
		"nextToken": token,
	}), nil
}

func main() {
	lambda.Start(handler)
}
