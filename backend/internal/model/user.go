package model

type User struct {
	UserID            string `json:"userId" dynamodbav:"userId"`
	Email             string `json:"email" dynamodbav:"email"`
	Plan              string `json:"plan" dynamodbav:"plan"`
	StorageUsedBytes  int64  `json:"storageUsedBytes" dynamodbav:"storageUsedBytes"`
	StorageLimitBytes int64  `json:"storageLimitBytes" dynamodbav:"storageLimitBytes"`
	CreatedAt         string `json:"createdAt" dynamodbav:"createdAt"`
}
