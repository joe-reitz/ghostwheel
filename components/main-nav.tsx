"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Activity, BarChart2, Home, Settings, Trophy } from "lucide-react"
import Image from "next/image"

const routes = [
  {
    label: "Dashboard",
    icon: Home,
    href: "/dashboard",
    color: "text-sky-500",
  },
  {
    label: "Activities",
    icon: Activity,
    href: "/activities",
    color: "text-violet-500",
  },
  {
    label: "Analytics",
    icon: BarChart2,
    color: "text-pink-700",
    href: "/analytics",
  },
  {
    label: "Training",
    icon: Trophy,
    color: "text-orange-700",
    href: "/training",
  },
]

export function MainNav() {
  const pathname = usePathname()

  return (
    <div className="mr-4 hidden md:flex">
      <Link href="/" className="mr-6 flex items-center space-x-2">
        <Image
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/DALL%C2%B7E%202025-01-19%2013.28.29%20-%20A%20minimalist%208-bit%20style%20logo%20for%20'GhostWheel,'%20featuring%20a%20pixelated%20ghost%20riding%20a%20bicycle%20wheel.%20The%20ghost%20has%20a%20simple%20blocky%20design%20with%20a%20rounde-XAhPTCyUMkh8tYcwY2085QPR9r4r9u.webp"
          alt="GhostWheel Logo"
          width={32}
          height={32}
        />
        <span className="hidden font-bold sm:inline-block">GhostWheel</span>
      </Link>
      <nav className="flex items-center space-x-6 text-sm font-medium">
        {routes.map((route) => (
          <Link
            key={route.href}
            href={route.href}
            className={cn(
              "transition-colors hover:text-foreground/80",
              pathname === route.href ? "text-foreground" : "text-foreground/60",
            )}
          >
            <Button variant="ghost" className="w-full justify-start">
              <route.icon className={cn("mr-2 h-4 w-4", route.color)} />
              {route.label}
            </Button>
          </Link>
        ))}
      </nav>
    </div>
  )
}

