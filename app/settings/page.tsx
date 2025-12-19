"use client"

import { useState, useEffect } from "react"
import { Nav } from "@/components/nav"
import { Button } from "@/components/ui/button"
import { Save, User, Activity, Heart, Scale } from "lucide-react"

interface UserSettings {
  ftp?: number
  maxHr?: number
  restingHr?: number
  weight?: number
  bikeWeight?: number
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    fetchSettings()
  }, [])

  async function fetchSettings() {
    try {
      const response = await fetch('/api/user/settings')
      if (response.ok) {
        const data = await response.json()
        setSettings(data)
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    } finally {
      setLoading(false)
    }
  }

  async function saveSettings(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      const response = await fetch('/api/user/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })

      if (!response.ok) {
        throw new Error('Failed to save settings')
      }

      setMessage({ type: 'success', text: '✅ Settings saved successfully! Refresh your dashboard to see updated metrics.' })
    } catch (error: any) {
      console.error('Error saving settings:', error)
      setMessage({ type: 'error', text: '❌ Failed to save settings. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-dark">
        <Nav />
        <main className="mx-auto max-w-4xl px-4 py-8">
          <div className="text-white text-center">Loading settings...</div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-dark text-white">
      <Nav />
      
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Settings</h1>
          <p className="text-gray-400">Update your athlete profile and training parameters</p>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg border ${
            message.type === 'success' 
              ? 'bg-green-500/10 border-green-500 text-green-200' 
              : 'bg-red-500/10 border-red-500 text-red-200'
          }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={saveSettings}>
          {/* Power Settings */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <Activity className="text-purple-400" size={24} />
              <h2 className="text-2xl font-bold">Power Metrics</h2>
            </div>
            <p className="text-gray-400 text-sm mb-6">
              Your FTP (Functional Threshold Power) is used to calculate Training Stress Score (TSS) and intensity metrics.
            </p>

            <div>
              <label className="block text-sm font-medium mb-2">
                FTP (Functional Threshold Power)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={settings.ftp || ''}
                  onChange={(e) => setSettings({...settings, ftp: e.target.value ? Number(e.target.value) : undefined})}
                  placeholder="225"
                  className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:border-purple-500 focus:outline-none"
                />
                <span className="text-gray-400 font-medium">watts</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                💡 Don't know your FTP? Do a 20-minute all-out test and multiply by 0.95, or use your best 20-min power from a recent ride.
              </p>
            </div>
          </div>

          {/* Heart Rate Settings */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <Heart className="text-red-400" size={24} />
              <h2 className="text-2xl font-bold">Heart Rate Zones</h2>
            </div>
            <p className="text-gray-400 text-sm mb-6">
              Heart rate metrics help calculate training zones and intensity.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Maximum Heart Rate
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={settings.maxHr || ''}
                    onChange={(e) => setSettings({...settings, maxHr: e.target.value ? Number(e.target.value) : undefined})}
                    placeholder="185"
                    className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:border-purple-500 focus:outline-none"
                  />
                  <span className="text-gray-400 font-medium">bpm</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  💡 Use the highest heart rate you've seen in recent hard efforts, or estimate: 220 - age
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Resting Heart Rate
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={settings.restingHr || ''}
                    onChange={(e) => setSettings({...settings, restingHr: e.target.value ? Number(e.target.value) : undefined})}
                    placeholder="60"
                    className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:border-purple-500 focus:outline-none"
                  />
                  <span className="text-gray-400 font-medium">bpm</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  💡 Measure first thing in the morning before getting out of bed
                </p>
              </div>
            </div>
          </div>

          {/* Weight Settings */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <Scale className="text-blue-400" size={24} />
              <h2 className="text-2xl font-bold">Weight & Equipment</h2>
            </div>
            <p className="text-gray-400 text-sm mb-6">
              Weight data helps calculate power-to-weight ratio and climbing performance.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Body Weight
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    step="0.1"
                    value={settings.weight || ''}
                    onChange={(e) => setSettings({...settings, weight: e.target.value ? Number(e.target.value) : undefined})}
                    placeholder="75"
                    className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:border-purple-500 focus:outline-none"
                  />
                  <span className="text-gray-400 font-medium">kg</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Bike Weight
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    step="0.1"
                    value={settings.bikeWeight || ''}
                    onChange={(e) => setSettings({...settings, bikeWeight: e.target.value ? Number(e.target.value) : undefined})}
                    placeholder="8"
                    className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:border-purple-500 focus:outline-none"
                  />
                  <span className="text-gray-400 font-medium">kg</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  💡 Typical road bikes: 7-10 kg
                </p>
              </div>
            </div>
          </div>

          {/* Calculated Metrics */}
          {settings.ftp && settings.weight && (
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-6 mb-6">
              <h3 className="font-bold text-lg mb-3">📊 Your Metrics</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-2xl font-bold text-purple-400">
                    {(settings.ftp / settings.weight).toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-400">W/kg (Power-to-Weight)</div>
                </div>
                {settings.maxHr && settings.restingHr && (
                  <div>
                    <div className="text-2xl font-bold text-red-400">
                      {settings.maxHr - settings.restingHr}
                    </div>
                    <div className="text-sm text-gray-400">HR Reserve</div>
                  </div>
                )}
                {settings.bikeWeight && (
                  <div>
                    <div className="text-2xl font-bold text-blue-400">
                      {(settings.weight + settings.bikeWeight).toFixed(1)}
                    </div>
                    <div className="text-sm text-gray-400">kg Total Weight</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="flex gap-4">
            <Button
              type="submit"
              disabled={saving}
              className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
            >
              <Save size={20} />
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </form>

        {/* Info Box */}
        <div className="mt-8 bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <h3 className="font-bold mb-2">ℹ️ Why These Settings Matter</h3>
          <ul className="text-sm text-gray-400 space-y-2">
            <li>• <strong>FTP</strong> enables TSS calculations, which track training load and fitness progression</li>
            <li>• <strong>Max HR</strong> helps determine your heart rate training zones</li>
            <li>• <strong>Weight</strong> calculates power-to-weight ratio, crucial for climbing performance</li>
            <li>• All metrics are private and only used for your personal analytics</li>
          </ul>
        </div>
      </main>
    </div>
  )
}

