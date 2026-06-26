package model

const (
	StatusUploading  = "uploading"
	StatusStored     = "stored"
	StatusRestoring  = "restoring"
	StatusReady      = "ready"
	StatusExpired    = "expired"
)

const (
	StorageClassStandard    = "STANDARD"
	StorageClassDeepArchive = "DEEP_ARCHIVE"
)

type Archive struct {
	UserID       string `json:"userId" dynamodbav:"userId"`
	ArchiveID    string `json:"archiveId" dynamodbav:"archiveId"`
	Filename     string `json:"filename" dynamodbav:"filename"`
	SizeBytes    int64  `json:"sizeBytes" dynamodbav:"sizeBytes"`
	Description  string `json:"description,omitempty" dynamodbav:"description"`
	S3Key        string `json:"s3Key" dynamodbav:"s3Key"`
	Status       string `json:"status" dynamodbav:"status"`
	Checksum     string `json:"checksum,omitempty" dynamodbav:"checksum"`
	CreatedAt    string `json:"createdAt" dynamodbav:"createdAt"`
	UpdatedAt    string `json:"updatedAt,omitempty" dynamodbav:"updatedAt"`
	StorageClass string `json:"storageClass,omitempty" dynamodbav:"-"`
}

func ComputeStorageClass(createdAt string) string {
	return StorageClassDeepArchive
}

type ArchiveListResponse struct {
	Archives   []Archive `json:"archives"`
	NextToken  string    `json:"nextToken,omitempty"`
}
