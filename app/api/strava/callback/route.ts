async function stravaCallback(request: Request) {
  try {
    const url = new URL(request.url)
    const code = url.searchParams.get("code")

    if (!code) {
      return NextResponse.json({ error: "Missing code parameter" }, { status: 400 })
    }

    const response = await fetch("https://www.strava.com/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: process.env.STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        code,
      }),
    })

    if (!response.ok) {
      return NextResponse.json({ error: "Strava API request failed" }, { status: response.status })
    }

    const data = await response.json()

    // Store the access token in the session
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 401 })
    }

    session.stravaToken = data.access_token
    await updateSession(session)

    return NextResponse.redirect(new URL("/", request.url))
  } catch (error) {
    // Log the full error for debugging
    console.error("Strava callback error:", error)

    // Create error URL with message
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin
    const errorUrl = new URL("/error", baseUrl)
    errorUrl.searchParams.set("message", error instanceof Error ? error.message : "An unexpected error occurred")

    // Redirect to error page
    return NextResponse.redirect(errorUrl)
  }
}

