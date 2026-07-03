"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"
import { signOut } from "aws-amplify/auth"
import { HardDrive, Upload, Archive, CreditCard, Settings, LogOut, Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/ThemeToggle"
import { motion, AnimatePresence } from "framer-motion"

const navItems = [
  { href: "/dashboard/upload", label: "Upload", icon: Upload },
  { href: "/dashboard/archives", label: "Archives", icon: Archive },
  { href: "/pricing", label: "Pricing", icon: CreditCard },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
]

export function DashboardSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    router.push("/")
  }

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-card border border-border shadow-sm"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 bg-card border-r border-border shrink-0 flex-col">
        <SidebarContent pathname={pathname} handleSignOut={handleSignOut} />
      </aside>

      {/* Mobile overlay sidebar */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 md:hidden"
              onClick={() => setOpen(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed top-0 left-0 bottom-0 w-64 bg-card border-r border-border z-50 flex flex-col md:hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-border">
                <Link href="/dashboard/archives" className="flex items-center gap-2 font-bold text-lg">
                  <HardDrive className="h-5 w-5 text-primary" />
                  <span>Pathrama-Up</span>
                </Link>
                <button onClick={() => setOpen(false)}><X className="h-5 w-5" /></button>
              </div>
              <SidebarContent pathname={pathname} handleSignOut={handleSignOut} onClick={() => setOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

function SidebarContent({
  pathname,
  handleSignOut,
  onClick,
}: {
  pathname: string
  handleSignOut: () => void
  onClick?: () => void
}) {
  return (
    <>
      <div className="hidden md:block p-4 border-b border-border">
        <Link href="/dashboard/archives" className="flex items-center gap-2 font-bold text-lg">
          <HardDrive className="h-5 w-5 text-primary" />
          <span>Pathrama-Up</span>
        </Link>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const active = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClick}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
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
    </>
  )
}
