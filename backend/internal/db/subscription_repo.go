package db

import (
	"context"
	"fmt"
	"os"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/attributevalue"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
)

type SubscriptionRepository struct {
	client    *dynamodb.Client
	tableName string
}

func NewSubscriptionRepository(client *dynamodb.Client) *SubscriptionRepository {
	tableName := os.Getenv("DYNAMODB_TABLE_SUBSCRIPTIONS")
	if tableName == "" {
		tableName = "Subscriptions"
	}
	return &SubscriptionRepository{
		client:    client,
		tableName: tableName,
	}
}

type SubscriptionRecord struct {
	UserID        string `json:"userId" dynamodbav:"userId"`
	SubscriptionID string `json:"subscriptionId" dynamodbav:"subscriptionId"`
	Plan          string `json:"plan" dynamodbav:"plan"`
	PaymentID     string `json:"paymentId" dynamodbav:"paymentId"`
	OrderID       string `json:"orderId" dynamodbav:"orderId"`
	Amount        int64  `json:"amount" dynamodbav:"amount"`
	Currency      string `json:"currency" dynamodbav:"currency"`
	Interval      string `json:"interval" dynamodbav:"interval"`
	Status        string `json:"status" dynamodbav:"status"`
	CreatedAt     string `json:"createdAt" dynamodbav:"createdAt"`
	ExpiresAt     string `json:"expiresAt,omitempty" dynamodbav:"expiresAt"`
}

func (r *SubscriptionRepository) Create(ctx context.Context, record SubscriptionRecord) error {
	item, err := attributevalue.MarshalMap(record)
	if err != nil {
		return fmt.Errorf("marshal subscription: %w", err)
	}
	_, err = r.client.PutItem(ctx, &dynamodb.PutItemInput{
		TableName: aws.String(r.tableName),
		Item:      item,
	})
	if err != nil {
		return fmt.Errorf("create subscription: %w", err)
	}
	return nil
}

func (r *SubscriptionRepository) UpdateStatus(ctx context.Context, userID, subscriptionID, status, updatedAt string) error {
	_, err := r.client.UpdateItem(ctx, &dynamodb.UpdateItemInput{
		TableName: aws.String(r.tableName),
		Key: map[string]types.AttributeValue{
			"userId":         &types.AttributeValueMemberS{Value: userID},
			"subscriptionId": &types.AttributeValueMemberS{Value: subscriptionID},
		},
		UpdateExpression: aws.String("SET #s = :s, updatedAt = :ua"),
		ExpressionAttributeNames: map[string]string{
			"#s": "status",
		},
		ExpressionAttributeValues: map[string]types.AttributeValue{
			":s":  &types.AttributeValueMemberS{Value: status},
			":ua": &types.AttributeValueMemberS{Value: updatedAt},
		},
	})
	if err != nil {
		return fmt.Errorf("update subscription status: %w", err)
	}
	return nil
}

func (r *SubscriptionRepository) GetByUserID(ctx context.Context, userID string) (*SubscriptionRecord, error) {
	out, err := r.client.Query(ctx, &dynamodb.QueryInput{
		TableName:              aws.String(r.tableName),
		KeyConditionExpression: aws.String("userId = :uid"),
		ExpressionAttributeValues: map[string]types.AttributeValue{
			":uid": &types.AttributeValueMemberS{Value: userID},
		},
		ScanIndexForward: aws.Bool(false),
		Limit:            aws.Int32(1),
	})
	if err != nil {
		return nil, fmt.Errorf("query subscription: %w", err)
	}
	if len(out.Items) == 0 {
		return nil, nil
	}
	var record SubscriptionRecord
	if err := attributevalue.UnmarshalMap(out.Items[0], &record); err != nil {
		return nil, fmt.Errorf("unmarshal subscription: %w", err)
	}
	return &record, nil
}
