"use client"

import { useEffect, useRef, useState } from 'react'

interface RouteMapProps {
  polyline?: string
  activities?: Array<{
    id: number
    polyline: string
    name: string
    averageWatts?: number
    averageSpeed: number
  }>
  height?: string
}

/**
 * Route Map Component
 * 
 * Currently shows a placeholder. To implement:
 * 1. Add Mapbox or Leaflet
 * 2. Decode Strava polyline
 * 3. Display route with gradient based on power/speed/HR
 * 4. Add interactive features (hover, click)
 */
export function RouteMap({ polyline, activities, height = '400px' }: RouteMapProps) {
  const [mapReady, setMapReady] = useState(false)

  // TODO: Implement actual map
  // Option 1: Mapbox (requires API key)
  // Option 2: Leaflet + OpenStreetMap (free)
  // Option 3: Google Maps (requires API key)

  return (
    <div 
      className="bg-gray-800 rounded-lg overflow-hidden relative"
      style={{ height }}
    >
      {/* Placeholder */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🗺️</div>
          <h3 className="text-xl font-bold mb-2">Route Map</h3>
          <p className="text-gray-400 text-sm max-w-md px-4">
            Interactive route maps with performance overlays coming soon!
            <br />
            See docs/MAPS.md for implementation guide.
          </p>
        </div>
      </div>

      {/* Grid overlay for visual effect */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(rgba(139, 92, 246, 0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(139, 92, 246, 0.5) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}
      />
    </div>
  )
}

/**
 * Decode Strava polyline to lat/lng coordinates
 * Based on Google's polyline encoding algorithm
 */
export function decodePolyline(encoded: string): Array<[number, number]> {
  const points: Array<[number, number]> = []
  let index = 0
  let lat = 0
  let lng = 0

  while (index < encoded.length) {
    let b
    let shift = 0
    let result = 0
    
    do {
      b = encoded.charCodeAt(index++) - 63
      result |= (b & 0x1f) << shift
      shift += 5
    } while (b >= 0x20)
    
    const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1))
    lat += dlat

    shift = 0
    result = 0
    
    do {
      b = encoded.charCodeAt(index++) - 63
      result |= (b & 0x1f) << shift
      shift += 5
    } while (b >= 0x20)
    
    const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1))
    lng += dlng

    points.push([lat / 1e5, lng / 1e5])
  }

  return points
}






