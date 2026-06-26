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

func isExpired(expiresAt string) bool {
	if expiresAt == "" {
		return false
	}
	t, err := time.Parse(time.RFC3339, expiresAt)
	if err != nil {
		return false
	}
	return time.Now().UTC().After(t)
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
	s3Helper := s3client.NewHelper(s3Client)
	storageClass, err := s3Helper.GetStorageClass(ctx, archive.S3Key)
	if err != nil {
		log.Printf("get storage class: %v", err)
	}
	if storageClass == "" {
		storageClass = "STANDARD"
	}

	// Direct download for archives still in Standard storage
	if archive.Status == model.StatusStored && storageClass == model.StorageClassStandard {
		s3Helper := s3client.NewHelper(s3Client)
		downloadURL, err := s3Helper.GeneratePresignedDownloadURL(ctx, archive.S3Key, 48*time.Hour)
		if err != nil {
			log.Printf("generate download URL: %v", err)
			return response.ServerError(err), nil
		}
		expiresAt := time.Now().UTC().Add(48 * time.Hour).Format(time.RFC3339)
		return response.JSON(200, map[string]any{
			"downloadUrl": downloadURL,
			"expiresAt":   expiresAt,
		}), nil
	}

	// Must restore first — Deep Archive
	if archive.Status == model.StatusStored {
		return response.BadRequest("Archive is in Deep Archive. Please initiate a restore first."), nil
	}

	if archive.Status != model.StatusReady {
		return response.BadRequest("Archive is not available for download (status: " + archive.Status + ")"), nil
	}

	// Verify restore job exists and is ready
	restoreRepo := db.NewRestoreJobRepository(dynamoClient)
	job, err := restoreRepo.Get(ctx, userID, archiveID)
	if err != nil {
		log.Printf("get restore job: %v", err)
		return response.ServerError(err), nil
	}
	if job == nil {
		return response.NotFound("No restore job found for this archive"), nil
	}
	if job.Status != model.RestoreStatusReady {
		return response.BadRequest("Restore is not yet ready (status: " + job.Status + ")"), nil
	}

	if isExpired(job.ExpiresAt) {
		return response.JSON(410, map[string]string{
			"error": "Restore has expired. Please initiate a new restore.",
		}), nil
	}

	// Verify the object is actually accessible (restore may have auto-expired in S3)
	s3Class, err := s3Helper.GetStorageClass(ctx, archive.S3Key)
	if err != nil {
		log.Printf("get storage class: %v", err)
	} else if s3Class != "STANDARD" {
		return response.JSON(410, map[string]string{
			"error": "Restore has expired in S3. Please initiate a new restore.",
		}), nil
	}

	downloadURL, err := s3Helper.GeneratePresignedDownloadURL(ctx, archive.S3Key, 48*time.Hour)
	if err != nil {
		log.Printf("generate download URL: %v", err)
		return response.ServerError(err), nil
	}

	expiresAt := time.Now().UTC().Add(48 * time.Hour).Format(time.RFC3339)

	return response.JSON(200, map[string]any{
		"downloadUrl": downloadURL,
		"expiresAt":   expiresAt,
	}), nil
}

func main() {
	lambda.Start(handler)
}
