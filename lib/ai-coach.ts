import OpenAI from 'openai';

// Initialize OpenAI client lazily to avoid build-time errors
let openaiClient: OpenAI | null = null;

function getOpenAIClient() {
  if (!openaiClient) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
}

export interface RideData {
  name: string;
  date: string;
  distance: number; // meters
  movingTime: number; // seconds
  totalElevationGain: number; // meters
  averageSpeed: number; // m/s
  averageWatts?: number;
  normalizedPower?: number;
  averageHeartrate?: number;
  maxHeartrate?: number;
  tss?: number;
  intensityFactor?: number;
  variabilityIndex?: number;
  type: string; // 'Ride' or 'VirtualRide'
}

export interface TrainingContext {
  recentActivities: RideData[];
  goals?: {
    name: string;
    targetDate?: string;
    targetValue?: number;
  }[];
  ftp?: number;
  maxHR?: number;
  weeklyTSS?: number;
  ctl?: number; // fitness
  atl?: number; // fatigue
  tsb?: number; // form
}

/**
 * Generate AI analysis for a single ride
 */
export async function analyzeRide(ride: RideData, context?: TrainingContext): Promise<{
  analysis: string;
  feedback: string;
  recommendations: string[];
}> {
  const distanceKm = (ride.distance / 1000).toFixed(1);
  const durationHours = (ride.movingTime / 3600).toFixed(1);
  const avgSpeedMph = (ride.averageSpeed * 2.23694).toFixed(1);

  const systemPrompt = `You are an elite cycling coach analyzing ride data. Provide specific, actionable insights based on power, heart rate, and performance metrics. Be encouraging but honest. Focus on what matters for long-distance endurance riding.`;

  const userPrompt = `
Analyze this ride:
- Name: ${ride.name}
- Type: ${ride.type}
- Distance: ${distanceKm} km (${(ride.distance * 0.000621371).toFixed(1)} miles)
- Duration: ${durationHours} hours
- Average Speed: ${avgSpeedMph} mph
- Elevation Gain: ${ride.totalElevationGain}m
${ride.averageWatts ? `- Average Power: ${ride.averageWatts}W` : ''}
${ride.normalizedPower ? `- Normalized Power: ${ride.normalizedPower}W` : ''}
${ride.averageHeartrate ? `- Average HR: ${ride.averageHeartrate} bpm` : ''}
${ride.maxHeartrate ? `- Max HR: ${ride.maxHeartrate} bpm` : ''}
${ride.tss ? `- TSS: ${ride.tss}` : ''}
${ride.intensityFactor ? `- Intensity Factor: ${ride.intensityFactor.toFixed(2)}` : ''}
${ride.variabilityIndex ? `- Variability Index: ${ride.variabilityIndex.toFixed(2)}` : ''}

${context?.ftp ? `Rider FTP: ${context.ftp}W` : ''}
${context?.ctl ? `Current Fitness (CTL): ${context.ctl.toFixed(1)}` : ''}
${context?.atl ? `Current Fatigue (ATL): ${context.atl.toFixed(1)}` : ''}
${context?.tsb ? `Current Form (TSB): ${context.tsb.toFixed(1)}` : ''}

${context?.goals && context.goals.length > 0 ? `
Current Goals:
${context.goals.map(g => `- ${g.name}${g.targetDate ? ` (${g.targetDate})` : ''}`).join('\n')}
` : ''}

Provide:
1. A brief analysis of the ride quality and effort
2. Specific feedback on pacing, power distribution, or areas of concern
3. 2-3 concrete recommendations for improvement

Format as JSON:
{
  "analysis": "2-3 sentence overview",
  "feedback": "Specific observations about performance",
  "recommendations": ["rec 1", "rec 2", "rec 3"]
}
`;

  try {
    const completion = await getOpenAIClient().chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');
    return {
      analysis: result.analysis || 'Analysis unavailable',
      feedback: result.feedback || 'No specific feedback',
      recommendations: result.recommendations || []
    };
  } catch (error) {
    console.error('Error analyzing ride:', error);
    return {
      analysis: 'Unable to generate analysis at this time.',
      feedback: 'Please try again later.',
      recommendations: []
    };
  }
}

/**
 * Generate weekly training summary and insights
 */
