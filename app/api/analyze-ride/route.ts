import { NextResponse } from "next/server"
import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: Request) {
  try {
    const { ride, goal } = await request.json()

    const prompt = `
      Analyze the following cycling activity and provide personalized advice:
      - Distance: ${(ride.distance / 1000).toFixed(2)} km
      - Duration: ${Math.floor(ride.moving_time / 60)} minutes
      - Elevation Gain: ${ride.total_elevation_gain} meters
      - Average Speed: ${(ride.average_speed * 3.6).toFixed(2)} km/h
      - Max Speed: ${(ride.max_speed * 3.6).toFixed(2)} km/h
      ${ride.average_watts ? `- Average Power: ${ride.average_watts} watts` : ""}
      ${ride.average_heartrate ? `- Average Heart Rate: ${ride.average_heartrate} bpm` : ""}
      ${ride.max_heartrate ? `- Max Heart Rate: ${ride.max_heartrate} bpm` : ""}

      The cyclist's current goal is: ${goal}

      Provide advice on:
      1. Performance analysis in relation to the cyclist's goal
      2. Areas for improvement to achieve the goal
      3. Suggested training focus for the next week, tailored to the goal
      4. Recovery recommendations
    `

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
    })

    return NextResponse.json({
      analysis: completion.choices[0].message.content,
    })
  } catch (error) {
    console.error("Error generating analysis:", error)
    return NextResponse.json({ error: "Failed to generate analysis" }, { status: 500 })
  }
}

