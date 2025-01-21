"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface StravaContextType {
  accessToken: string | null
  setAccessToken: (token: string | null) => void
}

const StravaContext = createContext<StravaContextType>({
  accessToken: null,
  setAccessToken: () => {},
})

export function StravaProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null)

  useEffect(() => {
    // Check for token in localStorage on mount
    const storedToken = localStorage.getItem("strava_access_token")
    if (storedToken) {
      setAccessToken(storedToken)
    }
  }, [])

  const updateAccessToken = (token: string | null) => {
    console.log("Updating access token:", token)
    setAccessToken(token)
    if (token) {
      localStorage.setItem("strava_access_token", token)
    } else {
      localStorage.removeItem("strava_access_token")
    }
  }

  return (
    <StravaContext.Provider value={{ accessToken, setAccessToken: updateAccessToken }}>
      {children}
    </StravaContext.Provider>
  )
}

export function useStrava() {
  const context = useContext(StravaContext)
  if (context === undefined) {
    throw new Error("useStrava must be used within a StravaProvider")
  }
  return context
}

