"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { getCurrentUser } from "aws-amplify/auth"
import { useEffect, useState } from "react"

export default function LandingPage() {
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <header className="border-b bg-white">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <span className="text-xl font-bold text-blue-600">LongBackup</span>
          <div className="flex gap-3">
            <Link
              href="/auth/signin"
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              Sign In
            </Link>
            <Link
              href="/auth/signup"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-4 py-24 text-center">
        <h1 className="text-5xl font-bold tracking-tight text-gray-900 mb-6">
          Long-term backups for{" "}
          <span className="text-blue-600">pennies per GB</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10">
          Store your ZIP archives in Amazon S3 Glacier Deep Archive at
          ~$0.001/GB/month — 95% cheaper than Google Drive or Dropbox.
        </p>
        <Link
          href="/auth/signup"
          className="inline-block px-8 py-4 text-lg font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-lg"
        >
          Start Free — 1GB included
        </Link>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              title: "Upload ZIP",
              desc: "Pre-zip your files and upload them directly to your secure S3 bucket via a presigned URL.",
            },
            {
              title: "Auto-Archived",
              desc: "Your files automatically transition to S3 Glacier Deep Archive — the lowest-cost AWS storage tier.",
            },
            {
              title: "Restore on Demand",
              desc: "Request a restore and get an email when it's ready. Download within 48 hours.",
            },
          ].map((item) => (
            <div key={item.title} className="bg-white p-6 rounded-xl border shadow-sm">
              <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
              <p className="text-gray-600">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t bg-white py-8 text-center text-sm text-gray-500">
        &copy; {new Date().getFullYear()} LongBackup. All rights reserved.
      </footer>
    </div>
  )
}
