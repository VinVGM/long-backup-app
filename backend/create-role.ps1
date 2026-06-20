param(
    [string]$RoleName = "LongBackupLambdaRole",
    [string]$Region = "us-east-1"
)

$ErrorActionPreference = "Stop"

Write-Host "=== Creating IAM role: $RoleName ===" -ForegroundColor Cyan

# Trust policy — allows Lambda to assume this role
$TrustPolicy = @"
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "Service": "lambda.amazonaws.com"
            },
            "Action": "sts:AssumeRole"
        }
    ]
}
"@

# Save to temp file
$trustFile = [System.IO.Path]::GetTempFileName()
Set-Content -Path $trustFile -Value $TrustPolicy

# Create the role
Write-Host "  Creating role ..." -NoNewline
$role = aws iam create-role `
    --role-name $RoleName `
    --assume-role-policy-document "file://$trustFile" `
    --region $Region 2>$null

if ($LASTEXITCODE -eq 0) {
    Write-Host " OK" -ForegroundColor Green
} else {
    # Role might already exist
    Write-Host " already exists or error" -ForegroundColor Yellow
}

Remove-Item $trustFile -Force

# Attach CloudWatch Logs policy (managed)
Write-Host "  Attaching CloudWatch Logs policy ..." -NoNewline
aws iam attach-role-policy `
    --role-name $RoleName `
    --policy-arn "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole" `
    --region $Region 2>$null
if ($LASTEXITCODE -eq 0) { Write-Host " OK" -ForegroundColor Green }
else { Write-Host " already attached" -ForegroundColor Yellow }

# Create inline policy for DynamoDB + S3 access
$InlinePolicy = @"
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "dynamodb:GetItem",
                "dynamodb:PutItem",
                "dynamodb:UpdateItem",
                "dynamodb:Query"
            ],
            "Resource": "arn:aws:dynamodb:*:*:table/*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:GetObject",
                "s3:DeleteObject",
                "s3:RestoreObject"
            ],
            "Resource": "arn:aws:s3:::*/*"
        }
    ]
}
"@

$policyFile = [System.IO.Path]::GetTempFileName()
Set-Content -Path $policyFile -Value $InlinePolicy

Write-Host "  Attaching inline policy ..." -NoNewline
aws iam put-role-policy `
    --role-name $RoleName `
    --policy-name "LongBackupDataAccess" `
    --policy-document "file://$policyFile" `
    --region $Region 2>$null
if ($LASTEXITCODE -eq 0) { Write-Host " OK" -ForegroundColor Green }
else { Write-Host " FAILED" -ForegroundColor Red }
Remove-Item $policyFile -Force

# Get the ARN
$arn = aws iam get-role --role-name $RoleName --query "Role.Arn" --output text --region $Region 2>$null
if ($arn) {
    Write-Host "`nRole ARN: $arn" -ForegroundColor Green
    Write-Host "`nCopy this ARN — you'll need it for the deploy script." -ForegroundColor Yellow
}
