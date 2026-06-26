package main

import (
	"context"
	"encoding/json"
	"log"
	"os"
	"path/filepath"
	"strings"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/sesv2"
	"github.com/aws/aws-sdk-go-v2/service/sesv2/types"

	"long-backup-app/backend/internal/db"
	"long-backup-app/backend/internal/model"
)

var sesFromEmail string

func init() {
	sesFromEmail = os.Getenv("SES_FROM_EMAIL")
	if sesFromEmail == "" {
		sesFromEmail = "noreply@longbackup.com"
	}
}

type s3RestoreDetail struct {
	Bucket struct {
		Name string `json:"name"`
	} `json:"bucket"`
	Object struct {
		Key string `json:"key"`
	} `json:"object"`
	Reason string `json:"reason"`
}

func handler(ctx context.Context, event events.EventBridgeEvent) error {
	var detail s3RestoreDetail
	if err := json.Unmarshal(event.Detail, &detail); err != nil {
		log.Printf("parse event detail: %v", err)
		return err
	}

	log.Printf("restore event: bucket=%s key=%s reason=%s", detail.Bucket.Name, detail.Object.Key, detail.Reason)

	s3Key := detail.Object.Key

	var prefix string
	if strings.HasPrefix(s3Key, "uploads/") {
		prefix = strings.TrimPrefix(s3Key, "uploads/")
	} else if strings.HasPrefix(s3Key, "archives/") {
		prefix = strings.TrimPrefix(s3Key, "archives/")
	} else {
		log.Printf("unexpected s3 key format, skipping: %s", s3Key)
		return nil
	}

	parts := strings.SplitN(prefix, "/", 2)
	if len(parts) != 2 {
		log.Printf("invalid s3 key format: %s", s3Key)
		return nil
	}
	userID := parts[0]
	archiveID := strings.TrimSuffix(parts[1], filepath.Ext(parts[1]))

	awsCfg, err := config.LoadDefaultConfig(ctx)
	if err != nil {
		log.Printf("load config: %v", err)
		return err
	}

	dynamoClient := dynamodb.NewFromConfig(awsCfg)

	restoreRepo := db.NewRestoreJobRepository(dynamoClient)
	archiveRepo := db.NewArchiveRepository(dynamoClient)

	if detail.Reason == "Restore Completed" {
		if err := restoreRepo.UpdateStatus(ctx, userID, archiveID, model.RestoreStatusReady); err != nil {
			log.Printf("update restore job status: %v", err)
			return err
		}

		if err := archiveRepo.UpdateStatus(ctx, userID, archiveID, model.StatusReady); err != nil {
			log.Printf("update archive status: %v", err)
			return err
		}

		archive, err := archiveRepo.Get(ctx, userID, archiveID)
		if err != nil || archive == nil {
			log.Printf("get archive for email: %v", err)
			return nil
		}

		sesClient := sesv2.NewFromConfig(awsCfg)
		userRepo := db.NewUserRepository(dynamoClient)
		user, err := userRepo.Get(ctx, userID)
		if err != nil || user == nil {
			log.Printf("get user for email: %v", err)
			return nil
		}

		if err := sendRestoreEmail(ctx, sesClient, user.Email, archive.Filename); err != nil {
			log.Printf("send restore email: %v", err)
		}
	} else if detail.Reason == "Restore Expired" {
		log.Printf("restore expired: user=%s archive=%s", userID, archiveID)

		if err := restoreRepo.UpdateStatus(ctx, userID, archiveID, model.RestoreStatusExpired); err != nil {
			log.Printf("update restore job to expired: %v", err)
		}

		if err := archiveRepo.UpdateStatus(ctx, userID, archiveID, model.StatusStored); err != nil {
			log.Printf("update archive back to stored: %v", err)
		}
	}

	return nil
}

func sendRestoreEmail(ctx context.Context, sesClient *sesv2.Client, email, filename string) error {
	subject := "Your archive \"" + filename + "\" is ready to download"
	bodyText := "Your archive \"" + filename + "\" has been restored from Deep Archive and is ready to download.\n\n"
	bodyText += "Please log in to LongBackup to download it. The download link will expire in 48 hours.\n\n"
	bodyText += "Thank you,\nLongBackup Team"

	_, err := sesClient.SendEmail(ctx, &sesv2.SendEmailInput{
		FromEmailAddress: &sesFromEmail,
		Destination: &types.Destination{
			ToAddresses: []string{email},
		},
		Content: &types.EmailContent{
			Simple: &types.Message{
				Subject: &types.Content{
					Data: &subject,
				},
				Body: &types.Body{
					Text: &types.Content{
						Data: &bodyText,
					},
				},
			},
		},
	})
	if err != nil {
		return err
	}

	log.Printf("sent restore email to %s for archive: %s", email, filename)
	return nil
}

func main() {
	lambda.Start(handler)
}
