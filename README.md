<div align="center">
  <img src="https://img.shields.io/badge/status-active-success.svg" alt="Status" />
  <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License" />
  <img src="https://img.shields.io/badge/next.js-14.2-black?logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/go-1.26-00ADD8?logo=go" alt="Go" />
  <img src="https://img.shields.io/badge/aws-Lambda-FF9900?logo=amazonaws" alt="AWS Lambda" />
  <img src="https://img.shields.io/badge/razorpay-integration-3399FF?logo=razorpay" alt="Razorpay" />
  <br />
  <img src="https://img.shields.io/badge/tailwind_css-3.4-06B6D4?logo=tailwindcss" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/framer_motion-12.4-0055FF?logo=framer" alt="Framer Motion" />
  <img src="https://img.shields.io/badge/shadcn_ui-latest-000000?logo=shadcnui" alt="shadcn/ui" />
  <img src="https://img.shields.io/badge/dynamodb-PAY_PER_REQUEST-4053D6?logo=amazondynamodb" alt="DynamoDB" />
</div>

<br />

<div align="center">
  <h1>LongBackup</h1>
  <p><strong>Affordable long-term cloud backups powered by AWS S3 Deep Archive</strong></p>
  <p>Store your backups at 95% less cost than Google Drive or Dropbox using AWS Glacier Deep Archive.</p>
</div>

---

## ✨ Features

- **📤 Upload & Forget** — Files upload directly to S3 Deep Archive (cheapest AWS storage tier at ~₹0.08/GB/month)
- **🔄 Event-Driven Restore** — S3 EventBridge triggers Lambda on restore completion — no polling, no idle cost
- **📧 Email Notifications** — SES sends you an email when your restore is ready
- **⬇️ 48-Hour Download Window** — Presigned URLs for secure, time-limited downloads
- **💰 Razorpay Subscriptions** — Upgrade to paid plans (100GB/500GB/2TB) with monthly or yearly billing
- **🗑️ Archive Management** — Delete, batch restore, search, filter, and sort your archives
- **🌙 Dark/Light Mode** — Theme toggle with persistent preference

## 🧱 Architecture

```
Browser (Next.js 14)
    │
    ├─ Auth ──→ Cognito User Pool ──→ JWT Token
    │
    └─ API ──→ API Gateway ──→ 13 Lambda Functions (Go)
                                    │
                          ┌─────────┼─────────┐
                          │         │         │
                     DynamoDB      S3        SES
                          │         │
                          │    Deep Archive
                          │
                     EventBridge (event-driven)
```

### Data Flow

| Action | Flow |
|---|---|
| **Upload** | Frontend → API Gateway → Lambda creates presigned URL → File uploaded directly to S3 Deep Archive → Lambda updates DynamoDB |
| **List/Browse** | Frontend → API Gateway → Lambda queries DynamoDB → Returns paginated archive list |
| **Restore** | Frontend → API Gateway → Lambda calls S3 RestoreObject → S3 emits `Object Restore Completed` → EventBridge → Lambda updates status + sends SES email |
| **Download** | Frontend → API Gateway → Lambda verifies status → Generates presigned GET URL (48h expiry) |
| **Subscribe** | Frontend → API Gateway → Lambda creates Razorpay order → User pays → Lambda verifies signature + updates plan |

## 🚀 Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| [Next.js 14](https://nextjs.org/) (App Router) | React framework |
| [TypeScript](https://www.typescriptlang.org/) | Type safety |
| [Tailwind CSS 3.4](https://tailwindcss.com/) | Utility-first CSS |
| [shadcn/ui](https://ui.shadcn.com/) | Component library |
| [Framer Motion](https://www.framer.com/motion/) | Animations |
| [aws-amplify v6](https://docs.amplify.aws/) | Cognito authentication |
| [lucide-react](https://lucide.dev/) | Icons |

### Backend
| Technology | Purpose |
|---|---|
| [Go 1.26](https://go.dev/) | Lambda runtime |
| [AWS Lambda](https://aws.amazon.com/lambda/) (provided.al2) | Serverless compute |
| [API Gateway](https://aws.amazon.com/api-gateway/) (HTTP API) | API layer |
| [DynamoDB](https://aws.amazon.com/dynamodb/) (PAY_PER_REQUEST) | NoSQL database |
| [S3](https://aws.amazon.com/s3/) + Glacier Deep Archive | File storage |
| [SES](https://aws.amazon.com/ses/) | Email notifications |
| [EventBridge](https://aws.amazon.com/eventbridge/) | Event bus |
| [Cognito](https://aws.amazon.com/cognito/) | Authentication |
| [Razorpay](https://razorpay.com/) | Payment processing |

## 📦 Lambda Functions

| Function | Trigger | Purpose |
|---|---|---|
| `upload-request` | API Gateway `POST /upload/request` | Validate limits, generate presigned URL, create record |
| `upload-complete` | S3 ObjectCreated (uploads/) | Confirm upload, update status to stored |
| `list-archives` | API Gateway `GET /archives` | Paginated archive list |
| `get-archive` | API Gateway `GET /archives/{id}` | Single archive details |
| `initiate-restore` | API Gateway `POST /archives/{id}/restore` | Call RestoreObject, create RestoreJob |
| `check-restore-status` | EventBridge (Object Restore Completed/Expired) | Update status, send SES email |
| `generate-download-url` | API Gateway `GET /archives/{id}/download` | Presigned download URL with expiry check |
| `get-user-profile` | API Gateway `GET /user/profile` | User plan + storage info |
| `create-razorpay-order` | API Gateway `POST /payments/create-order` | Create Razorpay payment order |
| `verify-razorpay-payment` | API Gateway `POST /payments/verify` | Verify signature, update plan |
| `delete-archive` | API Gateway `DELETE /archives/{id}` | Delete S3 object + DynamoDB record |
| `batch-restore` | API Gateway `POST /archives/restore/batch` | Bulk restore multiple archives |
| `cancel-subscription` | API Gateway `POST /payments/cancel` | Downgrade to free plan |

## 💰 Pricing Plans

| Plan | Storage | Monthly | Yearly |
|---|---|---|---|
| Free | 1 GB | ₹0 | — |
| Basic | 100 GB | ₹99 | ₹999 |
| Pro | 500 GB | ₹199 | ₹1,999 |
| Business | 2 TB | ₹449 | ₹4,499 |

## 🛠️ Local Development

### Prerequisites
- Node.js 18+
- Go 1.26+
- AWS CLI (authenticated)
- Razorpay test API keys

### Frontend
```bash
cd frontend
npm install
cp .env.example .env.local  # Fill in your AWS + Cognito config
npm run dev
```

### Backend (build only, deploy via AWS)
```bash
cd backend
$env:GOOS="linux"; $env:GOARCH="amd64"; $env:CGO_ENABLED="0"
go build -o build/<name>/bootstrap ./cmd/<name>
```

### Deploy
```powershell
cd backend
.\deploy.ps1 -S3Bucket "longbackup-dev" `
  -DynamoDBUsersTable "pathrama-up-users" `
  -DynamoDBArchivesTable "pathrama-up-archives" `
  -DynamoDBRestoreJobsTable "pathrama-up-restore-jobs" `
  -LambdaRoleArn "arn:aws:iam::<account>:role/LongBackupLambdaRole" `
  -Region "ap-south-1" `
  -SESFromEmail "your@verified.email"
```

## 📄 License

MIT
