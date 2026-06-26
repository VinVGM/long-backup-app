"use client"

import { useState } from "react"
import { signUp } from "aws-amplify/auth"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { GuestGuard } from "@/components/GuestGuard"
import { HardDrive } from "lucide-react"

function SignUpForm() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) { setError("Passwords do not match"); return }
    setLoading(true)
    setError("")
    try {
      await signUp({ username: email, password, options: { userAttributes: { name: email.split("@")[0] } } })
      router.push("/auth/confirm")
    } catch (err: any) {
      setError(err?.message || "Sign up failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2"><HardDrive className="h-8 w-8 text-primary" /></div>
          <CardTitle>Create Account</CardTitle>
          <CardDescription>Start backing up your files</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <Input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>{loading ? "Signing up..." : "Sign Up"}</Button>
            <p className="text-center text-sm text-muted-foreground">Already have an account? <Link href="/auth/signin" className="text-primary hover:underline">Sign in</Link></p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default function SignUpPage() {
  return <GuestGuard><SignUpForm /></GuestGuard>
}
