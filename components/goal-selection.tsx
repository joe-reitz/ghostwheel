"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

const goals = [
  { id: "endurance", label: "Improve Endurance" },
  { id: "ftp", label: "Increase FTP" },
  { id: "sprint", label: "Enhance Sprint Power" },
  { id: "climbing", label: "Better Climbing" },
  { id: "weight-loss", label: "Weight Loss" },
]

export function GoalSelection({ onGoalSelected }: { onGoalSelected: (goal: string) => void }) {
  const [selectedGoal, setSelectedGoal] = useState<string>("")

  const handleGoalSubmit = () => {
    if (selectedGoal) {
      onGoalSelected(selectedGoal)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Select Your Primary Goal</CardTitle>
      </CardHeader>
      <CardContent>
        <RadioGroup onValueChange={setSelectedGoal} className="space-y-2">
          {goals.map((goal) => (
            <div key={goal.id} className="flex items-center space-x-2">
              <RadioGroupItem value={goal.id} id={goal.id} />
              <Label htmlFor={goal.id}>{goal.label}</Label>
            </div>
          ))}
        </RadioGroup>
        <Button onClick={handleGoalSubmit} className="mt-4">
          Generate Training Plan
        </Button>
      </CardContent>
    </Card>
  )
}

