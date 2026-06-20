"use client"

import { useEffect, useState } from "react"
import { getCurrentUser, fetchAuthSession } from "aws-amplify/auth"

export default function SettingsPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCurrentUser()
      .then((user) => setEmail(user.username))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <div className="bg-white rounded-xl border shadow-sm p-6 space-y-4">
        <div>
          <p className="text-sm text-gray-500">Account Email</p>
          <p className="font-medium">{email}</p>
        </div>

        <div>
          <p className="text-sm text-gray-500">Plan</p>
          <p className="font-medium">Free (1GB)</p>
        </div>

        <div>
          <p className="text-sm text-gray-500 mb-1">Storage Used</p>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full" style={{ width: "0%" }} />
          </div>
          <p className="text-xs text-gray-500 mt-1">0 MB / 1 GB</p>
        </div>
      </div>
    </div>
  )
}
