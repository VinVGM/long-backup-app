"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { getCurrentUserProfile, cancelSubscription, UserProfile } from "@/lib/api"
import { UsageBar } from "@/components/UsageBar"

const planLabels: Record<string, string> = {
  free: "Free (1 GB)",
  basic_100gb: "Basic (100 GB)",
  pro_500gb: "Pro (500 GB)",
  business_2tb: "Business (2 TB)",
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
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
    setShowCancelConfirm(false)
    setCancelling(true)
    try {
      await cancelSubscription()
      setCancelMsg("Plan cancelled. You are now on Free (1 GB).")
      loadProfile()
    } catch (err: any) {
      setCancelMsg("")
    } finally {
      setCancelling(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  const isFree = !profile || profile.plan === "free"
  const planLabel = planLabels[profile?.plan || "free"] || "Free (1 GB)"

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      {cancelMsg && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
          {cancelMsg}
        </div>
      )}

      <div className="bg-white rounded-xl border shadow-sm p-6 space-y-6">
        <div>
          <p className="text-sm text-gray-500">Account Email</p>
          <p className="font-medium">{profile?.email || "—"}</p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm text-gray-500">Plan</p>
            {isFree && (
              <Link
                href="/pricing"
                className="text-xs text-blue-600 hover:underline font-medium"
              >
                Upgrade
              </Link>
            )}
          </div>
          <p className="font-medium">{planLabel}</p>
        </div>

        <div>
          <p className="text-sm text-gray-500 mb-1">Storage Used</p>
          <UsageBar
            usedBytes={profile?.storageUsedBytes || 0}
            limitBytes={profile?.storageLimitBytes || 1073741824}
          />
        </div>

        {!isFree && (
          <div className="pt-2 border-t">
            <button
              onClick={() => setShowCancelConfirm(true)}
              disabled={cancelling}
              className="text-sm text-red-600 hover:underline"
            >
              {cancelling ? "Cancelling..." : "Cancel subscription"}
            </button>
          </div>
        )}
      </div>

      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm mx-4 shadow-xl">
            <h3 className="text-lg font-bold mb-2 text-red-600">Cancel Subscription</h3>
            <p className="text-sm text-gray-600 mb-4">
              You will be downgraded to the Free plan (1 GB storage limit). Your existing
              files will be preserved, but you won&apos;t be able to upload new files if
              you exceed the Free plan limit.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Keep Plan
              </button>
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Cancel Subscription
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
