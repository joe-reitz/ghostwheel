"use client"

import { useEffect, useRef, useState } from 'react'
import { GoogleMap, useJsApiLoader, Polyline } from '@react-google-maps/api'

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
  powerData?: number[]
  ftp?: number
  isVirtualRide?: boolean // Flag for Zwift/virtual rides
  rideName?: string // Ride name to detect Zwift world
}

/**
 * Route Map Component with Google Maps
 * Displays Strava routes with optional power-based gradient coloring
 * Shows custom visualization for Zwift/virtual rides
 */
export function RouteMap({ polyline, activities, height = '400px', powerData, ftp, isVirtualRide = false, rideName = '' }: RouteMapProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: ['places'], // Specify libraries to avoid warnings
    version: 'weekly', // Use weekly version for latest features
  })

  const [map, setMap] = useState<google.maps.Map | null>(null)

  // Detect Zwift world from ride name
  const getZwiftWorld = (name: string): string | null => {
    const nameLower = name.toLowerCase()
    if (nameLower.includes('watopia')) return 'Watopia'
    if (nameLower.includes('london')) return 'London'
    if (nameLower.includes('new york')) return 'New York'
    if (nameLower.includes('innsbruck')) return 'Innsbruck'
    if (nameLower.includes('yorkshire')) return 'Yorkshire'
    if (nameLower.includes('richmond')) return 'Richmond'
    if (nameLower.includes('france')) return 'France'
    if (nameLower.includes('paris')) return 'Paris'
    if (nameLower.includes('makuri')) return 'Makuri Islands'
    if (nameLower.includes('scotland')) return 'Scotland'
    return null
  }

  // Show Zwift placeholder for ALL virtual rides (ignore any fake GPS data from Strava)
  if (isVirtualRide) {
    const zwiftWorld = getZwiftWorld(rideName)
    return (
      <div 
        className="bg-gradient-to-br from-blue-900 via-purple-900 to-blue-900 rounded-lg overflow-hidden relative flex items-center justify-center border-2 border-purple-500"
        style={{ height }}
      >
        <div className="text-center p-6">
          <div className="text-6xl mb-4">🎮</div>
          <h3 className="text-2xl font-bold text-white mb-2">Zwift Virtual Ride</h3>
          {zwiftWorld && (
            <p className="text-purple-300 text-lg mb-3">📍 {zwiftWorld}</p>
          )}
          <p className="text-gray-300 text-sm">
            Virtual ride in Zwift's digital world
          </p>
        </div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div 
        className="bg-gray-800 rounded-lg overflow-hidden relative flex items-center justify-center"
        style={{ height }}
      >
        <div className="text-center p-4">
          <div className="text-red-400 text-4xl mb-4">⚠️</div>
          <p className="text-red-300">Error loading Google Maps</p>
          <p className="text-gray-400 text-sm mt-2">
            Check your NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in .env.local
          </p>
        </div>
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div 
        className="bg-gray-800 rounded-lg overflow-hidden relative flex items-center justify-center"
        style={{ height }}
      >
        <div className="text-center">
          <div className="text-4xl mb-4">🗺️</div>
          <p className="text-gray-400">Loading map...</p>
        </div>
      </div>
    )
  }

  if (!polyline) {
    return (
      <div 
        className="bg-gray-800 rounded-lg overflow-hidden relative flex items-center justify-center"
        style={{ height }}
      >
        <div className="text-center">
          <div className="text-4xl mb-4">🗺️</div>
          <p className="text-gray-400">No route data available</p>
        </div>
      </div>
    )
  }

  const coordinates = decodePolyline(polyline)
  
  if (coordinates.length === 0) {
    return (
      <div 
        className="bg-gray-800 rounded-lg overflow-hidden relative flex items-center justify-center"
        style={{ height }}
      >
        <div className="text-center">
          <div className="text-4xl mb-4">🗺️</div>
          <p className="text-gray-400">Invalid route data</p>
        </div>
      </div>
    )
  }

  // Convert to Google Maps LatLng format
  const path = coordinates.map(coord => ({ lat: coord[0], lng: coord[1] }))
  
  // Calculate center point
  const center = path[Math.floor(path.length / 2)]

  const onLoad = (map: google.maps.Map) => {
    // Fit bounds to show entire route
    const bounds = new google.maps.LatLngBounds()
    path.forEach(point => bounds.extend(point))
    map.fitBounds(bounds)
    setMap(map)
  }

  const onUnmount = () => {
    setMap(null)
  }

  // Determine line color based on power data if available
  const getRouteColor = () => {
    if (powerData && powerData.length > 0 && ftp) {
      const avgPower = powerData.reduce((a, b) => a + b, 0) / powerData.length
      const intensity = avgPower / ftp
      
      if (intensity < 0.55) return '#3B82F6'  // Blue (Z1 - Recovery)
      if (intensity < 0.75) return '#10B981'  // Green (Z2 - Endurance)
      if (intensity < 0.90) return '#F59E0B'  // Orange (Z3 - Tempo)
      if (intensity < 1.05) return '#EF4444'  // Red (Z4 - Threshold)
      return '#DC2626'                        // Dark Red (Z5+ - VO2Max)
    }
    return '#8B5CF6' // Default purple
  }

  const mapContainerStyle = {
    width: '100%',
    height: height
  }

  const options: google.maps.MapOptions = {
    mapTypeId: 'terrain',
    disableDefaultUI: false,
    zoomControl: true,
    mapTypeControl: true,
    scaleControl: true,
    streetViewControl: false,
    fullscreenControl: true,
    styles: [
      {
        featureType: 'all',
        elementType: 'geometry',
        stylers: [{ color: '#242f3e' }]
      },
      {
        featureType: 'all',
        elementType: 'labels.text.stroke',
        stylers: [{ color: '#242f3e' }]
      },
      {
        featureType: 'all',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#746855' }]
      },
      {
        featureType: 'water',
        elementType: 'geometry',
        stylers: [{ color: '#17263c' }]
      }
    ]
  }

  const polylineOptions = {
    strokeColor: getRouteColor(),
    strokeOpacity: 0.9,
    strokeWeight: 4,
    geodesic: true
  }

  return (
    <div className="rounded-lg overflow-hidden">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={13}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={options}
      >
        <Polyline
          path={path}
          options={polylineOptions}
        />
      </GoogleMap>
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






