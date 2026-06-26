"use client"

import { useState, useRef } from "react"
import Link from "next/link"
import { requestUploadUrl, uploadToS3 } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Upload, Check, FileArchive, Eye, UploadIcon } from "lucide-react"

export default function UploadPage() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [description, setDescription] = useState("")
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [archiveId, setArchiveId] = useState("")

  const handleUpload = async () => {
    if (!file) return
    setError("")
    setSuccess(false)
    setUploading(true)
    setProgress(0)
    try {
      const res = await requestUploadUrl(file.name, file.size, description || undefined)
      setArchiveId(res.archiveId)
      await uploadToS3(res.presignedUrl, file, setProgress)
      setSuccess(true)
    } catch (err: any) {
      setError(err?.message || "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  const resetForm = () => {
    setSuccess(false)
    setFile(null)
    setDescription("")
    setArchiveId("")
    setProgress(0)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Upload Archive</h1>

      {success ? (
        <Card>
          <CardContent className="p-8 text-center space-y-4">
            <div className="h-16 w-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
              <Check className="h-8 w-8 text-green-500" />
            </div>
            <h2 className="text-xl font-bold">Upload Complete!</h2>
            <p className="text-sm text-muted-foreground break-all">{file?.name}</p>
            <p className="text-xs text-muted-foreground">Stored directly in Deep Archive for cost-efficient long-term storage.</p>
            <div className="flex gap-3 justify-center pt-2">
              <Link href={`/dashboard/archives/${archiveId}`}>
                <Button size="sm">
                  <Eye className="mr-2 h-4 w-4" /> View Archive
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={resetForm}>
                <UploadIcon className="mr-2 h-4 w-4" /> Upload Another
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6 space-y-4">
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) setFile(f) }}
              className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 cursor-pointer transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <input ref={fileInputRef} type="file" accept=".zip,.tar,.gz,.tar.gz,.7z,.rar" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) setFile(f) }} />
              <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground text-sm">{file ? "Tap to change file" : "Drop a ZIP archive here or click to browse"}</p>
            </div>

            {file && (
              <div className="flex items-center gap-3 p-3 bg-secondary rounded-lg">
                <FileArchive className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => { setFile(null); setSuccess(false) }}>✕</Button>
              </div>
            )}

            <div>
              <label className="text-sm font-medium mb-1 block">Description (optional)</label>
              <Input type="text" value={description} onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Photo backup June 2025" />
            </div>

            {uploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Uploading...</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} />
              </div>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button onClick={handleUpload} disabled={!file || uploading} className="w-full">
              {uploading ? "Uploading..." : "Upload Archive"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
