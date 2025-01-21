import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    // Parse the incoming request URL
    const requestUrl = new URL(request.url)
    console.log("Incoming request URL:", requestUrl.toString())

    // Get the code from the URL parameters
    const code = requestUrl.searchParams.get("code")

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
      cache: "no-store",
      body: JSON.stringify({
        client_id: process.env.STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        code: code,
        grant_type: "authorization_code",
      }),
    })

    // Handle non-200 responses from Strava
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error("Strava token exchange failed:", errorText)
      throw new Error(`Strava API error: ${tokenResponse.status} ${errorText}`)
    }

    // Parse the token response
    const data = await tokenResponse.json()

    // Get the base URL for redirects
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || requestUrl.origin

    // Redirect to the dashboard with the access token
    const dashboardUrl = new URL("/dashboard", baseUrl)
    dashboardUrl.searchParams.set("access_token", data.access_token)

    console.log("Redirecting to dashboard:", dashboardUrl.toString())
    return NextResponse.redirect(dashboardUrl)
  } catch (error) {
    // Log the full error for debugging
    console.error("Strava callback error:", error)

    // Create error URL with message
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin
    const errorUrl = new URL("/error", baseUrl)
    errorUrl.searchParams.set("message", error.message || "An unexpected error occurred")

    // Redirect to error page
    return NextResponse.redirect(errorUrl)
  }
}

