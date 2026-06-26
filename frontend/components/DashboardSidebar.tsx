"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { signOut } from "aws-amplify/auth"
import { HardDrive, Upload, Archive, CreditCard, Settings, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/ThemeToggle"

const navItems = [
  { href: "/dashboard/upload", label: "Upload", icon: Upload },
  { href: "/dashboard/archives", label: "Archives", icon: Archive },
  { href: "/pricing", label: "Pricing", icon: CreditCard },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
]

export function DashboardSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    router.push("/")
  }

  return (
    <aside className="w-56 bg-card border-r border-border shrink-0 flex flex-col">
      <div className="p-4 border-b border-border">
        <Link href="/dashboard/archives" className="flex items-center gap-2 font-bold text-lg">
          <HardDrive className="h-5 w-5 text-primary" />
          <span>LongBackup</span>
        </Link>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const active = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="p-3 border-t border-border space-y-1">
        <div className="flex items-center justify-between px-3 py-2">
          <span className="text-xs text-muted-foreground">Theme</span>
          <ThemeToggle />
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
