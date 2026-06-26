param(
    [Parameter(Mandatory = $true)]
    [string]$S3Bucket,

    [Parameter(Mandatory = $true)]
    [string]$DynamoDBUsersTable,

    [Parameter(Mandatory = $true)]
    [string]$DynamoDBArchivesTable,

    [Parameter(Mandatory = $true)]
    [string]$DynamoDBRestoreJobsTable,

    [Parameter(Mandatory = $true)]
    [string]$LambdaRoleArn,

    [string]$SESFromEmail = "",

    [string]$Region = "us-east-1",

    [switch]$SkipBuild,
    [switch]$SkipDeploy,
    [string]$S3Region = ""
)

$ErrorActionPreference = "Continue"
Set-Location -LiteralPath $PSScriptRoot

$StartTime = Get-Date

$Functions = @(
    @{ Name = "longbackup-upload-request";       Dir = "upload-request" },
    @{ Name = "longbackup-upload-complete";      Dir = "upload-complete" },
    @{ Name = "longbackup-list-archives";        Dir = "list-archives" },
    @{ Name = "longbackup-get-archive";          Dir = "get-archive" },
    @{ Name = "longbackup-initiate-restore";     Dir = "initiate-restore" },
    @{ Name = "longbackup-check-restore-status"; Dir = "check-restore-status" },
    @{ Name = "longbackup-generate-download-url";Dir = "generate-download-url" },
    @{ Name = "longbackup-get-user-profile";     Dir = "get-user-profile" },
    @{ Name = "longbackup-create-razorpay-order";Dir = "create-razorpay-order" },
    @{ Name = "longbackup-verify-razorpay-payment";Dir = "verify-razorpay-payment" },
    @{ Name = "longbackup-delete-archive";         Dir = "delete-archive" },
    @{ Name = "longbackup-batch-restore";          Dir = "batch-restore" },
    @{ Name = "longbackup-cancel-subscription";    Dir = "cancel-subscription" }
)

$envList = "S3_BUCKET=$S3Bucket,DYNAMODB_TABLE_USERS=$DynamoDBUsersTable,DYNAMODB_TABLE_ARCHIVES=$DynamoDBArchivesTable,DYNAMODB_TABLE_RESTORE_JOBS=$DynamoDBRestoreJobsTable"
if ($SESFromEmail -ne "") {
    $envList += ",SES_FROM_EMAIL=$SESFromEmail"
}

# ===================================================
if (-not $SkipBuild) {
    # STEP 1: BUILD
    # ===================================================
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  STEP 1/3: Building Lambda binaries" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan

    $env:GOOS = "linux"
    $env:GOARCH = "amd64"
    $env:CGO_ENABLED = "0"

    foreach ($fn in $Functions) {
        Write-Host ""
        Write-Host "[BUILD] $($fn.Name)" -ForegroundColor Cyan
        $buildStart = Get-Date

        $output = go build -o "build/$($fn.Dir)/bootstrap" "./cmd/$($fn.Dir)" 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Host "[FAIL] go build failed" -ForegroundColor Red
            Write-Host $output
            exit 1
        }

        Compress-Archive -Path "build/$($fn.Dir)/bootstrap" -DestinationPath "build/$($fn.Dir)/function.zip" -Force
        $size = [math]::Round((Get-Item "build/$($fn.Dir)/function.zip").Length / 1MB, 1)
        $elapsed = [math]::Round(((Get-Date) - $buildStart).TotalSeconds, 1)
        Write-Host "[ OK ] Built in ${elapsed}s - function.zip ($size MB)" -ForegroundColor Green
    }
} else {
    Write-Host "`n[Skipped] Build" -ForegroundColor Yellow
}

