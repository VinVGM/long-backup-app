package main

import (
	"context"
	"encoding/json"
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

type batchRestoreRequest struct {
	ArchiveIDs []string `json:"archiveIds"`
}

type batchRestoreResult struct {
	Succeeded int      `json:"succeeded"`
	Failed    int      `json:"failed"`
	Errors    []string `json:"errors,omitempty"`
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

	var req batchRestoreRequest
	if err := json.Unmarshal([]byte(event.Body), &req); err != nil {
		return response.BadRequest("Invalid request body"), nil
	}

	if len(req.ArchiveIDs) == 0 {
		return response.BadRequest("No archive IDs provided"), nil
	}

	awsCfg, err := config.LoadDefaultConfig(ctx)
	if err != nil {
		log.Printf("load config: %v", err)
		return response.ServerError(err), nil
	}

	dynamoClient := dynamodb.NewFromConfig(awsCfg)
	s3Client := s3.NewFromConfig(awsCfg)
	archiveRepo := db.NewArchiveRepository(dynamoClient)
	restoreRepo := db.NewRestoreJobRepository(dynamoClient)
	s3Helper := s3client.NewHelper(s3Client)

	result := batchRestoreResult{}

	for _, archiveID := range req.ArchiveIDs {
		archive, err := archiveRepo.Get(ctx, userID, archiveID)
		if err != nil || archive == nil {
			result.Failed++
			result.Errors = append(result.Errors, archiveID+": not found")
			continue
		}
		if archive.Status != model.StatusStored {
			result.Failed++
			result.Errors = append(result.Errors, archiveID+": not eligible (status: "+archive.Status+")")
			continue
		}

		s3Class, err := s3Helper.GetStorageClass(ctx, archive.S3Key)
		if err != nil {
			result.Failed++
			result.Errors = append(result.Errors, archiveID+": S3 check failed")
			continue
		}

		if s3Class == "STANDARD" {
			result.Succeeded++
			continue
		}

		if err := s3Helper.RestoreObject(ctx, archive.S3Key, 1); err != nil {
			result.Failed++
			result.Errors = append(result.Errors, archiveID+": restore failed")
			continue
		}

		now := time.Now().UTC().Format(time.RFC3339)
		expiresAt := time.Now().UTC().Add(48 * time.Hour).Format(time.RFC3339)
		job := model.RestoreJob{
			UserID:    userID,
			ArchiveID: archiveID,
			Status:    model.RestoreStatusInProgress,
			S3Key:     archive.S3Key,
			CreatedAt: now,
			UpdatedAt: now,
			ExpiresAt: expiresAt,
		}
		if err := restoreRepo.Create(ctx, job); err != nil {
			log.Printf("create restore job for %s: %v", archiveID, err)
		}
		if err := archiveRepo.UpdateStatus(ctx, userID, archiveID, model.StatusRestoring); err != nil {
			log.Printf("update archive status for %s: %v", archiveID, err)
		}
		result.Succeeded++
	}

	return response.JSON(200, result), nil
}

func main() {
	lambda.Start(handler)
}
