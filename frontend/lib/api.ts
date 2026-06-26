import { fetchAuthSession } from "aws-amplify/auth"

const API_URL = process.env.NEXT_PUBLIC_API_URL || ""

async function getAuthHeaders(): Promise<Record<string, string>> {
  const session = await fetchAuthSession()
  const token = session.tokens?.idToken?.toString()
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

export interface UploadRequestResponse {
  archiveId: string
  presignedUrl: string
  s3Key: string
}

export interface Archive {
  userId: string
  archiveId: string
  filename: string
  sizeBytes: number
  description?: string
  s3Key: string
  status: string
  checksum?: string
  createdAt: string
  updatedAt?: string
  storageClass?: string
}

export interface ArchiveListResponse {
  archives: Archive[]
  nextToken?: string
}

export async function requestUploadUrl(
  filename: string,
  size: number,
  description?: string
): Promise<UploadRequestResponse> {
  const headers = await getAuthHeaders()
  const res = await fetch(`${API_URL}/upload/request`, {
    method: "POST",
    headers,
    body: JSON.stringify({ filename, size, description }),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: "Upload request failed" }))
    throw new Error(body.error || `HTTP ${res.status}`)
  }

  return res.json()
}

export async function uploadToS3(
  presignedUrl: string,
  file: File,
  onProgress?: (percent: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open("PUT", presignedUrl)
    xhr.setRequestHeader("x-amz-storage-class", "DEEP_ARCHIVE")

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100))
      }
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve()
      } else {
        reject(new Error(`Upload failed: HTTP ${xhr.status}`))
      }
    }

    xhr.onerror = () => reject(new Error("Network error during upload"))
    xhr.send(file)
  })
}

export async function listArchives(
  limit?: number,
  nextToken?: string
): Promise<ArchiveListResponse> {
  const headers = await getAuthHeaders()
  const params = new URLSearchParams()
  if (limit) params.set("limit", String(limit))
  if (nextToken) params.set("nextToken", nextToken)

  const res = await fetch(`${API_URL}/archives?${params}`, {
    headers,
  })

  if (!res.ok) {
    throw new Error(`Failed to list archives: HTTP ${res.status}`)
  }

  return res.json()
}

export interface RestoreResponse {
  success: boolean
  message: string
  downloadUrl?: string
  expiresAt?: string
}

export interface DownloadUrlResponse {
  downloadUrl: string
  expiresAt: string
}

export async function initiateRestore(archiveId: string): Promise<RestoreResponse> {
  const headers = await getAuthHeaders()
  const res = await fetch(`${API_URL}/archives/${encodeURIComponent(archiveId)}/restore`, {
    method: "POST",
    headers,
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: "Restore request failed" }))
    throw new Error(body.error || `HTTP ${res.status}`)
  }

  return res.json()
}

export async function getDownloadUrl(archiveId: string): Promise<DownloadUrlResponse> {
  const headers = await getAuthHeaders()
  const res = await fetch(`${API_URL}/archives/${encodeURIComponent(archiveId)}/download`, {
    headers,
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: "Download request failed" }))
    throw new Error(body.error || `HTTP ${res.status}`)
  }

  return res.json()
}

export interface UserProfile {
  userId: string
  email: string
  plan: string
  storageUsedBytes: number
  storageLimitBytes: number
  createdAt: string
}

export interface CreateOrderResponse {
  orderId: string
  amount: number
  currency: string
  keyId: string
  planName: string
}

export interface VerifyPaymentRequest {
  razorpay_payment_id: string
  razorpay_order_id: string
  razorpay_signature: string
  planId: string
  interval: string
}

export async function getCurrentUserProfile(): Promise<UserProfile> {
  const headers = await getAuthHeaders()
  const res = await fetch(`${API_URL}/user/profile`, { headers })
  if (!res.ok) throw new Error("Failed to get profile")
  return res.json()
}

export async function createOrder(planId: string, interval: string): Promise<CreateOrderResponse> {
  const headers = await getAuthHeaders()
  const res = await fetch(`${API_URL}/payments/create-order`, {
    method: "POST",
    headers,
    body: JSON.stringify({ planId, interval }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: "Order creation failed" }))
    throw new Error(body.error || `HTTP ${res.status}`)
  }
  return res.json()
}

export async function verifyPayment(data: VerifyPaymentRequest): Promise<any> {
  const headers = await getAuthHeaders()
  const res = await fetch(`${API_URL}/payments/verify`, {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: "Payment verification failed" }))
    throw new Error(body.error || `HTTP ${res.status}`)
  }
  return res.json()
}

export async function deleteArchive(archiveId: string): Promise<void> {
  const headers = await getAuthHeaders()
  const res = await fetch(`${API_URL}/archives/${encodeURIComponent(archiveId)}`, {
    method: "DELETE",
    headers,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: "Delete failed" }))
    throw new Error(body.error || `HTTP ${res.status}`)
  }
}

export interface BatchRestoreRequest {
  archiveIds: string[]
}

export interface BatchRestoreResponse {
  succeeded: number
  failed: number
  errors?: string[]
}

export async function batchRestore(archiveIds: string[]): Promise<BatchRestoreResponse> {
  const headers = await getAuthHeaders()
  const res = await fetch(`${API_URL}/archives/restore/batch`, {
    method: "POST",
    headers,
    body: JSON.stringify({ archiveIds }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: "Batch restore failed" }))
    throw new Error(body.error || `HTTP ${res.status}`)
  }
  return res.json()
}

export async function cancelSubscription(): Promise<any> {
  const headers = await getAuthHeaders()
  const res = await fetch(`${API_URL}/payments/cancel`, {
    method: "POST",
    headers,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: "Cancel failed" }))
    throw new Error(body.error || `HTTP ${res.status}`)
  }
  return res.json()
}

export async function getArchive(id: string): Promise<Archive> {
  const headers = await getAuthHeaders()
  const res = await fetch(`${API_URL}/archives/${encodeURIComponent(id)}`, {
    headers,
  })

  if (!res.ok) {
    if (res.status === 404) throw new Error("Archive not found")
    throw new Error(`Failed to get archive: HTTP ${res.status}`)
  }

  return res.json()
}
