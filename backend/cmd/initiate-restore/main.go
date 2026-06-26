package main

import (
	"context"
	"log"
	"time"

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
	archive, err := archiveRepo.Get(ctx, userID, archiveID)
	if err != nil {
		log.Printf("get archive: %v", err)
		return response.ServerError(err), nil
	}
	if archive == nil {
		return response.NotFound("Archive not found"), nil
	}
	if archive.Status != model.StatusStored {
		return response.BadRequest("Archive is not eligible for restore (current status: " + archive.Status + ")"), nil
	}

	s3Helper := s3client.NewHelper(s3Client)

	// Check actual S3 storage class — lifecycle may not have transitioned yet
	s3Class, err := s3Helper.GetStorageClass(ctx, archive.S3Key)
	if err != nil {
		log.Printf("get storage class: %v", err)
		return response.ServerError(err), nil
	}

	if s3Class == "STANDARD" {
		downloadURL, err := s3Helper.GeneratePresignedDownloadURL(ctx, archive.S3Key, 48*time.Hour)
		if err != nil {
			log.Printf("generate download URL: %v", err)
			return response.ServerError(err), nil
		}
		expiresAt := time.Now().UTC().Add(48 * time.Hour).Format(time.RFC3339)
		return response.JSON(200, map[string]any{
			"success":     true,
			"downloadUrl": downloadURL,
			"expiresAt":   expiresAt,
			"message":     archive.Filename + " is still in Standard storage. Downloading directly.",
		}), nil
	}

	if err := s3Helper.RestoreObject(ctx, archive.S3Key, 1); err != nil {
		log.Printf("restore object: %v", err)
		return response.ServerError(err), nil
	}

	now := time.Now().UTC().Format(time.RFC3339)
	expiresAt := time.Now().UTC().Add(24 * time.Hour).Format(time.RFC3339)

	job := model.RestoreJob{
		UserID:    userID,
		ArchiveID: archiveID,
		Status:    model.RestoreStatusInProgress,
		S3Key:     archive.S3Key,
		CreatedAt: now,
		UpdatedAt: now,
		ExpiresAt: expiresAt,
	}

	restoreRepo := db.NewRestoreJobRepository(dynamoClient)
	if err := restoreRepo.Create(ctx, job); err != nil {
		log.Printf("create restore job: %v", err)
		return response.ServerError(err), nil
	}

	if err := archiveRepo.UpdateStatus(ctx, userID, archiveID, model.StatusRestoring); err != nil {
		log.Printf("update archive status: %v", err)
		return response.ServerError(err), nil
	}

	return response.JSON(200, map[string]any{
		"success": true,
		"message": "Restore initiated for " + archive.Filename,
	}), nil
}

func main() {
	lambda.Start(handler)
}
