import { NextResponse } from "next/server"
import { exchangeCodeForToken } from "@/lib/strava"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")

  if (!code) {
    return NextResponse.json({ error: "No code provided" }, { status: 400 })
  }

  try {
    const tokenData = await exchangeCodeForToken(code)
    // Here you would typically save the access token and refresh token to your database
    // For now, we'll just return them
    return NextResponse.json(tokenData)
  } catch (error) {
    console.error("Error exchanging code for token:", error)
    return NextResponse.json({ error: "Failed to exchange code for token" }, { status: 500 })
  }
}

