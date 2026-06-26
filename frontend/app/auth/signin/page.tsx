"use client"

import { useState } from "react"
import { signIn } from "aws-amplify/auth"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { GuestGuard } from "@/components/GuestGuard"
import { HardDrive } from "lucide-react"

function SignInForm() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      await signIn({ username: email, password })
      router.push("/dashboard/archives")
    } catch (err: any) {
      setError(err?.message || "Sign in failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <HardDrive className="h-8 w-8 text-primary" />
          </div>
          <CardTitle>Sign In</CardTitle>
          <CardDescription>Enter your email and password</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>{loading ? "Signing in..." : "Sign In"}</Button>
            <div className="text-center text-sm text-muted-foreground space-y-1">
              <p>Don&apos;t have an account? <Link href="/auth/signup" className="text-primary hover:underline">Sign up</Link></p>
              <Link href="/auth/forgot-password" className="text-primary hover:underline text-xs">Forgot password?</Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default function SignInPage() {
  return <GuestGuard><SignInForm /></GuestGuard>
}
