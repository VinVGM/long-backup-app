package s3client

import (
	"context"
	"fmt"
	"os"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/aws-sdk-go-v2/service/s3/types"
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
	return h.GeneratePresignedUploadURLWithStorage(ctx, key, expires, "")
}

func (h *Helper) GeneratePresignedUploadURLToDeepArchive(ctx context.Context, key string, expires time.Duration) (string, error) {
	return h.GeneratePresignedUploadURLWithStorage(ctx, key, expires, types.StorageClassDeepArchive)
}

func (h *Helper) GeneratePresignedUploadURLWithStorage(ctx context.Context, key string, expires time.Duration, storageClass types.StorageClass) (string, error) {
	presignClient := s3.NewPresignClient(h.client)

	input := &s3.PutObjectInput{
		Bucket: aws.String(bucketName()),
		Key:    aws.String(key),
	}
	if storageClass != "" {
		input.StorageClass = storageClass
	}

	req, err := presignClient.PresignPutObject(ctx, input, s3.WithPresignExpires(expires))
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

func (h *Helper) GetStorageClass(ctx context.Context, key string) (string, error) {
	out, err := h.client.HeadObject(ctx, &s3.HeadObjectInput{
		Bucket: aws.String(bucketName()),
		Key:    aws.String(key),
	})
	if err != nil {
		return "", fmt.Errorf("head object for storage class: %w", err)
	}
	if out.StorageClass == "" {
		return "STANDARD", nil
	}
	return string(out.StorageClass), nil
}

func (h *Helper) RestoreObject(ctx context.Context, key string, days int32) error {
	_, err := h.client.RestoreObject(ctx, &s3.RestoreObjectInput{
		Bucket: aws.String(bucketName()),
		Key:    aws.String(key),
		RestoreRequest: &types.RestoreRequest{
			Days: aws.Int32(days),
			GlacierJobParameters: &types.GlacierJobParameters{
				Tier: types.TierStandard,
			},
		},
	})
	if err != nil {
		return fmt.Errorf("restore object: %w", err)
	}
	return nil
}

func (h *Helper) IsRestoreComplete(ctx context.Context, key string) (bool, error) {
	out, err := h.client.HeadObject(ctx, &s3.HeadObjectInput{
		Bucket: aws.String(bucketName()),
		Key:    aws.String(key),
	})
	if err != nil {
		return false, fmt.Errorf("head object for restore status: %w", err)
	}

	if out.Restore == nil {
		return false, nil
	}

	// Restore header format: ongoing-request="false", expiry-date="..."
	// If ongoing-request is "false", restore is complete
	return true, nil
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
