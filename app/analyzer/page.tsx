"use client"

import { useState, useEffect, useRef, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Nav } from "@/components/nav"
import { RouteMap } from "@/components/route-map"
import { 
  LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts'
import { Calendar, MapPin, TrendingUp, Zap, Heart, Activity, Clock, Mountain, Send, Bot, User, Search, ChevronDown } from "lucide-react"

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

interface Activity {
  id: number
  strava_id: number
  name: string
  start_date: string
  distance: number
  moving_time: number
  type: string
}

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

function RideAnalyzerContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialRideId = searchParams.get('rideId')

  const [activities, setActivities] = useState<Activity[]>([])
  const [selectedRideId, setSelectedRideId] = useState<string | null>(initialRideId)
  const [ride, setRide] = useState<RideDetails | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingActivities, setLoadingActivities] = useState(true) // Always load for dropdown
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isAsking, setIsAsking] = useState(false)
  const [showRideSelector, setShowRideSelector] = useState(!initialRideId)
  const [searchTerm, setSearchTerm] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [showDropdown, setShowDropdown] = useState(false) // For dropdown menu
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Redirect if no rideId provided
  useEffect(() => {
    if (!initialRideId || initialRideId === 'undefined') {
      console.error('No valid ride ID provided, redirecting to rides page')
      router.push('/rides')
    }
  }, [])

  // Always fetch activities for dropdown
  useEffect(() => {
    fetchActivities()
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (selectedRideId && selectedRideId !== 'undefined') {
      fetchRideDetails(selectedRideId)
      fetchConversationHistory(selectedRideId)
      setShowRideSelector(false)
    }
  }, [selectedRideId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function fetchActivities() {
    try {
      const response = await fetch('/api/strava/activities?lookback=year')
      
      if (!response.ok) {
        throw new Error('Failed to fetch activities')
      }
      
      const data = await response.json()
      const sortedActivities = (data.activities || []).sort((a: Activity, b: Activity) => 
        new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
      )
      setActivities(sortedActivities)
    } catch (error) {
      console.error('Error fetching activities:', error)
    } finally {
      setLoadingActivities(false)
    }
  }

  async function fetchRideDetails(rideId: string) {
    if (!rideId || rideId === 'undefined') {
      setError('Invalid ride ID')
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/rides/${rideId}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch ride details (${response.status})`)
      }
      
      const data = await response.json()
      setRide(data)
    } catch (error) {
      console.error('Error fetching ride:', error)
      setError('Failed to load ride details. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function fetchConversationHistory(rideId: string) {
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
    if (!inputValue.trim() || isAsking || !selectedRideId) return

    const userMessage: Message = {
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue("")
    setIsAsking(true)

    try {
      const conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))

      const response = await fetch(`/api/rides/${selectedRideId}/analyze`, {
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

  function handleRideSelect(rideId: number) {
    setSelectedRideId(rideId.toString())
    setMessages([])
    setShowDropdown(false) // Close dropdown
    router.push(`/analyzer?rideId=${rideId}`, { scroll: false })
  }

  function handleChangeRide() {
    setShowRideSelector(true)
    setRide(null)
    setMessages([])
  }

  if (!initialRideId || initialRideId === 'undefined') {
    return (
      <div className="min-h-screen bg-gradient-dark">
        <Nav />
        <main className="mx-auto max-w-7xl px-4 py-8">
          <div className="flex items-center justify-center h-96">
            <div className="text-white text-xl">Redirecting...</div>
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
          <div className="text-center text-white">
            <h2 className="text-2xl font-bold mb-4 text-red-400">Error Loading Ride</h2>
            <p className="text-gray-400 mb-6">{error}</p>
            <button
              onClick={() => router.push('/rides')}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              Back to Rides
            </button>
          </div>
        </main>
      </div>
    )
  }

  const filteredActivities = activities.filter(activity => 
    activity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    new Date(activity.start_date).toLocaleDateString().includes(searchTerm)
  )

  if (showRideSelector) {
    return (
      <div className="min-h-screen bg-gradient-dark text-white">
        <Nav />
        
        <main className="mx-auto max-w-7xl px-4 py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">🤖 Ride Analyzer</h1>
            <p className="text-gray-400">Select a ride to analyze with AI coaching insights</p>
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search rides by name or date..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-800/50 border border-gray-700 rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>
          </div>

          {/* Ride Selection */}
          {loadingActivities ? (
            <div className="text-center py-12">
              <p className="text-gray-400">Loading your rides...</p>
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-12 text-center">
              <h3 className="text-xl font-bold mb-2">No rides found</h3>
              <p className="text-gray-400">
                {searchTerm ? 'Try adjusting your search' : 'Connect your Strava account to see your rides'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredActivities.map((activity) => {
                const distanceMiles = (activity.distance * 0.000621371).toFixed(1)
                const durationHours = Math.floor(activity.moving_time / 3600)
                const durationMinutes = Math.floor((activity.moving_time % 3600) / 60)

                return (
                  <button
                    key={activity.id}
                    onClick={() => handleRideSelect(activity.strava_id)}
                    className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 hover:bg-gray-800 hover:border-purple-500 transition-all text-left group"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold group-hover:text-purple-400 transition-colors mb-1">
                          {activity.name}
                        </h3>
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
                      <div className="text-right">
                        <div className="text-2xl font-bold text-purple-400">{distanceMiles}</div>
                        <div className="text-xs text-gray-400">miles</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <div className="flex items-center gap-1">
                        <Clock size={14} />
                        <span>{durationHours}:{durationMinutes.toString().padStart(2, '0')}</span>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        activity.type === 'VirtualRide' 
                          ? 'bg-blue-500/20 text-blue-300' 
                          : 'bg-green-500/20 text-green-300'
                      }`}>
                        {activity.type === 'VirtualRide' ? 'Zwift' : 'Outdoor'}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </main>
      </div>
    )
  }

  if (loading || !ride) {
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
        {/* Header with Ride Dropdown */}
        <div className="mb-8">
          <div className="flex justify-between items-start mb-4">
            <div>
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
            
            {/* Ride Selector Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-700 flex items-center gap-2 transition-colors min-w-[200px] justify-between"
              >
                <span className="truncate">Change Ride</span>
                <ChevronDown size={16} className={`transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-96 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 max-h-[500px] overflow-hidden flex flex-col">
                  {/* Search */}
                  <div className="p-3 border-b border-gray-700">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                      <input
                        type="text"
                        placeholder="Search rides..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-10 pr-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 text-sm"
                      />
                    </div>
                  </div>
                  
                  {/* Rides List */}
                  <div className="overflow-y-auto">
                    {loadingActivities ? (
                      <div className="p-4 text-center text-gray-400">Loading rides...</div>
                    ) : filteredActivities.length === 0 ? (
                      <div className="p-4 text-center text-gray-400">
                        {searchTerm ? 'No rides found' : 'No rides available'}
                      </div>
                    ) : (
                      filteredActivities.slice(0, 20).map((activity) => {
                        const distanceMiles = (activity.distance * 0.000621371).toFixed(1)
                        const isSelected = activity.strava_id.toString() === selectedRideId
                        
                        return (
                          <button
                            key={activity.id}
                            onClick={() => handleRideSelect(activity.strava_id)}
                            className={`w-full text-left p-3 hover:bg-gray-700 transition-colors border-b border-gray-700 last:border-b-0 ${
                              isSelected ? 'bg-purple-900/30' : ''
                            }`}
                          >
                            <div className="flex justify-between items-start gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-white text-sm truncate mb-1">
                                  {activity.name}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-400">
                                  <Calendar size={12} />
                                  <span>
                                    {new Date(activity.start_date).toLocaleDateString('en-US', { 
                                      month: 'short', 
                                      day: 'numeric'
                                    })}
                                  </span>
                                  <span className={`px-1.5 py-0.5 rounded text-xs ${
                                    activity.type === 'VirtualRide' 
                                      ? 'bg-blue-500/20 text-blue-300' 
                                      : 'bg-green-500/20 text-green-300'
                                  }`}>
                                    {activity.type === 'VirtualRide' ? 'Zwift' : 'Outdoor'}
                                  </span>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-bold text-purple-400">{distanceMiles}</div>
                                <div className="text-xs text-gray-400">mi</div>
                              </div>
                            </div>
                          </button>
                        )
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
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
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
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
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 backdrop-blur">
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
      </main>
    </div>
  )
}

export default function RideAnalyzerPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-dark">
        <Nav />
        <main className="mx-auto max-w-7xl px-4 py-8">
          <div className="flex items-center justify-center h-96">
            <div className="text-white text-xl">Loading...</div>
          </div>
        </main>
      </div>
    }>
      <RideAnalyzerContent />
    </Suspense>
  )
}

