"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { getCurrentUserProfile, cancelSubscription, UserProfile } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"

const planLabels: Record<string, string> = {
  free: "Free (1 GB)",
  basic_100gb: "Basic (100 GB)",
  pro_500gb: "Pro (500 GB)",
  business_2tb: "Business (2 TB)",
}

const planColors: Record<string, string> = {
  free: "secondary",
  basic_100gb: "default",
  pro_500gb: "default",
  business_2tb: "default",
} as const

export default function SettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)
  const [cancelMsg, setCancelMsg] = useState("")

  const loadProfile = () => {
    getCurrentUserProfile().then(setProfile).catch(() => {})
  }

  useEffect(() => {
    loadProfile()
    setLoading(false)
  }, [])

  const handleCancel = async () => {
    setCancelling(true)
    try {
      await cancelSubscription()
      setCancelMsg("Plan cancelled. You are now on Free (1 GB).")
      loadProfile()
    } catch {
      setCancelMsg("")
    } finally {
      setCancelling(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  const isFree = !profile || profile.plan === "free"
  const planLabel = planLabels[profile?.plan || "free"] || "Free (1 GB)"
  const planColor = (planColors[profile?.plan || "free"] || "secondary") as "default" | "secondary"
  const usedBytes = profile?.storageUsedBytes || 0
  const limitBytes = profile?.storageLimitBytes || 1073741824
  const percent = limitBytes > 0 ? Math.min(Math.round((usedBytes / limitBytes) * 100), 100) : 0

  const formatBytes = (bytes: number) => {
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
    if (bytes < 1024 * 1024 * 1024) return (bytes / 1024 / 1024).toFixed(1) + " MB"
    return (bytes / 1024 / 1024 / 1024).toFixed(2) + " GB"
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      {cancelMsg && (
        <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-sm text-green-500">
          {cancelMsg}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Your account details and plan</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="font-medium">{profile?.email || "—"}</p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm text-muted-foreground">Plan</p>
              {isFree && (
                <Link href="/pricing">
                  <Button variant="link" size="sm" className="h-auto p-0 text-xs">Upgrade</Button>
                </Link>
              )}
            </div>
            <Badge variant={planColor}>{planLabel}</Badge>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-2">Storage Used</p>
            <Progress value={percent} className="h-2.5" />
            <p className="text-xs text-muted-foreground mt-1">
              {formatBytes(usedBytes)} / {formatBytes(limitBytes)} ({percent}%)
            </p>
          </div>
        </CardContent>
      </Card>

      {!isFree && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
              Cancel subscription
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancel Subscription</AlertDialogTitle>
              <AlertDialogDescription>
                You will be downgraded to the Free plan (1 GB storage limit). Your existing
                files will be preserved, but you won&apos;t be able to upload new files if
                you exceed the Free plan limit.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep Plan</AlertDialogCancel>
              <AlertDialogAction onClick={handleCancel} disabled={cancelling} className="bg-destructive hover:bg-destructive/90">
                {cancelling ? "Cancelling..." : "Cancel Subscription"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  )
}
