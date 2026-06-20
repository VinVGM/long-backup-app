package db

import (
	"context"
	"fmt"
	"os"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/attributevalue"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"

	"long-backup-app/backend/internal/model"
)

type UserRepository struct {
	client    *dynamodb.Client
	tableName string
}

func NewUserRepository(client *dynamodb.Client) *UserRepository {
	tableName := os.Getenv("DYNAMODB_TABLE_USERS")
	if tableName == "" {
		tableName = "Users"
	}
	return &UserRepository{
		client:    client,
		tableName: tableName,
	}
}

func (r *UserRepository) Get(ctx context.Context, userID string) (*model.User, error) {
	out, err := r.client.GetItem(ctx, &dynamodb.GetItemInput{
		TableName: aws.String(r.tableName),
		Key: map[string]types.AttributeValue{
			"userId": &types.AttributeValueMemberS{Value: userID},
		},
	})
	if err != nil {
		return nil, fmt.Errorf("get user: %w", err)
	}

	if out.Item == nil {
		return nil, nil
	}

	var user model.User
	if err := attributevalue.UnmarshalMap(out.Item, &user); err != nil {
		return nil, fmt.Errorf("unmarshal user: %w", err)
	}

	return &user, nil
}

func (r *UserRepository) Create(ctx context.Context, userID, email string) error {
	now := time.Now().UTC().Format(time.RFC3339)
	user := model.User{
		UserID:            userID,
		Email:             email,
		Plan:              "free",
		StorageUsedBytes:  0,
		StorageLimitBytes: 1 * 1024 * 1024 * 1024, // 1GB free tier
		CreatedAt:         now,
	}

	item, err := attributevalue.MarshalMap(user)
	if err != nil {
		return fmt.Errorf("marshal user: %w", err)
	}

	_, err = r.client.PutItem(ctx, &dynamodb.PutItemInput{
		TableName: aws.String(r.tableName),
		Item:      item,
		ConditionExpression: aws.String("attribute_not_exists(userId)"),
	})
	if err != nil {
		return fmt.Errorf("create user: %w", err)
	}

	return nil
}

func (r *UserRepository) UpdateStorageUsed(ctx context.Context, userID string, delta int64) error {
	_, err := r.client.UpdateItem(ctx, &dynamodb.UpdateItemInput{
		TableName: aws.String(r.tableName),
		Key: map[string]types.AttributeValue{
			"userId": &types.AttributeValueMemberS{Value: userID},
		},
		UpdateExpression: aws.String("ADD storageUsedBytes :delta"),
		ExpressionAttributeValues: map[string]types.AttributeValue{
			":delta": &types.AttributeValueMemberN{Value: fmt.Sprintf("%d", delta)},
		},
	})
	if err != nil {
		return fmt.Errorf("update storage used: %w", err)
	}

	return nil
}
