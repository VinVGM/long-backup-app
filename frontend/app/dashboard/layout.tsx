"use client"

import { AuthGuard } from "@/components/AuthGuard"
import { DashboardSidebar } from "@/components/DashboardSidebar"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen">
        <DashboardSidebar />
        <main className="flex-1 p-6 lg:p-8 overflow-auto">{children}</main>
      </div>
    </AuthGuard>
  )
}
