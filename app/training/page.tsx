"use client"

import { useState, useEffect } from "react"
import { Nav } from "@/components/nav"
import { Calendar, Target, TrendingUp, Zap, CheckCircle2, Circle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface TrainingPlan {
  id: number
  name: string
  start_date: string
  end_date: string
  weeks_total: number
  plan_data: {
    totalWeeks: number
    phases: Array<{
      name: string
      weeks: number
      focus: string
      weeklyStructure: Record<string, string>
    }>
    keyWorkouts: string[]
    nutritionGuidance: string
    gearRecommendations: string
  }
  goal_name: string
  goal_date: string
}

export default function TrainingPage() {
  const [plans, setPlans] = useState<TrainingPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [showGenerator, setShowGenerator] = useState(false)
  const [formData, setFormData] = useState({
    targetDate: '',
    currentFTP: '',
    recentWeeklyMileage: '',
    longestRecentRide: '',
    currentAverageSpeed: ''
  })

  useEffect(() => {
    fetchPlans()
  }, [])

  async function fetchPlans() {
    try {
      // TODO: Replace with actual user ID from auth
      const userId = "YOUR_STRAVA_ID"
      const response = await fetch(`/api/training-plan?userId=${userId}`)
      const data = await response.json()
      setPlans(data.plans || [])
    } catch (error) {
      console.error('Error fetching plans:', error)
    } finally {
      setLoading(false)
    }
  }

  async function generatePlan() {
    setGenerating(true)
    try {
      const userId = "YOUR_STRAVA_ID"
      const response = await fetch('/api/training-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          ...formData
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate plan')
      }

      const data = await response.json()
      setPlans([data.trainingPlan, ...plans])
      setShowGenerator(false)
      setFormData({
        targetDate: '',
        currentFTP: '',
        recentWeeklyMileage: '',
        longestRecentRide: '',
        currentAverageSpeed: ''
      })
    } catch (error) {
      console.error('Error generating plan:', error)
      alert('Failed to generate training plan. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

  return (
    <div className="min-h-screen bg-gradient-dark text-white">
      <Nav />
      
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Training Plans</h1>
            <p className="text-gray-400">AI-powered training for your biggest goals</p>
          </div>
          <Button 
            onClick={() => setShowGenerator(!showGenerator)}
            className="bg-purple-600 hover:bg-purple-700"
          >
            Generate STP Plan
          </Button>
        </div>

        {/* Training Plan Generator */}
        {showGenerator && (
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 backdrop-blur mb-8">
            <h2 className="text-2xl font-bold mb-4">Generate Your STP Training Plan</h2>
            <p className="text-gray-400 mb-6">
              Tell us about your current fitness, and we'll create a personalized plan to get you ready for 204 miles at 17+ mph.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium mb-2">STP Date</label>
                <input
                  type="date"
                  value={formData.targetDate}
                  onChange={(e) => setFormData({...formData, targetDate: e.target.value})}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:border-purple-500 focus:outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Current FTP (watts)</label>
                <input
                  type="number"
                  value={formData.currentFTP}
                  onChange={(e) => setFormData({...formData, currentFTP: e.target.value})}
                  placeholder="250"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:border-purple-500 focus:outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Recent Weekly Mileage</label>
                <input
                  type="number"
                  value={formData.recentWeeklyMileage}
                  onChange={(e) => setFormData({...formData, recentWeeklyMileage: e.target.value})}
                  placeholder="100"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:border-purple-500 focus:outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Longest Recent Ride (miles)</label>
                <input
                  type="number"
                  value={formData.longestRecentRide}
                  onChange={(e) => setFormData({...formData, longestRecentRide: e.target.value})}
                  placeholder="50"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:border-purple-500 focus:outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Current Average Speed (mph)</label>
                <input
                  type="number"
                  value={formData.currentAverageSpeed}
                  onChange={(e) => setFormData({...formData, currentAverageSpeed: e.target.value})}
                  placeholder="15"
                  step="0.1"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                onClick={generatePlan}
                disabled={generating || !formData.targetDate}
                className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
              >
                {generating ? 'Generating...' : 'Generate Plan'}
              </Button>
              <Button
                onClick={() => setShowGenerator(false)}
                className="bg-gray-700 hover:bg-gray-600"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Training Plans List */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-400">Loading training plans...</p>
          </div>
        ) : plans.length === 0 ? (
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-12 text-center">
            <Target className="mx-auto mb-4 text-gray-500" size={48} />
            <h3 className="text-xl font-bold mb-2">No Training Plans Yet</h3>
            <p className="text-gray-400 mb-4">
              Create your first AI-powered training plan to crush your goals!
            </p>
            <Button 
              onClick={() => setShowGenerator(true)}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Generate Your First Plan
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            {plans.map((plan) => (
              <div key={plan.id} className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 backdrop-blur">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">{plan.name}</h2>
                    <p className="text-gray-400">Goal: {plan.goal_name}</p>
                    <p className="text-gray-400">
                      {new Date(plan.start_date).toLocaleDateString()} - {new Date(plan.end_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-purple-400">{plan.weeks_total}</div>
                    <div className="text-sm text-gray-400">weeks</div>
                  </div>
                </div>

                {/* Phases */}
                <div className="mb-6">
                  <h3 className="text-xl font-bold mb-4">Training Phases</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {plan.plan_data.phases.map((phase, idx) => (
                      <div key={idx} className="bg-gray-700/50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Zap className="text-purple-400" size={20} />
                          <h4 className="font-bold">{phase.name}</h4>
                        </div>
                        <p className="text-sm text-gray-400 mb-2">{phase.weeks} weeks</p>
                        <p className="text-sm">{phase.focus}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Weekly Structure Example (First Phase) */}
                {plan.plan_data.phases[0]?.weeklyStructure && (
                  <div className="mb-6">
                    <h3 className="text-xl font-bold mb-4">Sample Week Structure</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {daysOfWeek.map((day) => {
                        const workout = plan.plan_data.phases[0].weeklyStructure[day.toLowerCase()]
                        const isRestDay = workout?.toLowerCase().includes('rest') || workout?.toLowerCase().includes('off')
                        return (
                          <div 
                            key={day} 
                            className={`rounded-lg p-3 ${isRestDay ? 'bg-gray-700/30' : 'bg-purple-500/20 border border-purple-500/30'}`}
                          >
                            <div className="font-semibold mb-1">{day}</div>
                            <div className="text-sm text-gray-300">{workout || 'Rest'}</div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Key Workouts */}
                {plan.plan_data.keyWorkouts && plan.plan_data.keyWorkouts.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-xl font-bold mb-4">Key Workouts</h3>
                    <div className="space-y-2">
                      {plan.plan_data.keyWorkouts.map((workout, idx) => (
                        <div key={idx} className="flex items-start gap-3 bg-gray-700/30 rounded-lg p-3">
                          <CheckCircle2 className="text-green-400 flex-shrink-0 mt-1" size={20} />
                          <p className="text-sm">{workout}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Nutrition & Gear */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {plan.plan_data.nutritionGuidance && (
                    <div>
                      <h3 className="text-lg font-bold mb-3">Nutrition Strategy</h3>
                      <p className="text-sm text-gray-300">{plan.plan_data.nutritionGuidance}</p>
                    </div>
                  )}
                  {plan.plan_data.gearRecommendations && (
                    <div>
                      <h3 className="text-lg font-bold mb-3">Gear Recommendations</h3>
                      <p className="text-sm text-gray-300">{plan.plan_data.gearRecommendations}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}


