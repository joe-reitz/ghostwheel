import { NextResponse } from "next/server"
import { exchangeCodeForToken, getAthleteProfile } from "@/lib/strava"
import { createOrUpdateUser } from "@/lib/db"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")

  if (!code) {
    return NextResponse.redirect(new URL('/?error=no_code', request.url))
  }

  try {
    // Exchange code for tokens
    const tokenData = await exchangeCodeForToken(code)
    
    // Get athlete profile
    const athlete = await getAthleteProfile(tokenData.access_token)
    
    // Calculate token expiration
    const expiresAt = new Date(tokenData.expires_at * 1000)
    
    // Create or update user in database
    await createOrUpdateUser({
      stravaId: athlete.id,
      username: athlete.username,
      firstname: athlete.firstname,
      lastname: athlete.lastname,
      email: athlete.email,
      profilePicture: athlete.profile,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      tokenExpiresAt: expiresAt
    })
    
    // Redirect to dashboard
    return NextResponse.redirect(new URL('/dashboard', request.url))
  } catch (error) {
    console.error("Error in Strava callback:", error)
    return NextResponse.redirect(new URL('/?error=auth_failed', request.url))
  }
}

