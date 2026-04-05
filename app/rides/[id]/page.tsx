"use client"

import { useState, useEffect, useRef } from "react"
import { useParams } from "next/navigation"
import { Nav } from "@/components/nav"
import { Markdown } from "@/components/markdown"
import { RouteMap } from "@/components/route-map"
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts'
import { Calendar, MapPin, TrendingUp, Zap, Heart, Activity, Clock, Mountain, Send, Bot, User } from "lucide-react"

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
  ftp?: number // User's FTP
}

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export default function RideAnalysisPage() {
  const params = useParams()
  const rideId = params?.id

  const [ride, setRide] = useState<RideDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isAsking, setIsAsking] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (rideId) {
      fetchRideDetails()
      fetchConversationHistory()
    }
  }, [rideId])

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function fetchRideDetails() {
    try {
      const response = await fetch(`/api/rides/${rideId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch ride details')
      }
      
      const data = await response.json()
      setRide(data)
    } catch (error) {
      console.error('Error fetching ride:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchConversationHistory() {
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

  async function askQuestion() {
    if (!inputValue.trim() || isAsking) return

    const userMessage: Message = {
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue("")
    setIsAsking(true)

    try {
      // Build conversation history for context
      const conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))

      const response = await fetch(`/api/rides/${rideId}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userPrompt: inputValue,
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

  const hasChartData = chartData.length > 0

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

        {/* AI Coach Conversation */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl backdrop-blur mb-8 overflow-hidden flex flex-col" style={{ height: '600px' }}>
          <div className="bg-purple-600/20 border-b border-purple-500/30 px-6 py-4">
            <div className="flex items-center gap-3">
              <Bot size={24} className="text-purple-400" />
              <div>
                <h2 className="text-xl font-bold">AI Coach Analysis</h2>
                <p className="text-sm text-gray-400">Ask questions about this ride, get insights, and coaching feedback</p>
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <Bot size={48} className="text-purple-400 mx-auto mb-4 opacity-50" />
                <p className="text-gray-400 mb-2">Start a conversation about your ride</p>
                <p className="text-sm text-gray-500">Ask me anything - performance analysis, pacing, training advice, or race strategy</p>
                <div className="mt-6 flex flex-wrap gap-2 justify-center">
                  <button
                    onClick={() => setInputValue("How did I perform on this ride?")}
                    className="text-sm px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 rounded-lg transition-colors"
                  >
                    How did I perform?
                  </button>
                  <button
                    onClick={() => setInputValue("What should I focus on improving?")}
                    className="text-sm px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 rounded-lg transition-colors"
                  >
                    What should I improve?
                  </button>
                  <button
                    onClick={() => setInputValue("Was my pacing good for this ride?")}
                    className="text-sm px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 rounded-lg transition-colors"
                  >
                    Was my pacing good?
                  </button>
                </div>
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
                    className={`max-w-[80%] rounded-xl px-4 py-3 ${
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
                placeholder="Ask about your performance, pacing, training advice, or add context about how you felt..."
                className="flex-1 bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 text-sm resize-none focus:outline-none focus:border-purple-500 transition-colors"
                rows={3}
                disabled={isAsking}
              />
              <button
                onClick={askQuestion}
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

        {/* Power & HR Chart */}
        {hasChartData && (ride.average_watts || ride.average_heartrate) && (
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 backdrop-blur mb-8">
            <h3 className="text-xl font-bold mb-4">Power & Heart Rate Over Time</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
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
        )}

        {/* Elevation Profile */}
        {hasChartData && (
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 backdrop-blur mb-8">
            <h3 className="text-xl font-bold mb-4">Elevation Profile</h3>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData}>
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
        )}

        {/* Speed & Cadence */}
        {hasChartData && (
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 backdrop-blur mb-8">
            <h3 className="text-xl font-bold mb-4">Speed & Cadence</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData}>
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
        )}

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




