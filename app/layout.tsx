import { Inter } from "next/font/google"
import { cn } from "@/lib/utils"
import "./globals.css"
import { Header } from "@/components/header"
import { StravaProvider } from "@/lib/strava-context"
import { Toaster } from "@/components/ui/toaster"

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
      <body className={cn("min-h-screen bg-background font-sans antialiased", inter.className)}>
        <StravaProvider>
          <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">{children}</main>
          </div>
          <Toaster />
        </StravaProvider>
      </body>
    </html>
  )
}

