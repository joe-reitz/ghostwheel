"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import Image from "next/image"

const routes = [
  {
    href: "/dashboard",
    label: "Dashboard",
  },
  {
    href: "/goals",
    label: "Goals",
  },
  {
    href: "/ai-assistant",
    label: "AI Assistant",
  },
]

export function MainNav() {
  const pathname = usePathname()

  return (
    <div className="flex items-center space-x-4 lg:space-x-6 pl-4 bg-purple-500">
      <Link href="/" className="flex items-center space-x-2 transition-opacity hover:opacity-80">
        <Image
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/DALL%C2%B7E%202025-01-19%2013.28.29%20-%20A%20minimalist%208-bit%20style%20logo%20for%20'GhostWheel,'%20featuring%20a%20pixelated%20ghost%20riding%20a%20bicycle%20wheel.%20The%20ghost%20has%20a%20simple%20blocky%20design%20with%20a%20rounde-XAhPTCyUMkh8tYcwY2085QPR9r4r9u.webp"
          alt="GhostWheel Logo"
          width={32}
          height={32}
        />
        <span className="hidden font-bold sm:inline-block">GhostWheel</span>
      </Link>
      <nav className="flex items-center space-x-4 lg:space-x-6">
        {routes.map((route) => (
          <Link
            key={route.href}
            href={route.href}
            className={`text-sm font-medium transition-colors hover:text-white ${
              pathname === route.href ? "text-white font-semibold" : "text-white/80 hover:text-white"
            }`}
          >
            <div className="relative">
              {route.label}
              {pathname === route.href && <span className="absolute inset-x-0 -bottom-px h-px bg-white"></span>}
            </div>
          </Link>
        ))}
      </nav>
    </div>
  )
}

