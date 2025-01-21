import { Inter } from "next/font/google"
import { cn } from "@/lib/utils"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "GhostWheel - AI-Powered Cycling Training",
  description: "Personalized cycling analytics and AI-powered training plans",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn("min-h-screen bg-[#252525] font-sans antialiased", inter.className)}>{children}</body>
    </html>
  )
}

