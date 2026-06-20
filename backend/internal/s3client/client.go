package s3client

import (
	"context"
	"fmt"
	"os"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

func bucketName() string {
	if b := os.Getenv("S3_BUCKET"); b != "" {
		return b
	}
	return "longbackup-dev"
}

type Helper struct {
	client *s3.Client
}

func NewHelper(client *s3.Client) *Helper {
	return &Helper{client: client}
}

func (h *Helper) GeneratePresignedUploadURL(ctx context.Context, key string, expires time.Duration) (string, error) {
	presignClient := s3.NewPresignClient(h.client)

	req, err := presignClient.PresignPutObject(ctx, &s3.PutObjectInput{
		Bucket: aws.String(bucketName()),
		Key:    aws.String(key),
	}, s3.WithPresignExpires(expires))
	if err != nil {
		return "", fmt.Errorf("generate presigned upload URL: %w", err)
	}

	return req.URL, nil
}

func (h *Helper) GeneratePresignedDownloadURL(ctx context.Context, key string, expires time.Duration) (string, error) {
	presignClient := s3.NewPresignClient(h.client)

	req, err := presignClient.PresignGetObject(ctx, &s3.GetObjectInput{
		Bucket: aws.String(bucketName()),
		Key:    aws.String(key),
	}, s3.WithPresignExpires(expires))
	if err != nil {
		return "", fmt.Errorf("generate presigned download URL: %w", err)
	}

	return req.URL, nil
}

func (h *Helper) GetObjectMetadata(ctx context.Context, key string) (int64, string, error) {
	out, err := h.client.HeadObject(ctx, &s3.HeadObjectInput{
		Bucket: aws.String(bucketName()),
		Key:    aws.String(key),
	})
	if err != nil {
		return 0, "", fmt.Errorf("head object: %w", err)
	}

	var etag string
	if out.ETag != nil {
		etag = *out.ETag
	}

	return aws.ToInt64(out.ContentLength), etag, nil
}

func (h *Helper) DeleteObject(ctx context.Context, key string) error {
	_, err := h.client.DeleteObject(ctx, &s3.DeleteObjectInput{
		Bucket: aws.String(bucketName()),
		Key:    aws.String(key),
	})
	if err != nil {
		return fmt.Errorf("delete object: %w", err)
	}
	return nil
}
