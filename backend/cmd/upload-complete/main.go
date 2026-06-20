package main

import (
	"context"
	"log"
	"path/filepath"
	"strings"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/s3"

	"long-backup-app/backend/internal/db"
	"long-backup-app/backend/internal/model"
	"long-backup-app/backend/internal/s3client"
)

func handler(ctx context.Context, event events.S3Event) error {
	for _, record := range event.Records {
		s3Key := record.S3.Object.Key

		if !strings.HasPrefix(s3Key, "uploads/") || !strings.HasSuffix(s3Key, ".zip") {
			log.Printf("skipping non-archive object: %s", s3Key)
			continue
		}

		parts := strings.SplitN(strings.TrimPrefix(s3Key, "uploads/"), "/", 2)
		if len(parts) != 2 {
			log.Printf("invalid s3 key format: %s", s3Key)
			continue
		}
		userID := parts[0]
		archiveID := strings.TrimSuffix(parts[1], filepath.Ext(parts[1]))

		awsCfg, err := config.LoadDefaultConfig(ctx)
		if err != nil {
			log.Printf("load config: %v", err)
			continue
		}

		s3Client := s3.NewFromConfig(awsCfg)
		dynamoClient := dynamodb.NewFromConfig(awsCfg)

		s3Helper := s3client.NewHelper(s3Client)
		size, etag, err := s3Helper.GetObjectMetadata(ctx, s3Key)
		if err != nil {
			log.Printf("get object metadata for %s: %v", s3Key, err)
			continue
		}

		if etag != "" {
			etag = strings.Trim(etag, "\"")
		}

		archiveRepo := db.NewArchiveRepository(dynamoClient)
		if err := archiveRepo.UpdateStatusWithChecksum(ctx, userID, archiveID, model.StatusStored, etag, size); err != nil {
			log.Printf("update archive status for %s/%s: %v", userID, archiveID, err)
			continue
		}

		userRepo := db.NewUserRepository(dynamoClient)
		if err := userRepo.UpdateStorageUsed(ctx, userID, size); err != nil {
			log.Printf("update storage for %s: %v", userID, err)
			continue
		}

		log.Printf("archive stored: user=%s archive=%s size=%d", userID, archiveID, size)
	}

	return nil
}

func main() {
	lambda.Start(handler)
}
