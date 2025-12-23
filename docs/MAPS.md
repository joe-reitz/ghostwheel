# Interactive Route Maps Guide

This guide covers implementing interactive route maps with performance overlays.

## Overview

Route maps visualize your rides with:
- Route path on map
- Color gradient based on power/speed/HR
- Elevation profile overlay
- Interactive hover (show stats at that point)
- Heatmap of frequently ridden areas
- Segment highlights

## Option 1: Mapbox (Recommended)

**Pros:**
- Beautiful styling
- Excellent performance
- Built for cycling/fitness apps
- Great gradient support

**Cons:**
- Requires API key
- Paid after free tier (50k requests/month free)

### Setup

1. Get API key from https://www.mapbox.com/
2. Install packages:
```bash
npm install mapbox-gl @types/mapbox-gl
```

3. Add to `.env.local`:
```env
NEXT_PUBLIC_MAPBOX_TOKEN=your_token_here
```

4. Implement component:

```tsx
'use client'

import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { decodePolyline } from './route-map'

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

export function MapboxRoute({ polyline, powerData }: { 
  polyline: string
  powerData?: number[] 
}) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)

  useEffect(() => {
    if (!mapContainer.current) return

    const coordinates = decodePolyline(polyline)
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: coordinates[Math.floor(coordinates.length / 2)],
      zoom: 12
    })

    map.current.on('load', () => {
      // Add route line
      map.current!.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: coordinates.map(c => [c[1], c[0]]) // swap for lng,lat
          }
        }
      })

      // Add line with gradient (if power data available)
      map.current!.addLayer({
        id: 'route',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': powerData ? getPowerGradient(powerData) : '#8B5CF6',
          'line-width': 4
        }
      })

      // Fit bounds to route
      const bounds = coordinates.reduce(
        (bounds, coord) => bounds.extend(coord),
        new mapboxgl.LngLatBounds(coordinates[0], coordinates[0])
      )
      map.current!.fitBounds(bounds, { padding: 50 })
    })

    return () => map.current?.remove()
  }, [polyline])

  return <div ref={mapContainer} className="w-full h-full" />
}

function getPowerGradient(powerData: number[]) {
  // Create gradient expression based on power zones
  // Low power = blue, medium = yellow, high = red
  return [
    'interpolate',
    ['linear'],
    ['get', 'power'],
    0, '#3B82F6',    // Blue (recovery)
    150, '#10B981',  // Green (endurance)
    200, '#F59E0B',  // Orange (tempo)
    250, '#EF4444'   // Red (threshold+)
  ]
}
```

## Option 2: Leaflet (Free Alternative)

**Pros:**
- Completely free
- Open source
- Good community
- Works with OpenStreetMap

**Cons:**
- Less polished than Mapbox
- Manual gradient implementation
- Slower for large datasets

### Setup

1. Install packages:
```bash
npm install leaflet react-leaflet @types/leaflet --legacy-peer-deps
```

2. Implement component:

```tsx
'use client'

import { MapContainer, TileLayer, Polyline, useMap } from 'react-leaflet'
import { decodePolyline } from './route-map'
import 'leaflet/dist/leaflet.css'

export function LeafletRoute({ polyline }: { polyline: string }) {
  const coordinates = decodePolyline(polyline)

  return (
    <MapContainer
      center={coordinates[Math.floor(coordinates.length / 2)]}
      zoom={12}
      className="w-full h-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Polyline 
        positions={coordinates}
        pathOptions={{ color: '#8B5CF6', weight: 4 }}
      />
      <FitBounds coordinates={coordinates} />
    </MapContainer>
  )
}

function FitBounds({ coordinates }: { coordinates: [number, number][] }) {
  const map = useMap()
  useEffect(() => {
    map.fitBounds(coordinates)
  }, [coordinates, map])
  return null
}
```

## Option 3: Google Maps

**Pros:**
- Familiar interface
- Excellent coverage
- Good documentation

