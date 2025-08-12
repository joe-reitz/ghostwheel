import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Suspense } from "react"
import "./globals.css"
import Image from "next/image"
import Link from "next/link"
import { Analytics } from "@vercel/analytics/react"
import { Loader2 } from "lucide-react"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "GhostWheel",
  description: "AI-powered cycling analysis",
  icons: {
    icon: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-BSnMsjYZgunb8LwLIhI9RvyP2NSWRI.png",
    shortcut: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-BSnMsjYZgunb8LwLIhI9RvyP2NSWRI.png",
  },
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-gradient flex flex-col`}>
        <nav className="border-b border-purple-500/20">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-BSnMsjYZgunb8LwLIhI9RvyP2NSWRI.png"
                alt="GhostWheel Logo"
                width={32}
                height={32}
              />
              <span className="font-bold text-xl text-white">GhostWheel</span>
            </Link>
          </div>
        </nav>
        <main className="flex-grow">
          <Suspense
            fallback={
              <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
              </div>
            }
          >
            {children}
          </Suspense>
        </main>
        <footer className="mt-auto py-2 border-t border-purple-500/20">
          <div className="container mx-auto px-4 text-center">
            <a
              href="https://www.strava.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gray-400 hover:text-[#FC4C02] transition-colors"
            >
              Powered by Strava
            </a>
          </div>
        </footer>
        <Analytics />
      </body>
    </html>
  )
}
