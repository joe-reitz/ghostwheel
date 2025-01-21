import { StravaConnect } from "@/components/strava-connect"
import { Button } from "@/components/ui/button"
import Image from "next/image"

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#252525]">
      <main className="container flex flex-col items-center justify-center gap-12 px-4 py-16 ">
        <Image
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ghostwheel-l0Nse7yvXXvH79M89xVZ52vdAeD9dU.jpeg"
          alt="GhostWheel Logo"
          width={120}
          height={120}
          className="mb-4"
          priority
        />
        <h1 className="text-5xl font-extrabold tracking-tight text-foreground sm:text-[5rem]">
          Ghost<span className="text-primary">Wheel</span>
        </h1>
        <p className="text-2xl text-muted-foreground">
          Connect your data and get personalized advice to reach your cycling goals
        </p>
        <div className="flex flex-col gap-4">
          <StravaConnect />
          <Button variant="outline">Connect Hammerhead Karoo</Button>
        </div>
      </main>
    </div>
  )
}

