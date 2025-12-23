"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Nav } from "@/components/nav"
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, 
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts'
import { Calendar, TrendingUp, Zap, Heart, Target, Activity, RefreshCw, Bot } from 'lucide-react'

interface ActivityData {
  id: number
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
  intensity_factor?: number
  type: string
  aiAnalysis?: {
    analysis: string
    feedback: string
    recommendations: string[]
  }
}

interface DashboardSummary {
  totalRides: number
  totalDistance: number
  totalTime: number
  totalTSS: number
  ctl: number
  atl: number
  tsb: number
}

const lookbackOptions = [
  { value: "week", label: "Last Week" },
  { value: "month", label: "Last Month" },
  { value: "quarter", label: "Last Quarter" },
  { value: "year", label: "Last Year" },
]

export default function Dashboard() {
  const router = useRouter()
  const [lookback, setLookback] = useState("month")
  const [activities, setActivities] = useState<ActivityData[]>([])
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function fetchData() {
    setLoading(true)
    setError(null)
    try {
      // No need to pass userId - it's in the session
      const response = await fetch(`/api/strava/activities?lookback=${lookback}&analyze=false`, {
        cache: 'no-store' // Force fresh data from Strava
      })
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
          throw new Error(errorData.error || errorData.details || 'Failed to fetch activities')
        }
        
        const data = await response.json()
        setActivities(data.activities || [])
        setSummary(data.summary || null)
      } catch (err: any) {
        console.error('Dashboard fetch error:', err)
        setError(err.message)
      } finally {
        setLoading(false)
        setSyncing(false)
      }
    }

  useEffect(() => {
    fetchData()
  }, [lookback])

  // Auto-sync on first load to get latest rides
  useEffect(() => {
    const hasAutoSynced = sessionStorage.getItem('dashboard_auto_synced')
    if (!hasAutoSynced && !loading) {
      sessionStorage.setItem('dashboard_auto_synced', 'true')
      // Auto-sync will happen on first fetchData call
    }
  }, [])

  async function handleSync() {
    setSyncing(true)
    await fetchData()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-dark">
        <Nav />
        <main className="mx-auto max-w-7xl px-4 py-8">
          <div className="flex items-center justify-center h-96">
            <div className="text-white text-xl">Loading your rides...</div>
          </div>
        </main>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-dark">
        <Nav />
        <main className="mx-auto max-w-7xl px-4 py-8">
          <div className="bg-red-500/10 border border-red-500 rounded-lg p-6 text-red-200">
            <h2 className="text-xl font-bold mb-2">Error loading data</h2>
            <p>{error}</p>
          </div>
        </main>
      </div>
    )
  }

  // Process data for charts
  // Activities come from API in descending order (newest first)
  // For time series charts, we want ascending order (oldest first, left to right)
  const sortedActivities = [...activities].sort((a, b) => 
    new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
  );
  
  const chartData = sortedActivities.map(a => ({
    date: new Date(a.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    distance: (a.distance * 0.000621371).toFixed(1), // miles
    speed: (a.average_speed * 2.23694).toFixed(1), // mph
    elevation: a.total_elevation_gain,
    tss: a.tss?.toFixed(0) || 0,
    power: a.average_watts || 0,
    hr: a.average_heartrate || 0,
    duration: a.moving_time / 3600 // hours
  }));

  // Calculate period averages for display
  const periodStats = {
    avgSpeed: activities.length > 0 
      ? (activities.reduce((sum, a) => sum + a.average_speed, 0) / activities.length * 2.23694).toFixed(1)
      : '0',
    avgPower: activities.filter(a => a.average_watts).length > 0
      ? (activities.filter(a => a.average_watts).reduce((sum, a) => sum + (a.average_watts || 0), 0) / activities.filter(a => a.average_watts).length).toFixed(0)
      : '0',
    avgHR: activities.filter(a => a.average_heartrate).length > 0
      ? (activities.filter(a => a.average_heartrate).reduce((sum, a) => sum + (a.average_heartrate || 0), 0) / activities.filter(a => a.average_heartrate).length).toFixed(0)
      : '0'
  };

  // Fitness chart data (CTL/ATL/TSB)
  const fitnessData = sortedActivities.map((a, idx) => ({
    date: new Date(a.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    // This is simplified - you'd calculate cumulative CTL/ATL
    fitness: summary ? summary.ctl : 0,
    fatigue: summary ? summary.atl : 0,
    form: summary ? summary.tsb : 0
  }));

  // Performance radar data
  const avgSpeed = activities.reduce((sum, a) => sum + a.average_speed, 0) / activities.length * 2.23694
  const avgPower = activities.filter(a => a.average_watts).reduce((sum, a) => sum + (a.average_watts || 0), 0) / activities.filter(a => a.average_watts).length
  const avgHR = activities.filter(a => a.average_heartrate).reduce((sum, a) => sum + (a.average_heartrate || 0), 0) / activities.filter(a => a.average_heartrate).length
  
  const radarData = [
    { metric: 'Speed', value: Math.min((avgSpeed / 25) * 100, 100), fullMark: 100 },
    { metric: 'Power', value: avgPower ? Math.min((avgPower / 250) * 100, 100) : 50, fullMark: 100 },
    { metric: 'Endurance', value: Math.min((summary?.totalDistance || 0) / 50000 * 100, 100), fullMark: 100 },
    { metric: 'Consistency', value: Math.min((activities.length / 20) * 100, 100), fullMark: 100 },
    { metric: 'Form', value: summary?.tsb ? Math.min(Math.max((summary.tsb + 20) / 40 * 100, 0), 100) : 50, fullMark: 100 },
  ]

  return (
    <div className="min-h-screen bg-gradient-dark text-white">
      <Nav />
      
      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Training Dashboard</h1>
            <p className="text-gray-400">Your path to STP domination 🚴‍♂️</p>
          </div>
          <div className="flex gap-3 items-center">
            <button
              onClick={handleSync}
              disabled={syncing || loading}
              className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
              {syncing ? 'Syncing...' : 'Sync from Strava'}
            </button>
            <select
              value={lookback}
              onChange={(e) => setLookback(e.target.value)}
              className="bg-gray-800 text-white rounded-lg px-4 py-2 border border-gray-700 focus:border-purple-500 focus:outline-none"
            >
              {lookbackOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-purple-500/20 to-purple-700/20 border border-purple-500/30 rounded-xl p-6 hover:scale-105 transition-transform">
            <div className="flex items-center justify-between mb-2">
              <Activity className="text-purple-400" size={24} />
              <span className="text-sm text-gray-400">{lookback}</span>
            </div>
            <div className="text-3xl font-bold mb-1">{activities.length}</div>
            <div className="text-gray-400 text-sm">Total Rides</div>
          </div>

          <div className="bg-gradient-to-br from-blue-500/20 to-blue-700/20 border border-blue-500/30 rounded-xl p-6 hover:scale-105 transition-transform">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="text-blue-400" size={24} />
              <span className="text-sm text-gray-400">miles</span>
            </div>
            <div className="text-3xl font-bold mb-1">
              {summary ? (summary.totalDistance * 0.000621371).toFixed(0) : 0}
            </div>
            <div className="text-gray-400 text-sm">Distance</div>
          </div>

          <div className="bg-gradient-to-br from-orange-500/20 to-orange-700/20 border border-orange-500/30 rounded-xl p-6 hover:scale-105 transition-transform">
            <div className="flex items-center justify-between mb-2">
              <Zap className="text-orange-400" size={24} />
              <span className="text-sm text-gray-400">TSS</span>
            </div>
            <div className="text-3xl font-bold mb-1">
              {summary?.totalTSS?.toFixed(0) || 0}
            </div>
            <div className="text-gray-400 text-sm">Training Load</div>
          </div>

          <div className="bg-gradient-to-br from-green-500/20 to-green-700/20 border border-green-500/30 rounded-xl p-6 hover:scale-105 transition-transform">
            <div className="flex items-center justify-between mb-2">
              <Target className="text-green-400" size={24} />
              <span className={`text-sm ${summary && summary.tsb > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {summary && summary.tsb > 0 ? 'Fresh' : 'Fatigued'}
              </span>
            </div>
            <div className="text-3xl font-bold mb-1">
              {summary?.tsb?.toFixed(0) || 0}
            </div>
            <div className="text-gray-400 text-sm">Form (TSB)</div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Distance & Speed Trend */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 backdrop-blur">
            <h3 className="text-xl font-bold mb-4">
              Distance & Speed Over Time
              <span className="text-sm font-normal text-gray-400 ml-3">
                Avg Speed: {periodStats.avgSpeed} mph
              </span>
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9CA3AF" />
                <YAxis yAxisId="left" stroke="#8B5CF6" />
                <YAxis yAxisId="right" orientation="right" stroke="#3B82F6" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                  labelStyle={{ color: '#F3F4F6' }}
                />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="distance" stroke="#8B5CF6" strokeWidth={2} name="Distance (mi)" />
                <Line yAxisId="right" type="monotone" dataKey="speed" stroke="#3B82F6" strokeWidth={2} name="Avg Speed (mph)" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Power & HR */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 backdrop-blur">
            <h3 className="text-xl font-bold mb-4">
              Power & Heart Rate
              <span className="text-sm font-normal text-gray-400 ml-3">
                Avg Power: {periodStats.avgPower}W | Avg HR: {periodStats.avgHR} bpm
              </span>
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorPower" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorHR" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9CA3AF" />
                <YAxis yAxisId="left" stroke="#F59E0B" />
                <YAxis yAxisId="right" orientation="right" stroke="#EF4444" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                  labelStyle={{ color: '#F3F4F6' }}
                />
                <Legend />
                <Area yAxisId="left" type="monotone" dataKey="power" stroke="#F59E0B" fillOpacity={1} fill="url(#colorPower)" name="Avg Power (W)" />
                <Area yAxisId="right" type="monotone" dataKey="hr" stroke="#EF4444" fillOpacity={1} fill="url(#colorHR)" name="Avg HR (bpm)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Training Load (TSS) */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 backdrop-blur">
            <h3 className="text-xl font-bold mb-4">Training Stress Score</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                  labelStyle={{ color: '#F3F4F6' }}
                />
                <Bar dataKey="tss" name="TSS" radius={[8, 8, 0, 0]}>
                  {chartData.map((entry, index) => {
                    const tss = Number(entry.tss)
                    const color = tss > 150 ? '#EF4444' : tss > 100 ? '#F59E0B' : '#10B981'
                    return <Cell key={`cell-${index}`} fill={color} />
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span className="text-gray-400">&lt;100 Easy</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-500 rounded"></div>
                <span className="text-gray-400">100-150 Moderate</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded"></div>
                <span className="text-gray-400">&gt;150 Hard</span>
              </div>
            </div>
          </div>

          {/* Performance Radar */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 backdrop-blur">
            <h3 className="text-xl font-bold mb-4">Performance Profile</h3>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#374151" />
                <PolarAngleAxis dataKey="metric" stroke="#9CA3AF" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#9CA3AF" />
                <Radar name="Current" dataKey="value" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.6} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Fitness/Fatigue/Form Chart */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 backdrop-blur mb-8">
          <h3 className="text-xl font-bold mb-4">Fitness, Fatigue & Form (CTL/ATL/TSB)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={fitnessData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                labelStyle={{ color: '#F3F4F6' }}
              />
              <Legend />
              <Line type="monotone" dataKey="fitness" stroke="#3B82F6" strokeWidth={3} name="Fitness (CTL)" />
              <Line type="monotone" dataKey="fatigue" stroke="#EF4444" strokeWidth={3} name="Fatigue (ATL)" />
              <Line type="monotone" dataKey="form" stroke="#10B981" strokeWidth={3} name="Form (TSB)" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Rides */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 backdrop-blur">
          <h3 className="text-xl font-bold mb-4">Recent Rides</h3>
          <div className="space-y-4">
            {[...activities].sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime()).slice(0, 5).map((activity) => (
              <div key={activity.id} className="bg-gray-700/50 rounded-lg p-4 hover:bg-gray-700 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h4 className="font-bold text-lg">{activity.name}</h4>
                    <p className="text-gray-400 text-sm">
                      {new Date(activity.start_date).toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-2xl font-bold text-purple-400">
                        {(activity.distance * 0.000621371).toFixed(1)} mi
                      </div>
                      <div className="text-sm text-gray-400">
                        {(activity.average_speed * 2.23694).toFixed(1)} mph
                      </div>
                    </div>
                    <button
                      onClick={() => router.push(`/analyzer?rideId=${activity.id}`)}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm"
                    >
                      <Bot size={16} />
                      Analyze
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Time:</span>
                    <div className="font-semibold">
                      {Math.floor(activity.moving_time / 3600)}h {Math.floor((activity.moving_time % 3600) / 60)}m
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-400">Elevation:</span>
                    <div className="font-semibold">{activity.total_elevation_gain}m</div>
                  </div>
                  {activity.average_watts && (
                    <div>
                      <span className="text-gray-400">Avg Power:</span>
                      <div className="font-semibold">{activity.average_watts}W</div>
                    </div>
                  )}
                  {activity.tss && (
                    <div>
                      <span className="text-gray-400">TSS:</span>
                      <div className="font-semibold">{activity.tss.toFixed(0)}</div>
                    </div>
                  )}
                </div>

                {activity.aiAnalysis && (
                  <div className="mt-4 p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                    <div className="text-sm text-purple-300 font-semibold mb-1">🤖 AI Coach:</div>
                    <p className="text-sm text-gray-300">{activity.aiAnalysis.analysis}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
