package db

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"strconv"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/attributevalue"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"

	"long-backup-app/backend/internal/model"
)

type ArchiveRepository struct {
	client    *dynamodb.Client
	tableName string
}

func NewArchiveRepository(client *dynamodb.Client) *ArchiveRepository {
	tableName := os.Getenv("DYNAMODB_TABLE_ARCHIVES")
	if tableName == "" {
		tableName = "Archives"
	}
	return &ArchiveRepository{
		client:    client,
		tableName: tableName,
	}
}

func (r *ArchiveRepository) Create(ctx context.Context, archive model.Archive) error {
	item, err := attributevalue.MarshalMap(archive)
	if err != nil {
		return fmt.Errorf("marshal archive: %w", err)
	}

	_, err = r.client.PutItem(ctx, &dynamodb.PutItemInput{
		TableName: aws.String(r.tableName),
		Item:      item,
	})
	if err != nil {
		return fmt.Errorf("put archive: %w", err)
	}

	return nil
}

func (r *ArchiveRepository) Get(ctx context.Context, userID, archiveID string) (*model.Archive, error) {
	out, err := r.client.GetItem(ctx, &dynamodb.GetItemInput{
		TableName: aws.String(r.tableName),
		Key: map[string]types.AttributeValue{
			"userId":    &types.AttributeValueMemberS{Value: userID},
			"archiveId": &types.AttributeValueMemberS{Value: archiveID},
		},
	})
	if err != nil {
		return nil, fmt.Errorf("get archive: %w", err)
	}

	if out.Item == nil {
		return nil, nil
	}

	var archive model.Archive
	if err := attributevalue.UnmarshalMap(out.Item, &archive); err != nil {
		return nil, fmt.Errorf("unmarshal archive: %w", err)
	}

	return &archive, nil
}

func (r *ArchiveRepository) List(ctx context.Context, userID string, limit int, nextToken string) ([]model.Archive, string, error) {
	input := &dynamodb.QueryInput{
		TableName:              aws.String(r.tableName),
		KeyConditionExpression: aws.String("userId = :uid"),
		ExpressionAttributeValues: map[string]types.AttributeValue{
			":uid": &types.AttributeValueMemberS{Value: userID},
		},
		ScanIndexForward: aws.Bool(false),
		Limit:            aws.Int32(int32(limit)),
	}

	if nextToken != "" {
		// ExclusiveStartKey from nextToken (JSON encoded)
		var startKey map[string]types.AttributeValue
		if err := decodeStartKey(nextToken, &startKey); err != nil {
			return nil, "", fmt.Errorf("decode next token: %w", err)
		}
		input.ExclusiveStartKey = startKey
	}

	out, err := r.client.Query(ctx, input)
	if err != nil {
		return nil, "", fmt.Errorf("query archives: %w", err)
	}

	archives := make([]model.Archive, 0, len(out.Items))
	for _, item := range out.Items {
		var archive model.Archive
		if err := attributevalue.UnmarshalMap(item, &archive); err != nil {
			return nil, "", fmt.Errorf("unmarshal archive: %w", err)
		}
		archives = append(archives, archive)
	}

	var encodedToken string
	if out.LastEvaluatedKey != nil {
		encodedToken, err = encodeStartKey(out.LastEvaluatedKey)
		if err != nil {
			return nil, "", fmt.Errorf("encode next token: %w", err)
		}
	}

	return archives, encodedToken, nil
}

func (r *ArchiveRepository) UpdateStatus(ctx context.Context, userID, archiveID, status string) error {
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
		return fmt.Errorf("update archive status: %w", err)
	}

	return nil
}

func (r *ArchiveRepository) UpdateStatusWithChecksum(ctx context.Context, userID, archiveID, status, checksum string, size int64) error {
	_, err := r.client.UpdateItem(ctx, &dynamodb.UpdateItemInput{
		TableName: aws.String(r.tableName),
		Key: map[string]types.AttributeValue{
			"userId":    &types.AttributeValueMemberS{Value: userID},
			"archiveId": &types.AttributeValueMemberS{Value: archiveID},
		},
		UpdateExpression: aws.String("SET #s = :s, checksum = :c, sizeBytes = :sz, updatedAt = :ua"),
		ExpressionAttributeNames: map[string]string{
			"#s": "status",
		},
		ExpressionAttributeValues: map[string]types.AttributeValue{
			":s":  &types.AttributeValueMemberS{Value: status},
			":c":  &types.AttributeValueMemberS{Value: checksum},
			":sz": &types.AttributeValueMemberN{Value: strconv.FormatInt(size, 10)},
			":ua": &types.AttributeValueMemberS{Value: currentTimestamp()},
		},
	})
	if err != nil {
		return fmt.Errorf("update archive with checksum: %w", err)
	}

	return nil
}

func (r *ArchiveRepository) Delete(ctx context.Context, userID, archiveID string) error {
	_, err := r.client.DeleteItem(ctx, &dynamodb.DeleteItemInput{
		TableName: aws.String(r.tableName),
		Key: map[string]types.AttributeValue{
			"userId":    &types.AttributeValueMemberS{Value: userID},
			"archiveId": &types.AttributeValueMemberS{Value: archiveID},
		},
	})
	if err != nil {
		return fmt.Errorf("delete archive: %w", err)
	}
	return nil
}

func encodeStartKey(key map[string]types.AttributeValue) (string, error) {
	// Convert AttributeValue map to JSON-serializable map
	simple := make(map[string]string)
	for k, v := range key {
		switch attr := v.(type) {
		case *types.AttributeValueMemberS:
			simple[k] = attr.Value
		default:
			return "", fmt.Errorf("unsupported attribute type for key: %s", k)
		}
	}
	b, err := json.Marshal(simple)
	if err != nil {
		return "", err
	}
	return string(b), nil
}

func decodeStartKey(token string, out *map[string]types.AttributeValue) error {
	var simple map[string]string
	if err := json.Unmarshal([]byte(token), &simple); err != nil {
		return err
	}
	*out = make(map[string]types.AttributeValue)
	for k, v := range simple {
		(*out)[k] = &types.AttributeValueMemberS{Value: v}
	}
	return nil
}
