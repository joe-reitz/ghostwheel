import { NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

const metersToMiles = (meters: number) => (meters * 0.000621371).toFixed(2)
const metersToFeet = (meters: number) => Math.round(meters * 3.28084)
const mpsToMph = (mps: number) => (mps * 2.23694).toFixed(1)

export async function POST(request: Request) {
  try {
    const { activity } = await request.json()
    console.log("Received activity data for analysis:", JSON.stringify(activity, null, 2))

    // Calculate additional metrics for better analysis
    const avgPower = activity.average_watts || activity.weighted_average_watts || 0
    const powerToWeight = avgPower / 70 // Assuming 70kg rider weight
    const intensityFactor = avgPower / 250 // Assuming 250W FTP
    const tss = (activity.moving_time / 3600) * intensityFactor * intensityFactor * 100 // Training Stress Score

    const prompt = `
    You are an elite cycling coach with decades of experience training professional cyclists. Analyze this ride with the precision and insight of a world-class performance analyst. Be direct, motivational, and technically accurate.

    RIDE DATA:
    Activity: ${activity.name}
    Type: ${activity.type}
    Date: ${new Date(activity.start_date).toLocaleDateString()}
    Distance: ${metersToMiles(activity.distance)} miles
    Duration: ${Math.floor(activity.moving_time / 60)} minutes (${(activity.moving_time / 3600).toFixed(1)} hours)
    Elevation Gain: ${metersToFeet(activity.total_elevation_gain)} feet
    Average Speed: ${mpsToMph(activity.average_speed)} mph
    Max Speed: ${mpsToMph(activity.max_speed)} mph
    ${avgPower > 0 ? `Average Power: ${Math.round(avgPower)} watts` : ""}
    ${activity.weighted_average_watts ? `Weighted Average Power: ${Math.round(activity.weighted_average_watts)} watts` : ""}
    ${avgPower > 0 ? `Power-to-Weight: ${powerToWeight.toFixed(2)} W/kg` : ""}
    ${avgPower > 0 ? `Intensity Factor: ${intensityFactor.toFixed(2)}` : ""}
    ${avgPower > 0 ? `Estimated TSS: ${Math.round(tss)}` : ""}
    ${activity.kilojoules ? `Total Work: ${Math.round(activity.kilojoules)} kJ` : ""}
    ${activity.average_heartrate ? `Average Heart Rate: ${Math.round(activity.average_heartrate)} bpm` : ""}
    ${activity.max_heartrate ? `Max Heart Rate: ${Math.round(activity.max_heartrate)} bpm` : ""}
    ${activity.average_cadence ? `Average Cadence: ${Math.round(activity.average_cadence)} rpm` : ""}
    ${activity.suffer_score ? `Relative Effort: ${activity.suffer_score}` : ""}

    PROVIDE A COMPREHENSIVE ANALYSIS (200 WORDS MAX) COVERING:

    ## 🎯 Performance Highlights
    - What you executed well (be specific about power, pacing, or technique)
    - Key strengths demonstrated in this ride

    ## 📊 Technical Analysis  
    - Power distribution and pacing strategy assessment
    - Heart rate response and aerobic efficiency
    - Cadence and pedaling efficiency notes

    ## 🚀 Next Training Focus
    - Specific workout recommendation for next session
    - Training zone targets based on this ride's data
    - Recovery considerations

    Use cycling-specific terminology. Be encouraging but demanding of excellence. Format with markdown headers and bullet points. Make each analysis unique based on the specific data provided.
    `

    console.log("Generating analysis with prompt:", prompt)
    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt: prompt,
      temperature: 0.7,
    })
    console.log("Generated analysis:", text)

    return NextResponse.json({ analysis: text })
  } catch (error) {
    console.error("Error in /api/analyze:", error)
    return NextResponse.json(
      { error: "Failed to generate analysis", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
