"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { getArchive, Archive } from "@/lib/api"
import { ArchiveStatusBadge } from "@/components/ArchiveStatusBadge"

export default function ArchiveDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [archive, setArchive] = useState<Archive | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!id) return
    setLoading(true)
    getArchive(id)
      .then(setArchive)
      .catch((err) => setError(err?.message || "Failed to load archive"))
      .finally(() => setLoading(false))
  }, [id])

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
    if (!iso) return "—"
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
    </div>
  )
}
