"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface TrainingPlan {
  weeklyPlan: string[]
  longTermGoals: string[]
  keyWorkouts: string[]
}

interface StravaData {
  activities: Array<{
    id: number
    name: string
    distance: number
  }>
}

export function TrainingPlan({ goal, stravaData }: { goal: string; stravaData: StravaData }) {
  const [plan, setPlan] = useState<TrainingPlan | null>(null)

  useEffect(() => {
    const generatePlan = async () => {
      // In a real application, this would be an API call to your AI model
      const response = await fetch("/api/generate-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ goal, stravaData }),
      })
      const data = await response.json()
      setPlan(data)
    }

    if (goal && stravaData) {
      generatePlan()
    }
  }, [goal, stravaData])

  if (!plan) {
    return <div>Generating your personalized training plan...</div>
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Your Personalized Training Plan</CardTitle>
        </CardHeader>
        <CardContent>
          <h3 className="text-lg font-semibold mb-2">Weekly Plan</h3>
          <ul className="list-disc pl-5 mb-4">
            {plan.weeklyPlan.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
          <h3 className="text-lg font-semibold mb-2">Long-term Goals</h3>
          <ul className="list-disc pl-5 mb-4">
            {plan.longTermGoals.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
          <h3 className="text-lg font-semibold mb-2">Key Workouts</h3>
          <ul className="list-disc pl-5">
            {plan.keyWorkouts.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

