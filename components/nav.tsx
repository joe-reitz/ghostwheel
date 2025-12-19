import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Settings } from "lucide-react"

export function Nav() {
  return (
    <nav className="w-full bg-[#A855F7] px-4 py-2">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <div className="flex items-center space-x-8">
          <Link href="/" className="flex items-center space-x-2">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-DgQN761Z1hnyFm5rUOy62i58wzfHCe.png"
              alt="GhostWheel"
              width={40}
              height={40}
              className="rounded-full"
            />
            <span className="text-xl font-bold text-white">GhostWheel</span>
          </Link>
          <div className="hidden space-x-6 md:flex">
            <Link href="/dashboard" className="text-white hover:text-white/80">
              Dashboard
            </Link>
            <Link href="/goals" className="text-white hover:text-white/80">
              Goals
            </Link>
            <Link href="/training" className="text-white hover:text-white/80">
              Training
            </Link>
            <Link href="/rides" className="text-white hover:text-white/80">
              Rides
            </Link>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <Link href="/settings" className="text-white hover:text-white/80" title="Settings">
            <Settings size={20} />
          </Link>
          <Button variant="secondary" className="bg-[#7B3FB5] text-white hover:bg-[#6A36A0]">
            Connect Strava
          </Button>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white">GW</div>
        </div>
      </div>
    </nav>
  )
}

