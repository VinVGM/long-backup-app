"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { listArchives, batchRestore, Archive } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ArchiveIcon, Upload } from "lucide-react"

const statusVariant: Record<string, "uploading" | "stored" | "restoring" | "ready" | "expired"> = {
  uploading: "uploading",
  stored: "stored",
  restoring: "restoring",
  ready: "ready",
  expired: "expired",
}

export default function ArchivesPage() {
  const [archives, setArchives] = useState<Archive[]>([])
  const [nextToken, setNextToken] = useState<string | undefined>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [restoring, setRestoring] = useState(false)
  const [restoreMsg, setRestoreMsg] = useState("")

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

  const isRestorable = (a: Archive) => a.status === "stored"

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    const restorableIds = archives.filter(isRestorable).map((a) => a.archiveId)
    const allSelected = restorableIds.every((id) => selected.has(id))
    if (allSelected) setSelected(new Set())
    else setSelected(new Set(restorableIds))
  }

  const handleBatchRestore = async () => {
    const ids = archives.filter((a) => selected.has(a.archiveId) && isRestorable(a)).map((a) => a.archiveId)
    setRestoring(true)
    setRestoreMsg("")
    setError("")
    try {
      const res = await batchRestore(ids)
      setRestoreMsg(`${res.succeeded} restore(s) initiated. ${res.failed} failed.`)
      setSelected(new Set())
      load()
    } catch (err: any) {
      setError(err?.message || "Batch restore failed")
    } finally {
      setRestoring(false)
    }
  }

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Archives</h1>
        <Link href="/dashboard/upload">
          <Button size="sm">
            <Upload className="mr-2 h-4 w-4" />
            Upload
          </Button>
        </Link>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {restoreMsg && <p className="text-sm text-green-500">{restoreMsg}</p>}

      {selected.size > 0 && (
        <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg border border-border">
          <p className="text-sm text-muted-foreground">{selected.size} selected</p>
          <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>Clear</Button>
          <Button size="sm" onClick={handleBatchRestore} disabled={restoring}>
            {restoring ? "Restoring..." : `Restore Selected (${selected.size})`}
          </Button>
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          {loading && (
            <div className="p-6 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ))}
            </div>
          )}

          {!loading && archives.length === 0 && (
            <div className="p-12 text-center text-muted-foreground space-y-4">
              <ArchiveIcon className="h-12 w-12 mx-auto opacity-30" />
              <p className="text-lg">No archives yet</p>
              <p className="text-sm">Upload your first ZIP archive to get started.</p>
              <Link href="/dashboard/upload">
                <Button size="sm">Upload Archive</Button>
              </Link>
            </div>
          )}

          {archives.length > 0 && (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/30 text-left">
                  <th className="px-4 py-3 w-10">
                    {archives.some(isRestorable) && (
                      <input
                        type="checkbox"
                        checked={archives.filter(isRestorable).every((a) => selected.has(a.archiveId))}
                        onChange={toggleAll}
                        className="rounded"
                      />
                    )}
                  </th>
                  <th className="px-4 py-3 font-medium">Filename</th>
                  <th className="px-4 py-3 font-medium">Size</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Uploaded</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {archives.map((a) => (
                  <tr key={a.archiveId} className="border-b border-border last:border-0 hover:bg-accent/50">
                    <td className="px-4 py-3">
                      {isRestorable(a) ? (
                        <input type="checkbox" checked={selected.has(a.archiveId)} onChange={() => toggleSelect(a.archiveId)} className="rounded" />
                      ) : (
                        <span className="text-muted-foreground text-xs ml-1">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium truncate max-w-[200px]">{a.filename}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatSize(a.sizeBytes)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant[a.status] || "secondary"}>{a.status}</Badge>
                      {a.storageClass === "DEEP_ARCHIVE" && a.status === "stored" && (
                        <span className="ml-1.5 text-[10px] text-muted-foreground">DA</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(a.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/dashboard/archives/${a.archiveId}`} className="text-primary hover:underline text-sm">
                        Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {nextToken && !loading && (
            <div className="p-4 text-center border-t border-border">
              <Button variant="link" size="sm" onClick={() => load(nextToken)}>Load more</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
