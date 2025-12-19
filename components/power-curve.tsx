"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts'

interface PowerCurveProps {
  powerCurve: Map<number, number>
  ftp?: number
  title?: string
}

export function PowerCurve({ powerCurve, ftp, title = "Power Curve (Personal Records)" }: PowerCurveProps) {
  // Convert Map to array and format for chart
  const data = Array.from(powerCurve.entries())
    .map(([duration, power]) => ({
      duration,
      durationLabel: formatDuration(duration),
      power,
      ftpLine: ftp || 0
    }))
    .sort((a, b) => a.duration - b.duration)

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 backdrop-blur">
      <h3 className="text-xl font-bold mb-4">{title}</h3>
      
      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis 
            dataKey="durationLabel" 
            stroke="#9CA3AF"
            label={{ value: 'Duration', position: 'insideBottom', offset: -5 }}
          />
          <YAxis 
            stroke="#9CA3AF"
            label={{ value: 'Power (watts)', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
            labelStyle={{ color: '#F3F4F6' }}
            formatter={(value: number | undefined) => value ? [`${value}W`, 'Power'] : ['', 'Power']}
          />
          <Legend />
          
          {ftp && (
            <ReferenceLine 
              y={ftp} 
              stroke="#8B5CF6" 
              strokeDasharray="3 3" 
              label={{ value: `FTP: ${ftp}W`, fill: '#8B5CF6', position: 'right' }}
            />
          )}
          
          <Line 
            type="monotone" 
            dataKey="power" 
            stroke="#F59E0B" 
            strokeWidth={3}
            dot={{ fill: '#F59E0B', r: 4 }}
            activeDot={{ r: 6 }}
            name="Best Power"
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Power Duration Table */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {[5, 60, 300, 1200, 1800, 3600].map((duration) => {
          const power = powerCurve.get(duration)
          if (!power) return null
          
          const wattsPerKg = ftp ? (power / (ftp / 4.0)).toFixed(1) : null // Rough estimate
          
          return (
            <div key={duration} className="bg-gray-700/50 rounded-lg p-3 text-center">
              <div className="text-xs text-gray-400 mb-1">{formatDuration(duration)}</div>
              <div className="text-2xl font-bold text-orange-400">{power}W</div>
              {wattsPerKg && (
                <div className="text-xs text-gray-500 mt-1">{wattsPerKg} W/kg</div>
              )}
            </div>
          )
        })}
      </div>

      {/* Performance Benchmarks */}
      <div className="mt-6 p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
        <h4 className="font-semibold mb-2 text-purple-300">💡 Performance Insights</h4>
        <div className="text-sm text-gray-300 space-y-1">
          {getPerformanceInsights(powerCurve, ftp).map((insight, idx) => (
            <div key={idx}>• {insight}</div>
          ))}
        </div>
      </div>
    </div>
  )
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  return minutes > 0 ? `${hours}h${minutes}m` : `${hours}h`
}

function getPerformanceInsights(powerCurve: Map<number, number>, ftp?: number): string[] {
  const insights: string[] = []
  
  const power5s = powerCurve.get(5)
  const power1min = powerCurve.get(60)
  const power5min = powerCurve.get(300)
  const power20min = powerCurve.get(1200)
  
  if (power5s && power5min) {
    const ratio = power5s / power5min
    if (ratio > 2.0) {
      insights.push("Strong sprint power - you're a natural sprinter!")
    } else if (ratio < 1.5) {
      insights.push("More endurance-focused - great for long distances")
    }
  }
  
  if (power20min && ftp) {
    const estimatedFTP = power20min * 0.95
    if (estimatedFTP > ftp * 1.05) {
      insights.push(`Your 20-min power suggests FTP could be ~${Math.round(estimatedFTP)}W`)
    }
  }
  
  if (power1min && power5min) {
    const ratio = power5min / power1min
    if (ratio > 0.85) {
      insights.push("Excellent sustained power - VO2 max intervals are your strength")
    }
  }
  
  if (insights.length === 0) {
    insights.push("Keep training to see personalized insights!")
  }
  
  return insights
}

