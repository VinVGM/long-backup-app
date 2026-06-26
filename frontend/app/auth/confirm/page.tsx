"use client"

import { useState } from "react"
import { confirmSignUp, resendSignUpCode } from "aws-amplify/auth"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { GuestGuard } from "@/components/GuestGuard"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { HardDrive } from "lucide-react"

function ConfirmForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get("email") || ""

  const [code, setCode] = useState("")
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      await confirmSignUp({ username: email, confirmationCode: code })
      router.push("/auth/signin")
    } catch (err: any) {
      setError(err?.message || "Confirmation failed")
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    try {
      await resendSignUpCode({ username: email })
      setMessage("Code resent!")
    } catch (err: any) {
      setError(err?.message || "Failed to resend code")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center mb-2">Confirm Email</h1>
        <p className="text-sm text-gray-600 text-center mb-8">
          Enter the code sent to <span className="font-medium">{email}</span>
        </p>

        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Confirmation Code</label>
            <input
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="123456"
            />
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}
          {message && <p className="text-green-600 text-sm">{message}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Confirming..." : "Confirm"}
          </button>
        </form>

        <div className="mt-4 text-center text-sm text-gray-600">
          <button onClick={handleResend} className="text-blue-600 hover:underline">
            Resend code
          </button>
          <span className="mx-2">·</span>
          <Link href="/auth/signin" className="text-blue-600 hover:underline">
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function ConfirmPage() {
  return <GuestGuard><ConfirmForm /></GuestGuard>
}
