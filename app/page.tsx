import { StravaConnect } from "@/components/strava-connect"
import { Button } from "@/components/ui/button"
import Image from "next/image"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#252525] via-[#252525] to-black text-white">
      <div className="container mx-auto px-4 py-16">
        <header className="mb-16 text-center">
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ghostwheel-l0Nse7yvXXvH79M89xVZ52vdAeD9dU.jpeg"
            alt="GhostWheel Logo"
            width={150}
            height={150}
            className="mx-auto mb-8"
            priority
          />
          <h1 className="mb-4 text-5xl font-extrabold tracking-tight sm:text-6xl md:text-7xl">
            Ghost<span className="text-purple-500">Wheel</span>
          </h1>
          <p className="mx-auto max-w-2xl text-xl text-gray-300 sm:text-2xl">
            Elevate your cycling performance with AI-powered insights and personalized training plans
          </p>
        </header>

        <main className="mb-16">
          <div className="mx-auto max-w-md space-y-8 rounded-lg bg-gray-800/80 p-8 shadow-lg backdrop-blur-sm">
            <div className="text-center">
              <h2 className="mb-2 text-2xl font-semibold">Get Started</h2>
              <p className="text-gray-300">Connect your accounts to unlock personalized cycling advice</p>
            </div>
            <div className="space-y-4">
              <StravaConnect />
              <Button className="w-full bg-gray-700 hover:bg-gray-600">Connect Hammerhead Karoo</Button>
            </div>
          </div>
        </main>

        <footer className="text-center text-sm text-gray-400">
          <p>&copy; 2025 GhostWheel. All rights reserved.</p>
        </footer>
      </div>
    </div>
  )
}

