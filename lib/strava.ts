import { stringify } from "querystring"

const STRAVA_CLIENT_ID = process.env.STRAVA_CLIENT_ID
const STRAVA_CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET
const STRAVA_REDIRECT_URI = process.env.STRAVA_REDIRECT_URI

export function getStravaAuthUrl() {
  const params = stringify({
    client_id: STRAVA_CLIENT_ID,
    redirect_uri: STRAVA_REDIRECT_URI,
    response_type: "code",
    scope: "activity:read_all",
  })
  return `https://www.strava.com/oauth/authorize?${params}`
}

export async function exchangeCodeForToken(code: string) {
  const response = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: STRAVA_CLIENT_ID,
      client_secret: STRAVA_CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
    }),
  })
  return response.json()
}

export async function refreshStravaToken(refreshToken: string) {
  const response = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: STRAVA_CLIENT_ID,
      client_secret: STRAVA_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  })
  return response.json()
}

export async function getStravaActivities(accessToken: string, after?: number, perPage: number = 200) {
  const params = new URLSearchParams({
    per_page: perPage.toString(),
  })
  if (after) {
    params.append("after", after.toString())
  }
  const response = await fetch(`https://www.strava.com/api/v3/athlete/activities?${params}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
  if (!response.ok) {
    throw new Error(`Strava API error: ${response.statusText}`)
  }
  return response.json()
}

export async function getActivityById(accessToken: string, activityId: number) {
  const response = await fetch(`https://www.strava.com/api/v3/activities/${activityId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
  if (!response.ok) {
    throw new Error(`Strava API error: ${response.statusText}`)
  }
  return response.json()
}

export async function getActivityStreams(
  accessToken: string, 
  activityId: number,
  keys: string[] = ['time', 'distance', 'latlng', 'altitude', 'velocity_smooth', 'heartrate', 'cadence', 'watts', 'temp', 'moving', 'grade_smooth']
) {
  const keysParam = keys.join(',')
  const response = await fetch(
    `https://www.strava.com/api/v3/activities/${activityId}/streams?keys=${keysParam}&key_by_type=true`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )
  if (!response.ok) {
    throw new Error(`Strava API error: ${response.statusText}`)
  }
  return response.json()
}

export async function getAthleteProfile(accessToken: string) {
  const response = await fetch('https://www.strava.com/api/v3/athlete', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
  if (!response.ok) {
    throw new Error(`Strava API error: ${response.statusText}`)
  }
  return response.json()
}

