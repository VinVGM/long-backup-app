"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { signOut } from "aws-amplify/auth"

const navItems = [
  { href: "/dashboard/upload", label: "Upload" },
  { href: "/dashboard/archives", label: "Archives" },
  { href: "/pricing", label: "Pricing" },
  { href: "/dashboard/settings", label: "Settings" },
]

export function DashboardSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    router.push("/")
  }

  return (
    <aside className="w-56 bg-white border-r shrink-0 flex flex-col">
      <div className="p-4 border-b">
        <Link href="/dashboard/archives" className="text-lg font-bold text-blue-600">
          LongBackup
        </Link>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const active = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-3 py-2 rounded-lg text-sm font-medium ${
                active
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="p-3 border-t">
        <button
          onClick={handleSignOut}
          className="w-full px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg text-left"
        >
          Sign Out
        </button>
      </div>
    </aside>
  )
}
