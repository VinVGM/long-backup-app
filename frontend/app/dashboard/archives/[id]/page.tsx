"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { getArchive, initiateRestore, getDownloadUrl, deleteArchive, Archive } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ArrowLeft, Download, RotateCcw, Trash2 } from "lucide-react"

const statusVariant: Record<string, "uploading" | "stored" | "restoring" | "ready" | "expired"> = {
  uploading: "uploading",
  stored: "stored",
  restoring: "restoring",
  ready: "ready",
  expired: "expired",
}

export default function ArchiveDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [archive, setArchive] = useState<Archive | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [restoring, setRestoring] = useState(false)
  const [restoreError, setRestoreError] = useState("")
  const [directDownloadMsg, setDirectDownloadMsg] = useState("")
  const [downloading, setDownloading] = useState(false)
  const [deleting, setDeleting] = useState(false)

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
    setRestoring(true)
    setRestoreError("")
    try {
      const res = await initiateRestore(archive.archiveId)
      if (res.downloadUrl) {
        setDirectDownloadMsg("This file is still in Standard storage — downloading immediately.")
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-16 space-y-4">
        <p className="text-destructive">{error}</p>
        <Link href="/dashboard/archives"><Button variant="link">Back to archives</Button></Link>
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
    return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })
  }

  const storageLabel = archive.storageClass === "STANDARD" ? "Standard" : "Deep Archive"

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link href="/dashboard/archives" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Archives
      </Link>

      <h1 className="text-2xl font-bold break-all">{archive.filename}</h1>

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Size</p>
              <p className="font-medium">{formatSize(archive.sizeBytes)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Status</p>
              <Badge variant={statusVariant[archive.status] || "secondary"}>{archive.status}</Badge>
              <p className="text-xs text-muted-foreground mt-0.5">{storageLabel}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Uploaded</p>
              <p className="font-medium">{formatDate(archive.createdAt)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Archive ID</p>
              <p className="font-medium text-xs break-all">{archive.archiveId}</p>
            </div>
          </div>
          {archive.description && <div><p className="text-sm text-muted-foreground">Description</p><p className="text-sm">{archive.description}</p></div>}
          {archive.checksum && <div><p className="text-sm text-muted-foreground">Checksum (ETag)</p><p className="text-xs font-mono break-all">{archive.checksum}</p></div>}
        </CardContent>
      </Card>

      {restoreError && <p className="text-sm text-destructive">{restoreError}</p>}
      {directDownloadMsg && <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-sm text-green-500">{directDownloadMsg}</div>}

      {archive.storageClass === "STANDARD" && archive.status === "stored" && (
        <Button onClick={handleDownload} disabled={downloading}>
          <Download className="mr-2 h-4 w-4" />{downloading ? "Preparing..." : "Download Archive"}
        </Button>
      )}

      {archive.storageClass === "DEEP_ARCHIVE" && archive.status === "stored" && (
        <Dialog>
          <DialogTrigger asChild>
            <Button><RotateCcw className="mr-2 h-4 w-4" />Restore from Deep Archive</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Restore</DialogTitle>
              <DialogDescription>
                This will initiate a restore from Deep Archive for <strong>{archive.filename}</strong>.
                This process typically takes 12-48 hours. You will receive an email notification when the
                archive is ready to download.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => {}}>Cancel</Button>
              <Button onClick={handleRestore} disabled={restoring}>Start Restore</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {archive.status === "restoring" && (
        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500" />
            <div>
              <p className="text-sm font-medium text-blue-500">Restore in progress</p>
              <p className="text-xs text-blue-400">Restore typically takes 12-48 hours. Check back later or wait for the email notification.</p>
            </div>
          </div>
        </div>
      )}

      {archive.status === "ready" && (
        <div className="flex items-center gap-4">
          <Button onClick={handleDownload} disabled={downloading}>
            <Download className="mr-2 h-4 w-4" />{downloading ? "Preparing..." : "Download Archive"}
          </Button>
          <p className="text-xs text-muted-foreground">Link expires 48 hours from restore completion.</p>
        </div>
      )}

      {archive.status !== "uploading" && !deleting && (
        <div className="pt-4 border-t border-border">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />Delete archive
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="text-destructive">Delete Archive</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete <strong>{archive.filename}</strong>?
                  This will permanently remove the file from S3. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive hover:bg-destructive/90">
                  {deleting ? "Deleting..." : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </div>
  )
}
