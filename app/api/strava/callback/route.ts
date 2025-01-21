import { NextResponse } from "next/server"

// We need to explicitly export the HTTP methods we support
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    // Parse the incoming request URL
    const requestUrl = new URL(request.url)
    console.log("Incoming request URL:", requestUrl.toString())

    // Get the code and error from URL parameters
    const code = requestUrl.searchParams.get("code")
    const error = requestUrl.searchParams.get("error")

    if (error) {
      console.error("Error returned from Strava:", error)
      throw new Error(`Strava authorization error: ${error}`)
    }

    // Validate required environment variables
    if (!process.env.STRAVA_CLIENT_ID || !process.env.STRAVA_CLIENT_SECRET) {
      console.error("Missing required environment variables")
      throw new Error("Configuration error: Missing Strava credentials")
    }

    // Validate the authorization code
    if (!code) {
      console.error("No authorization code received from Strava")
      throw new Error("Missing authorization code")
    }

    // Exchange the authorization code for tokens
    const tokenResponse = await fetch("https://www.strava.com/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: process.env.STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        code: code,
        grant_type: "authorization_code",
      }),
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error("Strava token exchange failed:", errorText)
      throw new Error(`Strava API error: ${tokenResponse.status} ${errorText}`)
    }

    const data = await tokenResponse.json()
    console.log("Token exchange successful")

    // Get the base URL for redirects
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || requestUrl.origin
    const dashboardUrl = new URL("/dashboard", baseUrl)
    dashboardUrl.searchParams.set("access_token", data.access_token)

    console.log("Redirecting to dashboard:", dashboardUrl.toString())
    return NextResponse.redirect(dashboardUrl)
  } catch (error) {
    console.error("Strava callback error:", error)

    // Create error URL with message
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin
    const errorUrl = new URL("/error", baseUrl)
    errorUrl.searchParams.set("message", error instanceof Error ? error.message : "An unexpected error occurred")

    return NextResponse.redirect(errorUrl)
  }
}

