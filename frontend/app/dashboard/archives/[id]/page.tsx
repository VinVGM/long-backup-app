"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { getArchive, initiateRestore, getDownloadUrl, deleteArchive, Archive } from "@/lib/api"
import { ArchiveStatusBadge } from "@/components/ArchiveStatusBadge"

export default function ArchiveDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [archive, setArchive] = useState<Archive | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [restoring, setRestoring] = useState(false)
  const [restoreError, setRestoreError] = useState("")
  const [showConfirm, setShowConfirm] = useState(false)
  const [directDownloadMsg, setDirectDownloadMsg] = useState("")
  const [downloading, setDownloading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const router = useRouter()

  const fetchArchive = useCallback(async () => {
    if (!id) return
    try {
      const a = await getArchive(id)
      setArchive(a)
      setError("")
    } catch (err: any) {
      setError(err?.message || "Failed to load archive")
    }
  }, [id])

  useEffect(() => {
    if (!id) return
    setLoading(true)
    fetchArchive().finally(() => setLoading(false))
  }, [id, fetchArchive])

  const handleRestore = async () => {
    if (!archive) return
    setShowConfirm(false)
    setRestoring(true)
    setRestoreError("")
    try {
      const res = await initiateRestore(archive.archiveId)
      if (res.downloadUrl) {
        setDirectDownloadMsg("This file is still in Standard storage — downloading immediately. No restore needed.")
        setTimeout(() => setDirectDownloadMsg(""), 5000)
        window.open(res.downloadUrl, "_blank")
      } else {
        setArchive({ ...archive, status: "restoring" })
      }
    } catch (err: any) {
      setRestoreError(err?.message || "Restore failed")
    } finally {
      setRestoring(false)
    }
  }

  const handleDownload = async () => {
    if (!archive) return
    setDownloading(true)
    try {
      const { downloadUrl } = await getDownloadUrl(archive.archiveId)
      window.open(downloadUrl, "_blank")
    } catch (err: any) {
      setRestoreError(err?.message || "Download failed")
    } finally {
      setDownloading(false)
    }
  }

  const handleDelete = async () => {
    if (!archive) return
    setShowDeleteConfirm(false)
    setDeleting(true)
    try {
      await deleteArchive(archive.archiveId)
      router.push("/dashboard/archives")
    } catch (err: any) {
      setRestoreError(err?.message || "Delete failed")
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-red-600 mb-4">{error}</p>
        <Link href="/dashboard/archives" className="text-blue-600 hover:underline">
          Back to archives
        </Link>
      </div>
    )
  }

  if (!archive) return null

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
    if (bytes < 1024 * 1024 * 1024) return (bytes / 1024 / 1024).toFixed(1) + " MB"
    return (bytes / 1024 / 1024 / 1024).toFixed(2) + " GB"
  }

  const formatDate = (iso: string) => {
    if (!iso) return "\u2014"
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
    })
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        href="/dashboard/archives"
        className="text-sm text-blue-600 hover:underline mb-4 inline-block"
      >
        &larr; Back to Archives
      </Link>

      <h1 className="text-2xl font-bold mb-6 break-all">{archive.filename}</h1>

      <div className="bg-white rounded-xl border shadow-sm p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Size</p>
            <p className="font-medium">{formatSize(archive.sizeBytes)}</p>
          </div>
          <div>
            <p className="text-gray-500">Status</p>
            <ArchiveStatusBadge status={archive.status} />
            {archive.storageClass && (
              <p className="text-xs text-gray-400 mt-0.5">{archive.storageClass === "STANDARD" ? "Standard" : "Deep Archive"}</p>
            )}
          </div>
          <div>
            <p className="text-gray-500">Uploaded</p>
            <p className="font-medium">{formatDate(archive.createdAt)}</p>
          </div>
          <div>
            <p className="text-gray-500">Archive ID</p>
            <p className="font-medium text-xs break-all">{archive.archiveId}</p>
          </div>
        </div>

        {archive.description && (
          <div>
            <p className="text-sm text-gray-500">Description</p>
            <p className="text-sm">{archive.description}</p>
          </div>
        )}

        {archive.checksum && (
          <div>
            <p className="text-sm text-gray-500">Checksum (ETag)</p>
            <p className="text-xs font-mono break-all">{archive.checksum}</p>
          </div>
        )}
      </div>

      {archive.storageClass === "STANDARD" && archive.status === "stored" && (
        <div className="mt-6">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
          >
            {downloading ? "Preparing..." : "Download Archive"}
          </button>
          <p className="text-xs text-gray-500 mt-2">
            This file is in Standard storage and can be downloaded directly.
          </p>
        </div>
      )}

      {archive.storageClass === "DEEP_ARCHIVE" && archive.status === "stored" && (
        <div className="mt-6">
          <button
            onClick={() => setShowConfirm(true)}
            disabled={restoring}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {restoring ? "Initiating..." : "Restore from Deep Archive"}
          </button>
          <p className="text-xs text-gray-500 mt-2">
            Restore takes 12-48 hours. You&apos;ll receive an email when ready.
          </p>
        </div>
      )}

      {restoreError && (
        <p className="text-red-600 text-sm mt-4">{restoreError}</p>
      )}

      {directDownloadMsg && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
          {directDownloadMsg}
        </div>
      )}

      {archive.status === "restoring" && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />
            <div>
              <p className="text-sm font-medium text-blue-800">Restore in progress</p>
              <p className="text-xs text-blue-600">
                Restore typically takes 12-48 hours. Check back later or wait for the email notification.
              </p>
            </div>
          </div>
        </div>
      )}

      {archive.status !== "uploading" && !deleting && (
        <div className="mt-6 pt-4 border-t">
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="text-sm text-red-600 hover:underline"
          >
            Delete archive
          </button>
        </div>
      )}

      {deleting && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
          Deleting...
        </div>
      )}

      {archive.status === "ready" && (
        <div className="mt-6 flex items-center gap-4">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
          >
            {downloading ? "Preparing..." : "Download Archive"}
          </button>
          <p className="text-xs text-gray-500">
            Link expires 48 hours from restore completion.
          </p>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm mx-4 shadow-xl">
            <h3 className="text-lg font-bold mb-2 text-red-600">Delete Archive</h3>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to delete <strong>{archive.filename}</strong>?
              This will permanently remove the file from S3. This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm mx-4 shadow-xl">
            <h3 className="text-lg font-bold mb-2">Confirm Restore</h3>
            <p className="text-sm text-gray-600 mb-4">
              This will initiate a restore from Deep Archive for{" "}
              <strong>{archive.filename}</strong>. This process typically takes
              12-48 hours. You will receive an email notification when the
              archive is ready to download.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleRestore}
                className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Start Restore
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