export async function generateWeeklySummary(context: TrainingContext): Promise<string> {
  const totalDistance = context.recentActivities.reduce((sum, a) => sum + a.distance, 0);
  const totalTime = context.recentActivities.reduce((sum, a) => sum + a.movingTime, 0);
  const totalTSS = context.recentActivities.reduce((sum, a) => sum + (a.tss || 0), 0);

  const systemPrompt = `You are an elite cycling coach providing weekly training feedback. Be specific, data-driven, and motivating. Focus on trends and patterns.`;

  const userPrompt = `
Generate a weekly training summary for this cyclist:

This week's training:
- ${context.recentActivities.length} rides
- ${(totalDistance / 1000).toFixed(0)} km total
- ${(totalTime / 3600).toFixed(1)} hours total
- ${totalTSS.toFixed(0)} TSS

Current fitness metrics:
- CTL (Fitness): ${context.ctl?.toFixed(1) || 'N/A'}
- ATL (Fatigue): ${context.atl?.toFixed(1) || 'N/A'}
- TSB (Form): ${context.tsb?.toFixed(1) || 'N/A'}
- FTP: ${context.ftp || 'N/A'}W

${context.goals && context.goals.length > 0 ? `
Goals:
${context.goals.map(g => `- ${g.name}${g.targetDate ? ` (${g.targetDate})` : ''}`).join('\n')}
` : ''}

Provide a motivating summary covering:
1. What went well this week
2. Training load assessment
3. Specific focus for next week
4. Progress toward goals

Keep it under 200 words, be specific and actionable.
`;

  try {
    const completion = await getOpenAIClient().chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.8,
    });

    return completion.choices[0].message.content || 'Summary unavailable';
  } catch (error) {
    console.error('Error generating weekly summary:', error);
    return 'Unable to generate weekly summary at this time.';
  }
}

/**
 * Generate personalized STP training plan
 */
export async function generateSTPTrainingPlan(userProfile: {
  currentFTP?: number;
  recentWeeklyMileage?: number;
  longestRecentRide?: number;
  targetDate: string;
  currentAverageSpeed?: number;
}): Promise<any> {
  const systemPrompt = `You are an expert cycling coach specializing in ultra-endurance events. Create detailed, periodized training plans for Seattle to Portland (STP) - a 204-mile one-day ride. Focus on building endurance, maintaining speed over long distances, and proper periodization.`;

  const userPrompt = `
Create a detailed training plan for STP (Seattle to Portland, 204 miles in one day):

Current rider stats:
- FTP: ${userProfile.currentFTP || 'Unknown'}W
- Recent weekly mileage: ${userProfile.recentWeeklyMileage || 'Unknown'} miles
- Longest recent ride: ${userProfile.longestRecentRide || 'Unknown'} miles
- Current avg speed: ${userProfile.currentAverageSpeed || 'Unknown'} mph
- Target date: ${userProfile.targetDate}
- Target: 17+ mph average for 204 miles (12 hours)

Requirements:
1. Calculate weeks until event
2. Create periodized plan (Base -> Build -> Peak -> Taper)
3. Progressive overload for weekly volume
4. Specific workouts for each week
5. Include rest weeks every 3-4 weeks
6. Focus on:
   - Endurance (Zone 2) base
   - Tempo intervals for sustainable speed
   - Progressive long rides (building to 120+ miles)
   - Brick workouts (back-to-back long days)
   - Nutrition practice on long rides

Format as JSON with this structure:
{
  "totalWeeks": number,
  "phases": [
    {
      "name": "Base Building",
      "weeks": number,
      "focus": "description",
      "weeklyStructure": {
        "monday": "workout description",
        "tuesday": "workout description",
        ...
      }
    }
  ],
  "keyWorkouts": ["workout 1", "workout 2", ...],
  "nutritionGuidance": "string",
  "gearRecommendations": "string"
}
`;

  try {
    const completion = await getOpenAIClient().chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    return JSON.parse(completion.choices[0].message.content || '{}');
  } catch (error) {
    console.error('Error generating training plan:', error);
    return null;
  }
}

/**
 * Detect patterns and anomalies in training data
 */
export async function detectPatterns(activities: RideData[]): Promise<{
  patterns: string[];
  warnings: string[];
  opportunities: string[];
}> {
  const systemPrompt = `You are a cycling coach analyzing training patterns. Identify trends, potential issues, and opportunities for improvement based on ride data.`;

  // Calculate some basic stats
  const avgSpeed = activities.reduce((sum, a) => sum + a.averageSpeed, 0) / activities.length;
  const avgTSS = activities.filter(a => a.tss).reduce((sum, a) => sum + (a.tss || 0), 0) / activities.filter(a => a.tss).length;
  const totalRides = activities.length;

  const userPrompt = `
Analyze this training data for patterns:
- Total rides: ${totalRides}
- Average speed: ${(avgSpeed * 2.23694).toFixed(1)} mph
- Average TSS: ${avgTSS ? avgTSS.toFixed(0) : 'N/A'}

Recent rides:
${activities.slice(0, 10).map(a => `
- ${a.name}: ${(a.distance/1000).toFixed(0)}km, ${(a.movingTime/3600).toFixed(1)}h, ${(a.averageSpeed * 2.23694).toFixed(1)}mph${a.tss ? `, TSS: ${a.tss.toFixed(0)}` : ''}
`).join('')}

Identify:
1. Positive patterns to reinforce
2. Concerning patterns or potential overtraining/undertraining
3. Opportunities for improvement

Format as JSON:
{
  "patterns": ["pattern 1", "pattern 2"],
  "warnings": ["warning 1", "warning 2"],
  "opportunities": ["opportunity 1", "opportunity 2"]
}
`;

  try {
    const completion = await getOpenAIClient().chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    return JSON.parse(completion.choices[0].message.content || '{}');
  } catch (error) {
    console.error('Error detecting patterns:', error);
    return {
      patterns: [],
      warnings: [],
      opportunities: []
    };
  }
}

