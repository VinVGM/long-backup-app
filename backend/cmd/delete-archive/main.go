package main

import (
	"context"
	"log"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/s3"

	"long-backup-app/backend/internal/auth"
	"long-backup-app/backend/internal/db"
	"long-backup-app/backend/internal/model"
	"long-backup-app/backend/internal/response"
	"long-backup-app/backend/internal/s3client"
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

	archiveID := event.PathParameters["id"]
	if archiveID == "" {
		return response.BadRequest("Archive ID is required"), nil
	}

	awsCfg, err := config.LoadDefaultConfig(ctx)
	if err != nil {
		log.Printf("load config: %v", err)
		return response.ServerError(err), nil
	}

	dynamoClient := dynamodb.NewFromConfig(awsCfg)
	s3Client := s3.NewFromConfig(awsCfg)
	archiveRepo := db.NewArchiveRepository(dynamoClient)
	userRepo := db.NewUserRepository(dynamoClient)
	s3Helper := s3client.NewHelper(s3Client)

	archive, err := archiveRepo.Get(ctx, userID, archiveID)
	if err != nil {
		log.Printf("get archive: %v", err)
		return response.ServerError(err), nil
	}
	if archive == nil {
		return response.NotFound("Archive not found"), nil
	}
	if archive.Status == model.StatusUploading {
		return response.BadRequest("Cannot delete an archive that is still uploading"), nil
	}

	if err := s3Helper.DeleteObject(ctx, archive.S3Key); err != nil {
		log.Printf("delete s3 object: %v", err)
	}

	if err := archiveRepo.Delete(ctx, userID, archiveID); err != nil {
		log.Printf("delete archive record: %v", err)
	}

	if archive.Status == model.StatusStored || archive.Status == model.StatusReady {
		if err := userRepo.UpdateStorageUsed(ctx, userID, -archive.SizeBytes); err != nil {
			log.Printf("update storage used: %v", err)
		}
	}

	return response.JSON(200, map[string]any{
		"success": true,
		"message": "Archive deleted successfully",
	}), nil
}

func main() {
	lambda.Start(handler)
}
