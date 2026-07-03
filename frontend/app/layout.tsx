import type { Metadata } from "next"
import "./globals.css"
import { AuthProvider } from "@/components/AuthProvider"
import { ThemeProvider } from "@/components/theme-provider"
import { ToastProvider } from "@/components/ToastProvider"

export const metadata: Metadata = {
  title: "Pathrama-Up — Cloud Backup Platform",
  description:
    "Secure cloud backup platform for storing and restoring your important files.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
          <AuthProvider>
            <ToastProvider>{children}</ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
