"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Menu } from "lucide-react"
import Image from "next/image"

interface Route {
  href: string
  label: string
  icon: any
  color?: string
}

const routes: Route[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: () => null,
  },
  {
    href: "/goals",
    label: "Goals",
    icon: () => null,
  },
  {
    href: "/ai-assistant",
    label: "AI Assistant",
    icon: () => null,
  },
]

export function MobileNav() {
  const [open, setOpen] = React.useState(false)
  const pathname = usePathname()

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          className="mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden"
        >
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="pr-0">
        <div className="flex items-center">
          <Link href="/" className="flex items-center space-x-2" onClick={() => setOpen(false)}>
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/DALL%C2%B7E%202025-01-19%2013.28.29%20-%20A%20minimalist%208-bit%20style%20logo%20for%20'GhostWheel,'%20featuring%20a%20pixelated%20ghost%20riding%20a%20bicycle%20wheel.%20The%20ghost%20has%20a%20simple%20blocky%20design%20with%20a%20rounde-XAhPTCyUMkh8tYcwY2085QPR9r4r9u.webp"
              alt="GhostWheel Logo"
              width={32}
              height={32}
            />
            <span className="font-bold">GhostWheel</span>
          </Link>
        </div>
        <ScrollArea className="my-4 h-[calc(100vh-8rem)] pb-10">
          <div className="flex flex-col space-y-2">
            {routes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center text-sm font-medium",
                  pathname === route.href ? "text-foreground" : "text-foreground/60",
                )}
              >
                <Button variant="ghost" className="w-full justify-start">
                  <route.icon className={cn("mr-2 h-4 w-4", route.color)} />
                  {route.label}
                </Button>
              </Link>
            ))}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}

