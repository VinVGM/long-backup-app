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
	"github.com/oklog/ulid/v2"

	"long-backup-app/backend/internal/auth"
	"long-backup-app/backend/internal/db"
	"long-backup-app/backend/internal/model"
	"long-backup-app/backend/internal/response"
	"long-backup-app/backend/internal/s3client"
)

type uploadRequest struct {
	Filename    string `json:"filename"`
	SizeBytes   int64  `json:"size"`
	Description string `json:"description,omitempty"`
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

	var req uploadRequest
	if err := json.Unmarshal([]byte(event.Body), &req); err != nil {
		return response.BadRequest("Invalid request body"), nil
	}

	if req.Filename == "" {
		return response.BadRequest("Filename is required"), nil
	}
	if req.SizeBytes <= 0 {
		return response.BadRequest("Size must be greater than 0"), nil
	}
	if req.SizeBytes > 5*1024*1024*1024 {
		return response.BadRequest("File exceeds maximum size of 5GB"), nil
	}

	awsCfg, err := config.LoadDefaultConfig(ctx)
	if err != nil {
		log.Printf("load config: %v", err)
		return response.ServerError(err), nil
	}

	dynamoClient := dynamodb.NewFromConfig(awsCfg)
	s3Client := s3.NewFromConfig(awsCfg)

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
		user, _ = userRepo.Get(ctx, userID)
	}

	if user.StorageUsedBytes+req.SizeBytes > user.StorageLimitBytes {
		return response.Forbidden("Storage limit exceeded. Upgrade your plan."), nil
	}

	archiveID := ulid.Make()
	now := time.Now().UTC().Format(time.RFC3339)
	s3Key := "uploads/" + userID + "/" + archiveID.String() + ".zip"

	archive := model.Archive{
		UserID:      userID,
		ArchiveID:   archiveID.String(),
		Filename:    req.Filename,
		SizeBytes:   req.SizeBytes,
		Description: req.Description,
		S3Key:       s3Key,
		Status:      model.StatusUploading,
		CreatedAt:   now,
	}

	archiveRepo := db.NewArchiveRepository(dynamoClient)
	if err := archiveRepo.Create(ctx, archive); err != nil {
		log.Printf("create archive: %v", err)
		return response.ServerError(err), nil
	}

	s3Helper := s3client.NewHelper(s3Client)
	presignedURL, err := s3Helper.GeneratePresignedUploadURL(ctx, s3Key, 1*time.Hour)
	if err != nil {
		log.Printf("generate presigned URL: %v", err)
		return response.ServerError(err), nil
	}

	return response.JSON(200, map[string]any{
		"archiveId":    archive.ArchiveID,
		"presignedUrl": presignedURL,
		"s3Key":        s3Key,
	}), nil
}

func main() {
	lambda.Start(handler)
}
