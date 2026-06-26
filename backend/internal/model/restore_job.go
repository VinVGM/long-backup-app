package model

const (
	RestoreStatusInProgress  = "in_progress"
	RestoreStatusReady       = "ready"
	RestoreStatusDownloaded  = "downloaded"
	RestoreStatusExpired     = "expired"
)

type RestoreJob struct {
	UserID    string `json:"userId" dynamodbav:"userId"`
	ArchiveID string `json:"archiveId" dynamodbav:"archiveId"`
	Status    string `json:"status" dynamodbav:"status"`
	S3Key     string `json:"s3Key" dynamodbav:"s3Key"`
	CreatedAt string `json:"createdAt" dynamodbav:"createdAt"`
	UpdatedAt string `json:"updatedAt,omitempty" dynamodbav:"updatedAt"`
	ExpiresAt string `json:"expiresAt,omitempty" dynamodbav:"expiresAt"`
}
