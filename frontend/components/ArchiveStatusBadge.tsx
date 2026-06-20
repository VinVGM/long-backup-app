const colors: Record<string, string> = {
  uploading: "bg-yellow-100 text-yellow-800",
  stored: "bg-green-100 text-green-800",
  restoring: "bg-blue-100 text-blue-800",
  ready: "bg-purple-100 text-purple-800",
  expired: "bg-gray-100 text-gray-600",
}

export function ArchiveStatusBadge({ status }: { status: string }) {
  const cls = colors[status] || "bg-gray-100 text-gray-600"
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {status}
    </span>
  )
}
