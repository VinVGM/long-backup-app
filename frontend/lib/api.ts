import { fetchAuthSession } from "aws-amplify/auth"

const API_URL = process.env.NEXT_PUBLIC_API_URL || ""

async function getAuthHeaders(): Promise<Record<string, string>> {
  const session = await fetchAuthSession()
  const token = session.tokens?.accessToken?.toString()
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
