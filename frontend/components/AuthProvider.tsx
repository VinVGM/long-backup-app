"use client"

import { useEffect, useState } from "react"
import { Hub } from "aws-amplify/utils"
import "@/lib/amplify"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const listener = Hub.listen("auth", () => {})
    setReady(true)
    return () => listener()
  }, [])

  if (!ready) return null
  return <>{children}</>
}
