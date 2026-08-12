import type React from "react"
import type { Metadata, Viewport } from "next"
import Providers from "./providers"
import { kantumruy } from "@/lib/font-config"
import RegisterSW from "./register-sw"
import "./globals.css"

export const metadata: Metadata = {
  title: "RMS SYSTEM",
  description: "This is RMS System",
  icons: {
    icon: "/icons/icon-192x192.png",
    shortcut: "/icons/icon-192x192.png",
    apple: "/icons/icon-192x192.png",
  },
}

export const viewport: Viewport = {
  themeColor: "#000000",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={kantumruy.variable} suppressHydrationWarning>
      <body className={kantumruy.className}>
        <RegisterSW />
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}