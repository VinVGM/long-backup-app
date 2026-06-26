"use client"

import { useEffect, useState, useMemo, useRef } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { listArchives, batchRestore, Archive } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { useToast } from "@/components/ToastProvider"
import { ArchiveIcon, Upload, Search, ArrowUpDown } from "lucide-react"

const statusVariant: Record<string, "uploading" | "stored" | "restoring" | "ready" | "expired"> = {
  uploading: "uploading", stored: "stored", restoring: "restoring", ready: "ready", expired: "expired",
}

type SortField = "filename" | "sizeBytes" | "createdAt" | "status"
type SortDir = "asc" | "desc"

export default function ArchivesPage() {
  const [archives, setArchives] = useState<Archive[]>([])
  const [nextToken, setNextToken] = useState<string | undefined>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [restoring, setRestoring] = useState(false)
  const [restoreMsg, setRestoreMsg] = useState("")
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const searchTimer = useRef<NodeJS.Timeout>()

  const handleSearch = (value: string) => {
    setSearch(value)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => setDebouncedSearch(value), 300)
  }

  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [sortField, setSortField] = useState<SortField>("createdAt")
  const [sortDir, setSortDir] = useState<SortDir>("desc")
  const toast = useToast()

  const load = async (token?: string) => {
    setLoading(true)
    setError("")
    try {
      const res = await listArchives(20, token)
      if (token) setArchives((prev) => [...prev, ...res.archives])
      else setArchives(res.archives)
      setNextToken(res.nextToken)
    } catch (err: any) {
      setError(err?.message || "Failed to load archives")
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const isRestorable = (a: Archive) => a.status === "stored"

  const toggleSelect = (id: string) => {
    setSelected((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n })
  }

  const toggleAll = () => {
    const ids = archives.filter(isRestorable).map((a) => a.archiveId)
    if (ids.every((id) => selected.has(id))) setSelected(new Set())
    else setSelected(new Set(ids))
  }

  const handleBatchRestore = async () => {
    const ids = archives.filter((a) => selected.has(a.archiveId) && isRestorable(a)).map((a) => a.archiveId)
    setRestoring(true)
    setRestoreMsg("")
    setError("")
    try {
      const res = await batchRestore(ids)
      setRestoreMsg(`${res.succeeded} restore(s) initiated. ${res.failed} failed.`)
      toast.success("Batch restore", `${res.succeeded} restore(s) initiated`)
      if (res.failed > 0) toast.warning("Some restores failed", res.errors?.join(", "))
      setSelected(new Set())
      load()
    } catch (err: any) { setError(err?.message || "Batch restore failed"); toast.error("Batch restore failed", err?.message) }
    finally { setRestoring(false) }
  }

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    else { setSortField(field); setSortDir("asc") }
  }

  const filtered = useMemo(() => {
    let result = [...archives]
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase()
      result = result.filter((a) => a.filename.toLowerCase().includes(q))
    }
    if (filterStatus !== "all") result = result.filter((a) => a.status === filterStatus)
    result.sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1
      let cmp = 0
      if (sortField === "filename") cmp = a.filename.localeCompare(b.filename)
      else if (sortField === "sizeBytes") cmp = a.sizeBytes - b.sizeBytes
      else if (sortField === "createdAt") cmp = a.createdAt.localeCompare(b.createdAt)
      else cmp = a.status.localeCompare(b.status)
      return cmp * dir
    })
    return result
  }, [archives, debouncedSearch, filterStatus, sortField, sortDir])

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
    if (bytes < 1024 * 1024 * 1024) return (bytes / 1024 / 1024).toFixed(1) + " MB"
    return (bytes / 1024 / 1024 / 1024).toFixed(2) + " GB"
  }

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  })

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-30" />
    return <ArrowUpDown className={`h-3 w-3 ml-1 ${sortDir === "asc" ? "rotate-180" : ""}`} />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Archives</h1>
        <Link href="/dashboard/upload"><Button size="sm"><Upload className="mr-2 h-4 w-4" />Upload</Button></Link>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {restoreMsg && <p className="text-sm text-green-500">{restoreMsg}</p>}

      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by filename..." className="pl-9" value={search} onChange={(e) => handleSearch(e.target.value)} />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-36"><SelectValue placeholder="All statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="stored">Stored</SelectItem>
            <SelectItem value="restoring">Restoring</SelectItem>
            <SelectItem value="ready">Ready</SelectItem>
            <SelectItem value="uploading">Uploading</SelectItem>
          </SelectContent>
        </Select>
      </div>

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
                <div key={i} className="flex items-center gap-4"><Skeleton className="h-4 w-4" /><Skeleton className="h-4 w-40" /><Skeleton className="h-4 w-16" /><Skeleton className="h-5 w-20" /><Skeleton className="h-4 w-32" /></div>
              ))}
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <EmptyState
              icon={<ArchiveIcon className="h-16 w-16" />}
              title={debouncedSearch || filterStatus !== "all" ? "No matching archives" : "No archives yet"}
              description={debouncedSearch || filterStatus !== "all" ? "Try adjusting your search or filter." : "Upload your first ZIP archive to get started."}
              action={(!debouncedSearch && filterStatus === "all") ? <Link href="/dashboard/upload"><Button size="sm"><Upload className="mr-2 h-4 w-4" />Upload Archive</Button></Link> : undefined}
            />
          )}

          {filtered.length > 0 && (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/30 text-left">
                  <th className="px-4 py-3 w-10">
                    {archives.some(isRestorable) && <input type="checkbox" checked={archives.filter(isRestorable).every((a) => selected.has(a.archiveId))} onChange={toggleAll} className="rounded" />}
                  </th>
                  <th className="px-4 py-3 font-medium cursor-pointer select-none" onClick={() => toggleSort("filename")}>Name <SortIcon field="filename" /></th>
                  <th className="px-4 py-3 font-medium cursor-pointer select-none" onClick={() => toggleSort("sizeBytes")}>Size <SortIcon field="sizeBytes" /></th>
                  <th className="px-4 py-3 font-medium cursor-pointer select-none" onClick={() => toggleSort("status")}>Status <SortIcon field="status" /></th>
                  <th className="px-4 py-3 font-medium cursor-pointer select-none" onClick={() => toggleSort("createdAt")}>Uploaded <SortIcon field="createdAt" /></th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => (
                  <tr key={a.archiveId} className="border-b border-border last:border-0 hover:bg-accent/50">
                    <td className="px-4 py-3">
                      {isRestorable(a) ? <input type="checkbox" checked={selected.has(a.archiveId)} onChange={() => toggleSelect(a.archiveId)} className="rounded" /> : <span className="text-muted-foreground text-xs ml-1">—</span>}
                    </td>
                    <td className="px-4 py-3 font-medium truncate max-w-[200px]">{a.filename}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatSize(a.sizeBytes)}</td>
                    <td className="px-4 py-3"><Badge variant={statusVariant[a.status] || "secondary"}>{a.status}</Badge></td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(a.createdAt)}</td>
                    <td className="px-4 py-3 text-right"><Link href={`/dashboard/archives/${a.archiveId}`} className="text-primary hover:underline text-sm">Details</Link></td>
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
