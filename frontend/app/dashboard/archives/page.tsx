"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { listArchives, Archive } from "@/lib/api"
import { ArchiveStatusBadge } from "@/components/ArchiveStatusBadge"

export default function ArchivesPage() {
  const [archives, setArchives] = useState<Archive[]>([])
  const [nextToken, setNextToken] = useState<string | undefined>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const load = async (token?: string) => {
    setLoading(true)
    setError("")
    try {
      const res = await listArchives(20, token)
      if (token) {
        setArchives((prev) => [...prev, ...res.archives])
      } else {
        setArchives(res.archives)
      }
      setNextToken(res.nextToken)
    } catch (err: any) {
      setError(err?.message || "Failed to load archives")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
    if (bytes < 1024 * 1024 * 1024) return (bytes / 1024 / 1024).toFixed(1) + " MB"
    return (bytes / 1024 / 1024 / 1024).toFixed(2) + " GB"
  }

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Archives</h1>
        <Link
          href="/dashboard/upload"
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
        >
          + Upload
        </Link>
      </div>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        {archives.length === 0 && !loading && (
          <div className="p-8 text-center text-gray-500">
            <p className="text-lg mb-2">No archives yet</p>
            <p className="text-sm">Upload your first ZIP archive to get started.</p>
          </div>
        )}

        {archives.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left">
                <th className="px-4 py-3 font-medium">Filename</th>
                <th className="px-4 py-3 font-medium">Size</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Uploaded</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {archives.map((a) => (
                <tr key={a.archiveId} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium truncate max-w-[200px]">{a.filename}</td>
                  <td className="px-4 py-3 text-gray-600">{formatSize(a.sizeBytes)}</td>
                  <td className="px-4 py-3"><ArchiveStatusBadge status={a.status} /></td>
                  <td className="px-4 py-3 text-gray-600">{formatDate(a.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/dashboard/archives/${a.archiveId}`}
                      className="text-blue-600 hover:underline text-sm"
                    >
                      Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {loading && (
          <div className="p-4 text-center text-gray-500 text-sm">Loading...</div>
        )}

        {nextToken && !loading && (
          <div className="p-4 text-center">
            <button
              onClick={() => load(nextToken)}
              className="text-blue-600 hover:underline text-sm"
            >
              Load more
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
