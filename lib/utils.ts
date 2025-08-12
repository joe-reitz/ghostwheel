import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  return `${hours}h ${minutes}m`
}

export function metersToKilometers(meters: number): number {
  return meters / 1000
}

export function mpsToKph(mps: number): number {
  return mps * 3.6
}

export function metersToMiles(meters: number): number {
  return meters * 0.000621371
}
