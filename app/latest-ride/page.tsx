"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Nav } from "@/components/nav"
import { Markdown } from "@/components/markdown"
import { RouteMap } from "@/components/route-map"
import { 
  LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts'
import { Calendar, TrendingUp, Zap, Heart, Activity, Clock, Mountain, Send, Bot, User, ArrowRight } from "lucide-react"

interface RideDetails {
  id: number
  name: string
  type?: string // Ride or VirtualRide
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
  summary_polyline?: string
  description?: string
  ftp?: number
}

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export default function LatestRidePage() {
  const router = useRouter()
  const [ride, setRide] = useState<RideDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isAsking, setIsAsking] = useState(false)
  const [autoAnalyzed, setAutoAnalyzed] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchLatestRide()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    // Auto-analyze when ride is loaded
    if (ride && !autoAnalyzed && messages.length === 0) {
      setAutoAnalyzed(true)
      setInputValue("Give me a quick analysis of this ride and any coaching insights.")
      // Trigger the analysis after a short delay
      setTimeout(() => {
        askQuestion("Give me a quick analysis of this ride and any coaching insights.")
      }, 500)
    }
  }, [ride, autoAnalyzed, messages.length])

  async function fetchLatestRide() {
    try {
      // Fetch latest ride from local DB (not Strava API)
      const response = await fetch('/api/rides/latest')

      if (!response.ok) {
        if (response.status === 404) {
          console.log('No rides found in database')
          return
        }
        throw new Error('Failed to fetch latest ride')
      }

      const latestActivity = await response.json()

      // Fetch full details for this ride (stream data, etc.)
      const detailsResponse = await fetch(`/api/rides/${latestActivity.strava_id}`)

      if (detailsResponse.ok) {
        const rideData = await detailsResponse.json()
        setRide(rideData)

        // Fetch conversation history
        await fetchConversationHistory(latestActivity.strava_id)
      } else {
        console.error('Failed to fetch ride details:', detailsResponse.status)
      }
    } catch (error) {
      console.error('Error fetching latest ride:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchConversationHistory(rideId: number) {
    try {
      const response = await fetch(`/api/rides/${rideId}/analyze`)
      
      if (response.ok) {
        const data = await response.json()
        if (data.history && data.history.length > 0) {
          const conversationMessages: Message[] = []
          data.history.forEach((item: any) => {
            conversationMessages.push({
              role: 'user',
              content: item.user_prompt,
              timestamp: new Date(item.created_at)
            })
            conversationMessages.push({
              role: 'assistant',
              content: item.ai_response,
              timestamp: new Date(item.created_at)
            })
          })
          setMessages(conversationMessages)
        }
      }
    } catch (error) {
      console.error('Error fetching conversation history:', error)
    }
  }

  async function askQuestion(customPrompt?: string) {
    const prompt = customPrompt || inputValue
    if (!prompt.trim() || isAsking || !ride) return

    const userMessage: Message = {
      role: 'user',
      content: prompt,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    if (!customPrompt) {
      setInputValue("")
    }
    setIsAsking(true)

    try {
      const conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))

      const response = await fetch(`/api/rides/${ride.id}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userPrompt: prompt,
          conversationHistory
        })
      })

      if (!response.ok) {
        throw new Error('Failed to get AI response')
      }

      const data = await response.json()

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error asking question:', error)
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsAsking(false)
    }
  }

  function handleKeyPress(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      askQuestion()
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-dark">
        <Nav />
        <main className="mx-auto max-w-7xl px-4 py-8">
          <div className="flex items-center justify-center h-96">
            <div className="text-white text-xl">Loading your latest ride...</div>
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
          <div className="text-center text-white py-16">
            <Activity size={64} className="text-gray-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">No rides found</h2>
            <p className="text-gray-400 mb-6">Sync your rides from Strava to see your latest ride analysis</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => router.push('/settings')}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors"
              >
                Go to Settings
              </button>
              <button
                onClick={() => router.push('/rides')}
                className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg transition-colors"
              >
                View Rides
              </button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  const distanceMiles = (ride.distance * 0.000621371).toFixed(1)
  const avgSpeedMph = (ride.average_speed * 2.23694).toFixed(1)
  const maxSpeedMph = (ride.max_speed * 2.23694).toFixed(1)
  const durationHours = Math.floor(ride.moving_time / 3600)
  const durationMinutes = Math.floor((ride.moving_time % 3600) / 60)

  // Process stream data for charts
  let chartData = []
  if (ride.stream_data) {
    const streams = ride.stream_data
    const timeData = streams.time?.data || []
    const powerData = streams.watts?.data || []
    const hrData = streams.heartrate?.data || []
    const speedData = streams.velocity_smooth?.data || []
    const cadenceData = streams.cadence?.data || []
    const altitudeData = streams.altitude?.data || []

    // Create chart data points (sample every 10th point to reduce data size)
    const sampleRate = Math.max(1, Math.floor(timeData.length / 200))
    chartData = timeData
      .filter((_: any, i: number) => i % sampleRate === 0)
      .map((time: number, i: number) => {
        const idx = i * sampleRate
        return {
          time: Math.round(time / 60), // Convert to minutes
          power: powerData[idx] || 0,
          hr: hrData[idx] || 0,
          speed: speedData[idx] ? (speedData[idx] * 3.6).toFixed(1) : 0, // Convert m/s to km/h
          cadence: cadenceData[idx] || 0,
          elevation: altitudeData[idx] || 0
        }
      })
  }

  return (
    <div className="min-h-screen bg-gradient-dark text-white">
      <Nav />
      
      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">🚴 Latest Ride</h1>
              <div className="flex items-center gap-2 text-gray-400">
                <Calendar size={16} />
                <span>{new Date(ride.start_date).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric',
                  month: 'long', 
                  day: 'numeric' 
                })}</span>
              </div>
            </div>
            <button
              onClick={() => router.push(`/analyzer?rideId=${ride.id}`)}
              className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-700 flex items-center gap-2 transition-colors"
            >
              Full Analysis
              <ArrowRight size={16} />
            </button>
          </div>
          <h2 className="text-2xl font-semibold text-purple-400">{ride.name}</h2>
        </div>

        {/* Route Map */}
        <div className="mb-8">
          <RouteMap 
            polyline={ride.summary_polyline} 
            height="400px"
            powerData={chartData.map((d: any) => d.power)}
            ftp={ride.ftp}
            isVirtualRide={ride.type === 'VirtualRide'}
            rideName={ride.name}
          />
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

        {/* AI Coach Analysis */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl backdrop-blur mb-8 overflow-hidden flex flex-col" style={{ height: '700px' }}>
          <div className="bg-purple-600/20 border-b border-purple-500/30 px-6 py-4">
            <div className="flex items-center gap-3">
              <Bot size={24} className="text-purple-400" />
              <div>
                <h2 className="text-xl font-bold">🤖 AI Coach Analysis</h2>
                <p className="text-sm text-gray-400">Your latest ride analyzed with AI coaching insights</p>
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 && !isAsking ? (
              <div className="text-center py-12">
                <Bot size={48} className="text-purple-400 mx-auto mb-4 opacity-50" />
                <p className="text-gray-400 mb-2">Analyzing your ride...</p>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'assistant' && (
                    <div className="flex-shrink-0">
                      <Bot size={32} className="text-purple-400 bg-purple-500/20 p-1.5 rounded-lg" />
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] rounded-xl px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-blue-600/30 border border-blue-500/30'
                        : 'bg-gray-700/50 border border-gray-600/30'
                    }`}
                  >
                    <Markdown className="text-sm">{message.content}</Markdown>
                    <p className="text-xs text-gray-500 mt-1">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {message.role === 'user' && (
                    <div className="flex-shrink-0">
                      <User size={32} className="text-blue-400 bg-blue-500/20 p-1.5 rounded-lg" />
                    </div>
                  )}
                </div>
              ))
            )}
            {isAsking && (
              <div className="flex gap-3 justify-start">
                <div className="flex-shrink-0">
                  <Bot size={32} className="text-purple-400 bg-purple-500/20 p-1.5 rounded-lg" />
                </div>
                <div className="bg-gray-700/50 border border-gray-600/30 rounded-xl px-4 py-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-700 p-4">
            <div className="flex gap-3">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask follow-up questions about your latest ride..."
                className="flex-1 bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 text-sm resize-none focus:outline-none focus:border-purple-500 transition-colors"
                rows={3}
                disabled={isAsking}
              />
              <button
                onClick={() => askQuestion()}
                disabled={isAsking || !inputValue.trim()}
                className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed px-6 rounded-lg transition-colors flex items-center gap-2"
              >
                <Send size={18} />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Press Enter to send, Shift+Enter for new line
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => router.push('/rides')}
            className="bg-gray-800/50 hover:bg-gray-800 border border-gray-700 rounded-xl p-6 transition-all text-left"
          >
            <h3 className="text-lg font-bold mb-2">View All Rides</h3>
            <p className="text-sm text-gray-400">Browse your complete cycling history</p>
          </button>
          
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-gray-800/50 hover:bg-gray-800 border border-gray-700 rounded-xl p-6 transition-all text-left"
          >
            <h3 className="text-lg font-bold mb-2">Training Dashboard</h3>
            <p className="text-sm text-gray-400">View your training metrics and progress</p>
          </button>
          
          <button
            onClick={() => router.push('/analyzer')}
            className="bg-gray-800/50 hover:bg-gray-800 border border-gray-700 rounded-xl p-6 transition-all text-left"
          >
            <h3 className="text-lg font-bold mb-2">Ride Analyzer</h3>
            <p className="text-sm text-gray-400">Deep dive into any ride with AI analysis</p>
          </button>
        </div>
      </main>
    </div>
  )
}



