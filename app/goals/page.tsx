"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { toast } from "@/components/ui/use-toast"

const goals = [
  { id: "ftp", label: "Improve FTP" },
  { id: "endurance", label: "Increase Endurance" },
  { id: "climbing", label: "Better Climbing" },
  { id: "sprint", label: "Enhance Sprint Power" },
  { id: "weight", label: "Weight Management" },
]

export default function GoalsPage() {
  const [selectedGoal, setSelectedGoal] = useState("")
  const [customGoal, setCustomGoal] = useState("")

  useEffect(() => {
    const storedGoal = localStorage.getItem("cyclingGoal")
    if (storedGoal) {
      setSelectedGoal(storedGoal)
    }
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const goal = selectedGoal === "custom" ? customGoal : selectedGoal
    localStorage.setItem("cyclingGoal", goal)
    console.log("Submitted goal:", goal)
    toast({
      title: "Goal Updated",
      description: `Your new cycling goal has been set: ${goal}`,
    })
  }

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Set Your Cycling Goal</CardTitle>
          <CardDescription>Choose a goal to focus your training efforts</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent>
            <RadioGroup onValueChange={setSelectedGoal} value={selectedGoal}>
              {goals.map((goal) => (
                <div key={goal.id} className="flex items-center space-x-2">
                  <RadioGroupItem value={goal.id} id={goal.id} />
                  <Label htmlFor={goal.id}>{goal.label}</Label>
                </div>
              ))}
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="custom" id="custom" />
                <Label htmlFor="custom">Custom Goal</Label>
              </div>
            </RadioGroup>
            {selectedGoal === "custom" && (
              <div className="mt-4">
                <Label htmlFor="customGoal">Enter your custom goal:</Label>
                <Input
                  id="customGoal"
                  value={customGoal}
                  onChange={(e) => setCustomGoal(e.target.value)}
                  placeholder="e.g., Complete a century ride"
                />
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button type="submit">Set Goal</Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