**Cons:**
- Requires API key and billing
- More expensive than Mapbox
- Heavier bundle size

### Setup

1. Get API key from Google Cloud Console
2. Install package:
```bash
npm install @vis.gl/react-google-maps
```

3. Use similar implementation to Mapbox

## Feature Implementations

### Power/Speed Gradient

Color the route based on performance:

```tsx
function getColorForPower(watts: number, ftp: number): string {
  const intensity = watts / ftp
  if (intensity < 0.55) return '#3B82F6'  // Blue (Z1)
  if (intensity < 0.75) return '#10B981'  // Green (Z2)
  if (intensity < 0.90) return '#F59E0B'  // Orange (Z3)
  if (intensity < 1.05) return '#EF4444'  // Red (Z4)
  return '#DC2626'                        // Dark red (Z5+)
}
```

### Elevation Profile Overlay

Show elevation alongside the map:

```tsx
<div className="relative">
  <RouteMap polyline={polyline} />
  <div className="absolute bottom-0 left-0 right-0 bg-black/80 p-4">
    <ElevationProfile data={elevationData} />
  </div>
</div>
```

### Interactive Hover

Show stats at cursor position:

```tsx
map.on('mousemove', 'route', (e) => {
  const coordinates = e.lngLat
  // Find nearest point in activity data
  const nearestPoint = findNearestPoint(coordinates, activityData)
  
  // Show popup with stats
  new mapboxgl.Popup()
    .setLngLat(coordinates)
    .setHTML(`
      <div>
        <strong>${nearestPoint.power}W</strong><br/>
        ${nearestPoint.speed} mph<br/>
        ${nearestPoint.hr} bpm
      </div>
    `)
    .addTo(map)
})
```

### Heatmap of Routes

Show frequently ridden areas:

```tsx
map.addLayer({
  id: 'heatmap',
  type: 'heatmap',
  source: 'activities',
  paint: {
    'heatmap-weight': 1,
    'heatmap-intensity': 1,
    'heatmap-color': [
      'interpolate',
      ['linear'],
      ['heatmap-density'],
      0, 'rgba(0, 0, 255, 0)',
      0.2, 'rgb(65, 105, 225)',
      0.4, 'rgb(0, 255, 255)',
      0.6, 'rgb(0, 255, 0)',
      0.8, 'rgb(255, 255, 0)',
      1, 'rgb(255, 0, 0)'
    ],
    'heatmap-radius': 20
  }
})
```

## Performance Optimization

### Simplify Polylines

For long rides, simplify the polyline:

```tsx
import { simplify } from '@turf/turf'

function simplifyRoute(coordinates: [number, number][], tolerance = 0.0001) {
  const line = {
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates
    }
  }
  const simplified = simplify(line, { tolerance })
  return simplified.geometry.coordinates
}
```

### Lazy Load Maps

Don't load map libraries until needed:

```tsx
const MapComponent = dynamic(() => import('./map-component'), {
  ssr: false,
  loading: () => <div>Loading map...</div>
})
```

### Cache Tiles

Use service workers to cache map tiles for offline viewing.

## Example: Complete Implementation

See `components/route-map-full-example.tsx` for a complete working implementation with:
- Route visualization
- Power gradient
- Elevation profile
- Interactive tooltips
- Multiple activity overlay
- Heatmap mode

## Testing

Test with various scenarios:
- Short rides (< 10 miles)
- Long rides (> 100 miles)
- Indoor Zwift rides (virtual coords)
- Activities without GPS (indoor trainer)

## Resources

- [Mapbox GL JS Docs](https://docs.mapbox.com/mapbox-gl-js/)
- [React Leaflet Docs](https://react-leaflet.js.org/)
- [Strava Polyline Format](https://developers.google.com/maps/documentation/utilities/polylinealgorithm)
- [Turf.js](https://turfjs.org/) - Geospatial analysis

---

**Note:** The `RouteMap` component in `components/route-map.tsx` is currently a placeholder. Implement one of the options above based on your needs!








