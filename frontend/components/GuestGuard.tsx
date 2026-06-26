"use client"

import { useEffect, useState } from "react"
import { getCurrentUser } from "aws-amplify/auth"
import { useRouter } from "next/navigation"

export function GuestGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    getCurrentUser()
      .then(() => router.push("/dashboard/archives"))
      .catch(() => setChecking(false))
  }, [router])

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return <>{children}</>
}
