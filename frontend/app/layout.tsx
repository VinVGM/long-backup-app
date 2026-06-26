import type { Metadata } from "next"
import "./globals.css"
import { AuthProvider } from "@/components/AuthProvider"
import { ThemeProvider } from "@/components/theme-provider"

export const metadata: Metadata = {
  title: "LongBackup — Affordable Long-Term Cloud Backups",
  description:
    "Store your backups in S3 Glacier Deep Archive at 95% less cost than Google Drive or Dropbox.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
