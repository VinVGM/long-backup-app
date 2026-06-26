"use client"

export function UsageBar({ usedBytes, limitBytes }: { usedBytes: number; limitBytes: number }) {
  const percent = limitBytes > 0 ? Math.min(Math.round((usedBytes / limitBytes) * 100), 100) : 0

  const formatBytes = (bytes: number) => {
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
    if (bytes < 1024 * 1024 * 1024) return (bytes / 1024 / 1024).toFixed(1) + " MB"
    return (bytes / 1024 / 1024 / 1024).toFixed(2) + " GB"
  }

  const barColor = percent > 90 ? "bg-red-500" : percent > 75 ? "bg-yellow-500" : "bg-blue-600"

  return (
    <div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className={`${barColor} h-2.5 rounded-full transition-all`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="text-xs text-gray-500 mt-1">
        {formatBytes(usedBytes)} / {formatBytes(limitBytes)} ({percent}%)
      </p>
    </div>
  )
}
