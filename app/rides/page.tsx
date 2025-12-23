"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Nav } from "@/components/nav"
import { Calendar, TrendingUp, Zap, Heart, Mountain, Clock, Bot } from "lucide-react"

interface Activity {
  id: number
  strava_id: number
  name: string
  start_date: string
  distance: number
  moving_time: number
  total_elevation_gain: number
  average_speed: number
  average_watts?: number
  weighted_power?: number
  average_heartrate?: number
  tss?: number
  type: string
  ai_analysis?: string
}

export default function RidesPage() {
  const router = useRouter()
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'Ride' | 'VirtualRide'>('all')

  useEffect(() => {
    fetchActivities()
  }, [])

  async function fetchActivities() {
    try {
      // Uses session authentication - no need for userId
      const response = await fetch('/api/strava/activities?lookback=year')
      
      if (!response.ok) {
        throw new Error('Failed to fetch activities')
      }
      
      const data = await response.json()
      // Sort by date descending (newest first)
      const sortedActivities = (data.activities || []).sort((a: Activity, b: Activity) => 
        new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
      )
      setActivities(sortedActivities)
    } catch (error) {
      console.error('Error fetching activities:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredActivities = filter === 'all' 
    ? activities 
    : activities.filter(a => a.type === filter)

  return (
    <div className="min-h-screen bg-gradient-dark text-white">
      <Nav />
      
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">All Rides</h1>
            <p className="text-gray-400">Your complete cycling history</p>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'all' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('Ride')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'Ride' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              Outdoor
            </button>
            <button
              onClick={() => setFilter('VirtualRide')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'VirtualRide' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              Zwift
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-400">Loading rides...</p>
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-12 text-center">
            <h3 className="text-xl font-bold mb-2">No rides found</h3>
            <p className="text-gray-400">Connect your Strava account to see your rides here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredActivities.map((activity) => {
              const distanceMiles = (activity.distance * 0.000621371).toFixed(1)
              const avgSpeedMph = (activity.average_speed * 2.23694).toFixed(1)
              const durationHours = Math.floor(activity.moving_time / 3600)
              const durationMinutes = Math.floor((activity.moving_time % 3600) / 60)

              return (
                <div
                  key={activity.id}
                  className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 hover:bg-gray-800 hover:border-purple-500/50 transition-all"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div 
                      className="flex-1 cursor-pointer"
                      onClick={() => router.push(`/rides/${activity.id}`)}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold">{activity.name}</h3>
                        <span className={`text-xs px-2 py-1 rounded ${
                          activity.type === 'VirtualRide' 
                            ? 'bg-blue-500/20 text-blue-300' 
                            : 'bg-green-500/20 text-green-300'
                        }`}>
                          {activity.type === 'VirtualRide' ? '🎮 Zwift' : '🚴 Outdoor'}
                        </span>
                        {activity.ai_analysis && (
                          <span className="text-xs px-2 py-1 rounded bg-purple-500/20 text-purple-300">
                            🤖 AI Analyzed
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Calendar size={14} />
                        <span>
                          {new Date(activity.start_date).toLocaleDateString('en-US', { 
                            weekday: 'short',
                            month: 'short', 
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-3xl font-bold text-purple-400">{distanceMiles}</div>
                        <div className="text-sm text-gray-400">miles</div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/analyzer?rideId=${activity.id}`)
                        }}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                      >
                        <Bot size={18} />
                        Analyze with AI
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                    <div className="flex items-center gap-2">
                      <Clock size={16} className="text-blue-400" />
                      <div>
                        <div className="text-sm font-semibold">
                          {durationHours}:{durationMinutes.toString().padStart(2, '0')}
                        </div>
                        <div className="text-xs text-gray-500">Duration</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <TrendingUp size={16} className="text-green-400" />
                      <div>
                        <div className="text-sm font-semibold">{avgSpeedMph} mph</div>
                        <div className="text-xs text-gray-500">Avg Speed</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Mountain size={16} className="text-gray-400" />
                      <div>
                        <div className="text-sm font-semibold">{activity.total_elevation_gain}m</div>
                        <div className="text-xs text-gray-500">Elevation</div>
                      </div>
                    </div>

                    {activity.average_watts && (
                      <div className="flex items-center gap-2">
                        <Zap size={16} className="text-orange-400" />
                        <div>
                          <div className="text-sm font-semibold">{activity.average_watts}W</div>
                          <div className="text-xs text-gray-500">Avg Power</div>
                        </div>
                      </div>
                    )}

                    {activity.average_heartrate && (
                      <div className="flex items-center gap-2">
                        <Heart size={16} className="text-red-400" />
                        <div>
                          <div className="text-sm font-semibold">{activity.average_heartrate.toFixed(0)} bpm</div>
                          <div className="text-xs text-gray-500">Avg HR</div>
                        </div>
                      </div>
                    )}

                    {activity.tss && (
                      <div className="flex items-center gap-2">
                        <Zap size={16} className="text-pink-400" />
                        <div>
                          <div className="text-sm font-semibold">{activity.tss.toFixed(0)}</div>
                          <div className="text-xs text-gray-500">TSS</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}


