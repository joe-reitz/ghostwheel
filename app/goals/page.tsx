"use client"

import { useState, useEffect } from "react"
import { Nav } from "@/components/nav"
import { Target, Trophy, TrendingUp, Calendar, Plus, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Goal {
  id: number
  name: string
  type: string
  target_value?: number
  target_date?: string
  description?: string
  status: string
  progress?: number
  created_at: string
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    type: 'race',
    targetValue: '',
    targetDate: '',
    description: ''
  })

  useEffect(() => {
    fetchGoals()
  }, [])

  async function fetchGoals() {
    try {
      // TODO: Implement goals API endpoint
      // const userId = "YOUR_STRAVA_ID"
      // const response = await fetch(`/api/goals?userId=${userId}`)
      // const data = await response.json()
      // setGoals(data.goals || [])
      
      // Mock data
      setGoals([
        {
          id: 1,
          name: "Seattle to Portland One Day",
          type: "race",
          target_value: 204,
          target_date: "2025-07-12",
          description: "Complete STP in one day at 17+ mph average",
          status: "active",
          progress: 35,
          created_at: new Date().toISOString()
        }
      ])
    } catch (error) {
      console.error('Error fetching goals:', error)
    } finally {
      setLoading(false)
    }
  }

  async function createGoal() {
    try {
      // TODO: Implement create goal API
      // const response = await fetch('/api/goals', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(formData)
      // })
      // const data = await response.json()
      // setGoals([data.goal, ...goals])
      setShowForm(false)
      setFormData({
        name: '',
        type: 'race',
        targetValue: '',
        targetDate: '',
        description: ''
      })
    } catch (error) {
      console.error('Error creating goal:', error)
    }
  }

  const goalTypes = [
    { value: 'race', label: '🏁 Race/Event', icon: Trophy },
    { value: 'distance', label: '📏 Distance Goal', icon: TrendingUp },
    { value: 'speed', label: '⚡ Speed Target', icon: TrendingUp },
    { value: 'power', label: '💪 Power (FTP)', icon: Target },
  ]

  return (
    <div className="min-h-screen bg-gradient-dark text-white">
      <Nav />
      
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Goals</h1>
            <p className="text-gray-400">Set targets and track your progress</p>
          </div>
          <Button 
            onClick={() => setShowForm(!showForm)}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Plus className="mr-2" size={20} />
            New Goal
          </Button>
        </div>

        {/* Goal Creation Form */}
        {showForm && (
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 backdrop-blur mb-8">
            <h2 className="text-2xl font-bold mb-4">Create New Goal</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Goal Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g., Complete a Century Ride"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Goal Type</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {goalTypes.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setFormData({...formData, type: type.value})}
                      className={`p-4 rounded-lg border transition-all ${
                        formData.type === type.value
                          ? 'bg-purple-500/20 border-purple-500'
                          : 'bg-gray-700/50 border-gray-600 hover:border-gray-500'
                      }`}
                    >
                      <type.icon className="mx-auto mb-2" size={24} />
                      <div className="text-sm">{type.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Target Value</label>
                  <input
                    type="number"
                    value={formData.targetValue}
                    onChange={(e) => setFormData({...formData, targetValue: e.target.value})}
                    placeholder={
                      formData.type === 'distance' ? 'Miles' :
                      formData.type === 'speed' ? 'MPH' :
                      formData.type === 'power' ? 'Watts' : 'Value'
                    }
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Target Date</label>
                  <input
                    type="date"
                    value={formData.targetDate}
                    onChange={(e) => setFormData({...formData, targetDate: e.target.value})}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description (Optional)</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Add notes about your goal..."
                  rows={3}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:border-purple-500 focus:outline-none resize-none"
                />
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={createGoal}
                  disabled={!formData.name}
                  className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
                >
                  Create Goal
                </Button>
                <Button
                  onClick={() => setShowForm(false)}
                  className="bg-gray-700 hover:bg-gray-600"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Goals List */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-400">Loading goals...</p>
          </div>
        ) : goals.length === 0 ? (
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-12 text-center">
            <Target className="mx-auto mb-4 text-gray-500" size={48} />
            <h3 className="text-xl font-bold mb-2">No Goals Yet</h3>
            <p className="text-gray-400 mb-4">
              Set your first goal to start tracking your progress!
            </p>
            <Button 
              onClick={() => setShowForm(true)}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Create Your First Goal
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {goals.map((goal) => {
              const daysUntil = goal.target_date 
                ? Math.ceil((new Date(goal.target_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                : null

              return (
                <div key={goal.id} className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 backdrop-blur hover:border-purple-500/50 transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold mb-2">{goal.name}</h3>
                      <p className="text-gray-400 text-sm mb-3">{goal.description}</p>
                      
                      <div className="flex flex-wrap gap-3 text-sm">
                        {goal.target_date && (
                          <div className="flex items-center gap-2 bg-purple-500/20 px-3 py-1 rounded-full">
                            <Calendar size={14} />
                            <span>
                              {new Date(goal.target_date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </span>
                          </div>
                        )}
                        {daysUntil !== null && (
                          <div className={`px-3 py-1 rounded-full ${
                            daysUntil < 30 ? 'bg-red-500/20 text-red-300' :
                            daysUntil < 90 ? 'bg-orange-500/20 text-orange-300' :
                            'bg-green-500/20 text-green-300'
                          }`}>
                            {daysUntil} days away
                          </div>
                        )}
                        {goal.target_value && (
                          <div className="flex items-center gap-2 bg-blue-500/20 px-3 py-1 rounded-full text-blue-300">
                            <Target size={14} />
                            <span>
                              {goal.target_value} {
                                goal.type === 'distance' ? 'miles' :
                                goal.type === 'speed' ? 'mph' :
                                goal.type === 'power' ? 'W' : ''
                              }
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {goal.status === 'completed' && (
                      <CheckCircle2 className="text-green-400" size={32} />
                    )}
                  </div>

                  {goal.progress !== undefined && (
                    <div className="mt-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-400">Progress</span>
                        <span className="font-semibold">{goal.progress}%</span>
                      </div>
                      <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                          style={{ width: `${goal.progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <div className="text-sm text-gray-400">
                      Created {new Date(goal.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </div>
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