if (-not $SkipDeploy) {
    # ===================================================
    # STEP 2: DEPLOY LAMBDA FUNCTIONS
    # ===================================================
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  STEP 2/3: Deploying Lambda functions" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan

    foreach ($fn in $Functions) {
    $zipPath = (Resolve-Path "build/$($fn.Dir)/function.zip").Path
    Write-Host ""
    Write-Host "[DEPLOY] $($fn.Name)" -ForegroundColor Cyan
    Write-Host "  ZIP: $zipPath" -ForegroundColor Gray

    $env:AWS_PAGER = ""

    Write-Host "  => Checking if function exists..." -ForegroundColor Yellow
    aws lambda get-function --function-name $($fn.Name) --region $Region 2>&1 | Out-Null
    $exists = ($LASTEXITCODE -eq 0)

    if ($exists) {
        Write-Host "  [ OK ] Found existing function" -ForegroundColor Green

        Write-Host "  => Updating code..." -ForegroundColor Yellow
        aws lambda update-function-code `
            --function-name $($fn.Name) `
            --zip-file "fileb://$zipPath" `
            --region $Region

        if ($LASTEXITCODE -eq 0) {
            Write-Host "  [ OK ] Code updated" -ForegroundColor Green
        } else {
            Write-Host "  [FAIL] Code update failed" -ForegroundColor Red
            exit 1
        }

        Write-Host "  => Setting environment variables..." -ForegroundColor Yellow
        aws lambda update-function-configuration `
            --function-name $($fn.Name) `
            --environment "Variables={$envList}" `
            --region $Region

        if ($LASTEXITCODE -eq 0) {
            Write-Host "  [ OK ] Environment variables set" -ForegroundColor Green
        } else {
            Write-Host "  [WARN] Env vars failed (exit: $LASTEXITCODE)" -ForegroundColor Yellow
        }
    } else {
        Write-Host "  => Creating new function..." -ForegroundColor Yellow
        $createStart = Get-Date

        aws lambda create-function `
            --function-name $($fn.Name) `
            --runtime "provided.al2" `
            --role $LambdaRoleArn `
            --handler "bootstrap" `
            --zip-file "fileb://$zipPath" `
            --timeout 30 `
            --memory-size 128 `
            --environment "Variables={$envList}" `
            --region $Region

        if ($LASTEXITCODE -eq 0) {
            $elapsed = [math]::Round(((Get-Date) - $createStart).TotalSeconds, 1)
            Write-Host "  [ OK ] Created in ${elapsed}s" -ForegroundColor Green
        } else {
            Write-Host "  [FAIL] Create failed (exit: $LASTEXITCODE)" -ForegroundColor Red
            Write-Host "  Fix the error above and run again." -ForegroundColor Red
            exit 1
        }
    }
}
} else {
    Write-Host "[Skipped] Deploy" -ForegroundColor Yellow
}

# ===================================================
# STEP 3: S3 TRIGGER
# ===================================================
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  STEP 3/3: Configuring S3 trigger" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

if ($S3Region -eq "") { $S3Region = $Region }

Write-Host "[S3] Looking up upload-complete ARN..." -ForegroundColor Yellow
$fnArn = aws lambda get-function --function-name longbackup-upload-complete --region $Region --query "Configuration.FunctionArn" --output text 2>&1

if ($LASTEXITCODE -eq 0 -and $fnArn) {
    Write-Host "[S3] ARN: $fnArn" -ForegroundColor Gray
    Write-Host "[S3] Granting invoke permission..." -ForegroundColor Yellow

    $sid = "s3-trigger-$S3Bucket-$(Get-Random -Maximum 99999)"
    $permOut = aws lambda add-permission `
        --function-name longbackup-upload-complete `
        --statement-id $sid `
        --action "lambda:InvokeFunction" `
        --principal "s3.amazonaws.com" `
        --source-arn "arn:aws:s3:::$S3Bucket" `
        --region $Region 2>&1

    if ($LASTEXITCODE -eq 0) {
        Write-Host "[S3] Permission granted" -ForegroundColor Green
    } else {
        Write-Host "[S3] Permission OK (may already exist)" -ForegroundColor Yellow
    }

    Write-Host "[S3] Setting bucket notification (region: $S3Region)..." -ForegroundColor Yellow
    $configPath = Join-Path $env:TEMP "s3-notification-$S3Bucket.json"
    @"
{
    "LambdaFunctionConfigurations": [
        {
            "LambdaFunctionArn": "$fnArn",
            "Events": ["s3:ObjectCreated:*"],
            "Filter": {
                "Key": {
                    "FilterRules": [
                        {"Name": "prefix", "Value": "uploads/"}
                    ]
                }
            }
        }
    ]
}
"@ | Set-Content -Path $configPath -Encoding ASCII

    aws s3api put-bucket-notification-configuration `
        --bucket $S3Bucket `
        --notification-configuration "file://$configPath" `
        --region $S3Region 2>&1

    if ($LASTEXITCODE -eq 0) {
        Write-Host "[S3] Trigger configured successfully" -ForegroundColor Green
    } else {
        Write-Host "[S3] Trigger FAILED (exit: $LASTEXITCODE)" -ForegroundColor Red
        Write-Host "  Your S3 bucket may be in a different region. Pass -S3Region to specify." -ForegroundColor Yellow
    }

    Remove-Item $configPath -Force
} else {
    Write-Host "[S3] Skipped - longbackup-upload-complete not found" -ForegroundColor Yellow
}

# ===================================================
# DONE
# ===================================================
$totalTime = [math]::Round(((Get-Date) - $StartTime).TotalSeconds, 1)
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ALL DONE in ${totalTime}s" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps (manual):" -ForegroundColor Yellow
Write-Host "  1. Create API Gateway HTTP API with JWT authorizer (Cognito)" -ForegroundColor White
Write-Host "  2. Add 5 routes:" -ForegroundColor White
Write-Host "       POST /upload/request               => longbackup-upload-request" -ForegroundColor White
Write-Host "       GET  /archives                     => longbackup-list-archives" -ForegroundColor White
Write-Host "       GET  /archives/{id}                => longbackup-get-archive" -ForegroundColor White
Write-Host "       POST /archives/{id}/restore        => longbackup-initiate-restore" -ForegroundColor White
Write-Host "       GET  /archives/{id}/download       => longbackup-generate-download-url" -ForegroundColor White
Write-Host "  3. Enable CORS in API Gateway" -ForegroundColor White
Write-Host "  4. Create DynamoDB table RestoreJobs (PK: userId, SK: archiveId)" -ForegroundColor White
Write-Host "  5. Enable S3 EventBridge integration on S3 bucket" -ForegroundColor White
Write-Host "  6. Create EventBridge rule LongBackupRestoreCompleted for Object Restore Completed events" -ForegroundColor White
Write-Host "  7. Verify SES sender email and set SES_FROM_EMAIL env var" -ForegroundColor White
Write-Host "  8. Set frontend .env.local:" -ForegroundColor White
Write-Host "       NEXT_PUBLIC_API_URL = <API Gateway Invoke URL>" -ForegroundColor White
Write-Host "       NEXT_PUBLIC_COGNITO_USER_POOL_ID = <Pool ID>" -ForegroundColor White
Write-Host "       NEXT_PUBLIC_COGNITO_CLIENT_ID = <Client ID>" -ForegroundColor White
