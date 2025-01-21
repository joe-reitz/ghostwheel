import { StravaDataDisplay } from "@/components/strava-data-display"
import { LastRide } from "@/components/last-ride"

export default function Page() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">Your Cycling Dashboard</h1>
      <div className="grid gap-6">
        <LastRide />
        <StravaDataDisplay />
      </div>
    </div>
  )
}

