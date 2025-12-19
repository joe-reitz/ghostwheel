"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Nav } from "@/components/nav"
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts'
import { Calendar, MapPin, TrendingUp, Zap, Heart, Activity, Clock, Mountain } from "lucide-react"

interface RideDetails {
  id: number
  name: string
  start_date: string
  distance: number
  moving_time: number
  elapsed_time: number
  total_elevation_gain: number
  average_speed: number
  max_speed: number
  average_watts?: number
  max_watts?: number
  weighted_power?: number
  average_heartrate?: number
  max_heartrate?: number
  average_cadence?: number
  tss?: number
  intensity_factor?: number
  variability_index?: number
  kilojoules?: number
  stream_data?: any
  ai_analysis?: string
  ai_feedback?: string
  summary_polyline?: string
}

export default function RideAnalysisPage() {
  const params = useParams()
  const rideId = params?.id

  const [ride, setRide] = useState<RideDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)

  useEffect(() => {
    if (rideId) {
      fetchRideDetails()
    }
  }, [rideId])

  async function fetchRideDetails() {
    try {
      // TODO: Implement ride details API endpoint
      // const response = await fetch(`/api/rides/${rideId}`)
      // const data = await response.json()
      // setRide(data)
      
      // Mock data for now
      setRide({
        id: Number(rideId),
        name: "Morning Ride",
        start_date: new Date().toISOString(),
        distance: 50000,
        moving_time: 7200,
        elapsed_time: 7800,
        total_elevation_gain: 500,
        average_speed: 6.94,
        max_speed: 12.5,
        average_watts: 220,
        max_watts: 450,
        weighted_power: 235,
        average_heartrate: 145,
        max_heartrate: 175,
        average_cadence: 85,
        tss: 125,
        intensity_factor: 0.78,
        variability_index: 1.07,
        kilojoules: 1584
      })
    } catch (error) {
      console.error('Error fetching ride:', error)
    } finally {
      setLoading(false)
    }
  }

  async function analyzeRide() {
    setAnalyzing(true)
    try {
      // TODO: Call AI analysis endpoint
      // const response = await fetch(`/api/rides/${rideId}/analyze`, { method: 'POST' })
      // const data = await response.json()
      // setRide({...ride, ...data})
    } catch (error) {
      console.error('Error analyzing ride:', error)
    } finally {
      setAnalyzing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-dark">
        <Nav />
        <main className="mx-auto max-w-7xl px-4 py-8">
          <div className="flex items-center justify-center h-96">
            <div className="text-white text-xl">Loading ride details...</div>
          </div>
        </main>
      </div>
    )
  }

  if (!ride) {
    return (
      <div className="min-h-screen bg-gradient-dark">
        <Nav />
        <main className="mx-auto max-w-7xl px-4 py-8">
          <div className="text-center text-white">Ride not found</div>
        </main>
      </div>
    )
  }

  const distanceMiles = (ride.distance * 0.000621371).toFixed(1)
  const avgSpeedMph = (ride.average_speed * 2.23694).toFixed(1)
  const maxSpeedMph = (ride.max_speed * 2.23694).toFixed(1)
  const durationHours = Math.floor(ride.moving_time / 3600)
  const durationMinutes = Math.floor((ride.moving_time % 3600) / 60)

  // Mock stream data for visualization
  const mockStreamData = Array.from({ length: 120 }, (_, i) => ({
    time: i,
    power: 150 + Math.sin(i / 10) * 50 + Math.random() * 40,
    hr: 130 + Math.sin(i / 15) * 20 + Math.random() * 15,
    speed: 20 + Math.sin(i / 20) * 5 + Math.random() * 3,
    cadence: 80 + Math.sin(i / 12) * 10 + Math.random() * 10,
    elevation: 100 + Math.sin(i / 30) * 150
  }))

  return (
    <div className="min-h-screen bg-gradient-dark text-white">
      <Nav />
      
      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-gray-400 mb-2">
            <Calendar size={16} />
            <span>{new Date(ride.start_date).toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric',
              month: 'long', 
              day: 'numeric' 
            })}</span>
          </div>
          <h1 className="text-4xl font-bold mb-2">{ride.name}</h1>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-8">
          <div className="bg-gradient-to-br from-purple-500/20 to-purple-700/20 border border-purple-500/30 rounded-xl p-4">
            <Activity className="text-purple-400 mb-2" size={20} />
            <div className="text-2xl font-bold">{distanceMiles}</div>
            <div className="text-sm text-gray-400">miles</div>
          </div>

          <div className="bg-gradient-to-br from-blue-500/20 to-blue-700/20 border border-blue-500/30 rounded-xl p-4">
            <Clock className="text-blue-400 mb-2" size={20} />
            <div className="text-2xl font-bold">{durationHours}:{durationMinutes.toString().padStart(2, '0')}</div>
            <div className="text-sm text-gray-400">time</div>
          </div>

          <div className="bg-gradient-to-br from-green-500/20 to-green-700/20 border border-green-500/30 rounded-xl p-4">
            <TrendingUp className="text-green-400 mb-2" size={20} />
            <div className="text-2xl font-bold">{avgSpeedMph}</div>
            <div className="text-sm text-gray-400">mph avg</div>
          </div>

          <div className="bg-gradient-to-br from-gray-500/20 to-gray-700/20 border border-gray-500/30 rounded-xl p-4">
            <Mountain className="text-gray-400 mb-2" size={20} />
            <div className="text-2xl font-bold">{ride.total_elevation_gain}</div>
            <div className="text-sm text-gray-400">m elev</div>
          </div>

          {ride.average_watts && (
            <div className="bg-gradient-to-br from-orange-500/20 to-orange-700/20 border border-orange-500/30 rounded-xl p-4">
              <Zap className="text-orange-400 mb-2" size={20} />
              <div className="text-2xl font-bold">{ride.average_watts}</div>
              <div className="text-sm text-gray-400">watts avg</div>
            </div>
          )}

          {ride.weighted_power && (
            <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-700/20 border border-yellow-500/30 rounded-xl p-4">
              <Zap className="text-yellow-400 mb-2" size={20} />
              <div className="text-2xl font-bold">{ride.weighted_power.toFixed(0)}</div>
              <div className="text-sm text-gray-400">NP</div>
            </div>
          )}

          {ride.average_heartrate && (
            <div className="bg-gradient-to-br from-red-500/20 to-red-700/20 border border-red-500/30 rounded-xl p-4">
              <Heart className="text-red-400 mb-2" size={20} />
              <div className="text-2xl font-bold">{ride.average_heartrate.toFixed(0)}</div>
              <div className="text-sm text-gray-400">bpm avg</div>
            </div>
          )}

          {ride.tss && (
            <div className="bg-gradient-to-br from-pink-500/20 to-pink-700/20 border border-pink-500/30 rounded-xl p-4">
              <Activity className="text-pink-400 mb-2" size={20} />
              <div className="text-2xl font-bold">{ride.tss.toFixed(0)}</div>
              <div className="text-sm text-gray-400">TSS</div>
            </div>
          )}
        </div>

        {/* AI Analysis */}
        {ride.ai_analysis ? (
          <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-6 mb-8">
            <div className="flex items-start gap-4">
              <div className="text-4xl">🤖</div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-4">AI Coach Analysis</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-purple-300 mb-2">Analysis</h3>
                    <p className="text-gray-300">{ride.ai_analysis}</p>
                  </div>
                  {ride.ai_feedback && (
                    <div>
                      <h3 className="font-semibold text-purple-300 mb-2">Feedback</h3>
                      <p className="text-gray-300">{ride.ai_feedback}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 text-center mb-8">
            <p className="text-gray-400 mb-4">Get AI-powered insights on this ride</p>
            <button
              onClick={analyzeRide}
              disabled={analyzing}
              className="bg-purple-600 hover:bg-purple-700 px-6 py-2 rounded-lg disabled:opacity-50"
            >
              {analyzing ? 'Analyzing...' : 'Analyze with AI'}
            </button>
          </div>
        )}

        {/* Power & HR Chart */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 backdrop-blur mb-8">
          <h3 className="text-xl font-bold mb-4">Power & Heart Rate Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={mockStreamData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="time" 
                stroke="#9CA3AF"
                label={{ value: 'Time (minutes)', position: 'insideBottom', offset: -5 }}
              />
              <YAxis yAxisId="left" stroke="#F59E0B" label={{ value: 'Power (W)', angle: -90, position: 'insideLeft' }} />
              <YAxis yAxisId="right" orientation="right" stroke="#EF4444" label={{ value: 'HR (bpm)', angle: 90, position: 'insideRight' }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                labelStyle={{ color: '#F3F4F6' }}
              />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="power" stroke="#F59E0B" strokeWidth={2} dot={false} name="Power (W)" />
              <Line yAxisId="right" type="monotone" dataKey="hr" stroke="#EF4444" strokeWidth={2} dot={false} name="Heart Rate (bpm)" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Elevation Profile */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 backdrop-blur mb-8">
          <h3 className="text-xl font-bold mb-4">Elevation Profile</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={mockStreamData}>
              <defs>
                <linearGradient id="colorElevation" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="time" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" label={{ value: 'Elevation (m)', angle: -90, position: 'insideLeft' }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                labelStyle={{ color: '#F3F4F6' }}
              />
              <Area type="monotone" dataKey="elevation" stroke="#10B981" fillOpacity={1} fill="url(#colorElevation)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Speed & Cadence */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 backdrop-blur mb-8">
          <h3 className="text-xl font-bold mb-4">Speed & Cadence</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={mockStreamData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="time" stroke="#9CA3AF" />
              <YAxis yAxisId="left" stroke="#3B82F6" />
              <YAxis yAxisId="right" orientation="right" stroke="#A78BFA" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                labelStyle={{ color: '#F3F4F6' }}
              />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="speed" stroke="#3B82F6" strokeWidth={2} dot={false} name="Speed (km/h)" />
              <Line yAxisId="right" type="monotone" dataKey="cadence" stroke="#A78BFA" strokeWidth={2} dot={false} name="Cadence (rpm)" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Advanced Metrics */}
        {ride.intensity_factor && (
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 backdrop-blur">
            <h3 className="text-xl font-bold mb-4">Advanced Metrics</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="text-sm text-gray-400 mb-1">Intensity Factor (IF)</div>
                <div className="text-3xl font-bold">{ride.intensity_factor.toFixed(2)}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {ride.intensity_factor < 0.75 ? 'Easy recovery' : 
                   ride.intensity_factor < 0.85 ? 'Moderate endurance' :
                   ride.intensity_factor < 0.95 ? 'Tempo effort' :
                   ride.intensity_factor < 1.05 ? 'Threshold workout' : 'High intensity'}
                </div>
              </div>

              {ride.variability_index && (
                <div>
                  <div className="text-sm text-gray-400 mb-1">Variability Index (VI)</div>
                  <div className="text-3xl font-bold">{ride.variability_index.toFixed(2)}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {ride.variability_index < 1.05 ? 'Very steady pacing' :
                     ride.variability_index < 1.10 ? 'Good pacing' :
                     'Variable effort'}
                  </div>
                </div>
              )}

              {ride.kilojoules && (
                <div>
                  <div className="text-sm text-gray-400 mb-1">Work (kJ)</div>
                  <div className="text-3xl font-bold">{ride.kilojoules}</div>
                  <div className="text-xs text-gray-500 mt-1">≈ {Math.round(ride.kilojoules / 4.184)} calories</div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}


