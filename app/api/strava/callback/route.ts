import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get("code")
    const error = searchParams.get("error")

    if (error) {
      console.error("Error from Strava:", error)
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/?error=strava_auth`)
    }

    if (!code) {
      console.error("No code provided")
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/?error=no_code`)
    }

    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/strava/callback`

    const tokenResponse = await fetch("https://www.strava.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: process.env.STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      }),
    })

    const tokenData = await tokenResponse.json()

    if (!tokenResponse.ok) {
      console.error("Error exchanging code for token:", tokenData)
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/?error=token_exchange`)
    }

    // Redirect to the dashboard page with the access token
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?token=${tokenData.access_token}`)
  } catch (error) {
    console.error("Unexpected error in callback:", error)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/?error=unexpected`)
  }
}
