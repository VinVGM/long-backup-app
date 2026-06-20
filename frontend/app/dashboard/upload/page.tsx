"use client"

import { useState, useRef } from "react"
import { requestUploadUrl, uploadToS3 } from "@/lib/api"

export default function UploadPage() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [description, setDescription] = useState("")
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const selected = file ? (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
      <span className="text-lg">📦</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{file.name}</p>
        <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
      </div>
      <button
        onClick={() => { setFile(null); setSuccess(false) }}
        className="text-gray-400 hover:text-gray-600"
      >
        ✕
      </button>
    </div>
  ) : null

  const handleUpload = async () => {
    if (!file) return
    setError("")
    setSuccess(false)
    setUploading(true)
    setProgress(0)

    try {
      const { presignedUrl } = await requestUploadUrl(
        file.name,
        file.size,
        description || undefined
      )
      await uploadToS3(presignedUrl, file, setProgress)
      setSuccess(true)
      setFile(null)
      setDescription("")
      if (fileInputRef.current) fileInputRef.current.value = ""
    } catch (err: any) {
      setError(err?.message || "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6">Upload Archive</h1>

      <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            const f = e.dataTransfer.files?.[0]
            if (f) setFile(f)
          }}
          className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".zip,.tar,.gz,.tar.gz,.7z,.rar"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) setFile(f)
            }}
          />
          <p className="text-gray-500 text-sm">
            {file ? "Tap to change file" : "Drop a ZIP archive here or click to browse"}
          </p>
        </div>

        {selected}

        <div>
          <label className="block text-sm font-medium mb-1">Description (optional)</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. Photo backup June 2025"
          />
        </div>

        {uploading && (
          <div>
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Uploading...</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {error && <p className="text-red-600 text-sm">{error}</p>}
        {success && <p className="text-green-600 text-sm">Upload complete! It will be archived to Deep Archive within 24 hours.</p>}

        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {uploading ? "Uploading..." : "Upload Archive"}
        </button>
      </div>
    </div>
  )
}
