package db

import (
	"context"
	"fmt"
	"os"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/attributevalue"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"

	"long-backup-app/backend/internal/model"
)

type RestoreJobRepository struct {
	client    *dynamodb.Client
	tableName string
}

func NewRestoreJobRepository(client *dynamodb.Client) *RestoreJobRepository {
	tableName := os.Getenv("DYNAMODB_TABLE_RESTORE_JOBS")
	if tableName == "" {
		tableName = "RestoreJobs"
	}
	return &RestoreJobRepository{
		client:    client,
		tableName: tableName,
	}
}

func (r *RestoreJobRepository) Create(ctx context.Context, job model.RestoreJob) error {
	item, err := attributevalue.MarshalMap(job)
	if err != nil {
		return fmt.Errorf("marshal restore job: %w", err)
	}

	_, err = r.client.PutItem(ctx, &dynamodb.PutItemInput{
		TableName: aws.String(r.tableName),
		Item:      item,
	})
	if err != nil {
		return fmt.Errorf("create restore job: %w", err)
	}

	return nil
}

func (r *RestoreJobRepository) Get(ctx context.Context, userID, archiveID string) (*model.RestoreJob, error) {
	out, err := r.client.GetItem(ctx, &dynamodb.GetItemInput{
		TableName: aws.String(r.tableName),
		Key: map[string]types.AttributeValue{
			"userId":    &types.AttributeValueMemberS{Value: userID},
			"archiveId": &types.AttributeValueMemberS{Value: archiveID},
		},
	})
	if err != nil {
		return nil, fmt.Errorf("get restore job: %w", err)
	}

	if out.Item == nil {
		return nil, nil
	}

	var job model.RestoreJob
	if err := attributevalue.UnmarshalMap(out.Item, &job); err != nil {
		return nil, fmt.Errorf("unmarshal restore job: %w", err)
	}

	return &job, nil
}

func (r *RestoreJobRepository) UpdateStatus(ctx context.Context, userID, archiveID, status string) error {
	_, err := r.client.UpdateItem(ctx, &dynamodb.UpdateItemInput{
		TableName: aws.String(r.tableName),
		Key: map[string]types.AttributeValue{
			"userId":    &types.AttributeValueMemberS{Value: userID},
			"archiveId": &types.AttributeValueMemberS{Value: archiveID},
		},
		UpdateExpression: aws.String("SET #s = :s, updatedAt = :ua"),
		ExpressionAttributeNames: map[string]string{
			"#s": "status",
		},
		ExpressionAttributeValues: map[string]types.AttributeValue{
			":s":  &types.AttributeValueMemberS{Value: status},
			":ua": &types.AttributeValueMemberS{Value: currentTimestamp()},
		},
	})
	if err != nil {
		return fmt.Errorf("update restore job status: %w", err)
	}

	return nil
}


