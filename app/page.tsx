import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Nav } from "@/components/nav"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-dark">
      <Nav />
      <main className="mx-auto max-w-7xl px-4 py-16 text-center">
        <div className="mb-8">
          <div className="float inline-block">
            <Image
              src="/images/logo.png"
              alt="GhostWheel Logo"
              width={100}
              height={100}
              className="mx-auto"
            />
          </div>
        </div>
        <h1 className="mb-4 text-6xl font-bold">
          <span className="text-[#A855F7]">Ghost</span>
          <span className="text-white">Wheel</span>
        </h1>
        <p className="mx-auto mb-12 max-w-2xl text-lg text-gray-400">
          Train smarter, ride faster. GhostWheel combines AI coaching with detailed analytics to help you achieve your
          cycling goals.
        </p>
        <div className="mb-20 flex justify-center">
          <a href="/api/auth/strava">
            <Button className="bg-[#FC4C02] hover:bg-[#FC4C02]/90 text-white flex items-center gap-2">
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
                <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h3.066" />
              </svg>
              Connect Strava
            </Button>
          </a>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          <div className="rounded-lg p-6">
            <h2 className="mb-4 text-2xl font-bold text-white">Set Personal Goals</h2>
            <p className="text-gray-400">
              Choose from a library of common cycling goals that adapt with your progress.
            </p>
          </div>
          <div className="rounded-lg p-6">
            <h2 className="mb-4 text-2xl font-bold text-white">Smart Training Plans</h2>
            <p className="text-gray-400">AI-powered training plans that adapt to your progress and goals.</p>
          </div>
          <div className="rounded-lg p-6">
            <h2 className="mb-4 text-2xl font-bold text-white">Detailed Analytics</h2>
            <p className="text-gray-400">Track your progress with comprehensive ride analytics and insights.</p>
          </div>
        </div>
      </main>
    </div>
  )
}

