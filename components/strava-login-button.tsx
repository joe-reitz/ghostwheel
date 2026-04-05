"use client"

import { Button } from "@/components/ui/button"

export function StravaLoginButton({ className, variant }: { className?: string; variant?: "default" | "secondary" }) {
  return (
    <Button
      onClick={() => { window.location.href = "/api/auth/strava" }}
      className={className}
      variant={variant}
    >
      Connect Strava
    </Button>
  )
}

