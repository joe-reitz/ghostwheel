import Link from "next/link"
import Image from "next/image"

export default function Home() {
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/strava/callback`
  const stravaAuthUrl = `https://www.strava.com/oauth/authorize?client_id=${process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=activity:read_all`

  return (
    <div className="container mx-auto flex flex-col items-center p-4 pt-20">
      <div className="mb-8 relative">
        <div className="w-32 h-32 relative">
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-BSnMsjYZgunb8LwLIhI9RvyP2NSWRI.png"
            alt="GhostWheel Logo"
            width={128}
            height={128}
            className="animate-float"
          />
        </div>
        <div className="absolute -inset-4 bg-purple-500/20 rounded-full blur-xl" />
      </div>

      <h1 className="text-4xl font-bold mb-4 text-center">
        <span className="text-white">Welcome to</span>{" "}
        <span className="bg-clip-text text-transparent bg-gradient-to-b from-purple-400 to-purple-600">GhostWheel</span>
      </h1>

      <p className="text-gray-400 mb-8 text-center max-w-md">
        Connect your Strava account to get AI-powered insights and analysis for your rides
      </p>

      <Link href={stravaAuthUrl} className="hover:opacity-90 transition-opacity">
        <Image
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/btn_strava_connectwith_orange@2x-JDIgT5R9OIQjdQCpLAPgkPrx7y3UUx.png"
          alt="Connect with Strava"
          width={195}
          height={48}
          priority
        />
      </Link>
    </div>
  )
}
