"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Nav } from "@/components/nav"
import { Bike, Plus, RefreshCw, ChevronRight, Mountain, Activity } from "lucide-react"

interface BikeData {
  id: number
  name: string
  brand?: string
  model?: string
  bike_type: string
  weight?: number
  is_active: boolean
  total_distance: number
  ride_count: number
  total_elevation: number
  strava_gear_id?: string
}

export default function BikesPage() {
  const router = useRouter()
  const [bikes, setBikes] = useState<BikeData[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newBike, setNewBike] = useState({ name: '', brand: '', model: '', bikeType: 'road', weight: '' })

  useEffect(() => {
    fetchBikes()
  }, [])

  async function fetchBikes() {
    try {
      setError(null)
      const res = await fetch('/api/bikes')
      if (res.ok) {
        const data = await res.json()
        setBikes(data)
      } else {
        const data = await res.json().catch(() => ({}))
        const msg = data.error || `Failed to load bikes (${res.status})`
        // If the table doesn't exist, try running the migration
        if (msg.includes('does not exist') || msg.includes('relation')) {
          console.log('Bikes table missing, running migration...')
          const setupRes = await fetch('/api/setup-bikes-db')
          if (setupRes.ok) {
            // Retry after migration
            const retryRes = await fetch('/api/bikes')
            if (retryRes.ok) {
              setBikes(await retryRes.json())
              return
            }
          }
        }
        setError(msg)
      }
    } catch (e) {
      setError('Failed to connect to server')
      console.error('Error fetching bikes:', e)
    } finally {
      setLoading(false)
    }
  }

  async function syncFromStrava() {
    setSyncing(true)
    setError(null)
    try {
      const res = await fetch('/api/bikes/sync', { method: 'POST' })
      if (res.ok) {
        await fetchBikes()
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.error || `Sync failed (${res.status})`)
      }
    } catch (e) {
      setError('Failed to sync from Strava')
      console.error('Error syncing bikes:', e)
    } finally {
      setSyncing(false)
    }
  }

  async function addBike() {
    if (!newBike.name.trim()) return
    setError(null)
    try {
      const res = await fetch('/api/bikes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newBike.name,
          brand: newBike.brand || undefined,
          model: newBike.model || undefined,
          bikeType: newBike.bikeType,
          weight: newBike.weight ? Number(newBike.weight) / 2.20462 : undefined,
        })
      })
      if (res.ok) {
        setNewBike({ name: '', brand: '', model: '', bikeType: 'road', weight: '' })
        setShowAddForm(false)
        await fetchBikes()
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.error || `Failed to add bike (${res.status})`)
      }
    } catch (e) {
      setError('Failed to add bike')
      console.error('Error adding bike:', e)
    }
  }

  const bikeTypeLabels: Record<string, string> = {
    road: 'Road',
    gravel: 'Gravel',
    mountain: 'Mountain',
    tt: 'Time Trial',
    track: 'Track',
    cx: 'Cyclocross',
    hybrid: 'Hybrid',
  }

  const bikeTypeColors: Record<string, string> = {
    road: 'from-purple-500/20 to-purple-700/20 border-purple-500/30',
    gravel: 'from-amber-500/20 to-amber-700/20 border-amber-500/30',
    mountain: 'from-green-500/20 to-green-700/20 border-green-500/30',
    tt: 'from-blue-500/20 to-blue-700/20 border-blue-500/30',
    track: 'from-red-500/20 to-red-700/20 border-red-500/30',
    cx: 'from-orange-500/20 to-orange-700/20 border-orange-500/30',
    hybrid: 'from-gray-500/20 to-gray-700/20 border-gray-500/30',
  }

  return (
    <div className="min-h-screen bg-gradient-dark text-white">
      <Nav />

      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">My Bikes</h1>
            <p className="text-gray-400">Manage your fleet and track component lifecycle</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={syncFromStrava}
              disabled={syncing}
              className="bg-[#FC4C02] hover:bg-[#e04400] disabled:opacity-50 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
              {syncing ? 'Syncing...' : 'Sync from Strava'}
            </button>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Plus size={16} />
              Add Bike
            </button>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6 flex items-center justify-between">
            <p className="text-red-400 text-sm">{error}</p>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300 text-sm ml-4">Dismiss</button>
          </div>
        )}

        {/* Add Bike Form */}
        {showAddForm && (
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-bold mb-4">Add New Bike</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Name *</label>
                <input
                  type="text"
                  value={newBike.name}
                  onChange={e => setNewBike({...newBike, name: e.target.value})}
                  placeholder="My Road Bike"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 focus:border-purple-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Brand</label>
                <input
                  type="text"
                  value={newBike.brand}
                  onChange={e => setNewBike({...newBike, brand: e.target.value})}
                  placeholder="Specialized"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 focus:border-purple-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Model</label>
                <input
                  type="text"
                  value={newBike.model}
                  onChange={e => setNewBike({...newBike, model: e.target.value})}
                  placeholder="Tarmac SL7"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 focus:border-purple-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Type</label>
                <select
                  value={newBike.bikeType}
                  onChange={e => setNewBike({...newBike, bikeType: e.target.value})}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 focus:border-purple-500 focus:outline-none"
                >
                  {Object.entries(bikeTypeLabels).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Weight (lbs)</label>
                <input
                  type="number"
                  value={newBike.weight}
                  onChange={e => setNewBike({...newBike, weight: e.target.value})}
                  placeholder="18"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={addBike}
                disabled={!newBike.name.trim()}
                className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 px-4 py-2 rounded-lg text-sm transition-colors"
              >
                Add Bike
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading bikes...</div>
        ) : bikes.length === 0 ? (
          <div className="text-center py-16">
            <Bike size={64} className="text-gray-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">No bikes yet</h2>
            <p className="text-gray-400 mb-6">Sync your bikes from Strava or add them manually</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bikes.map(bike => (
              <button
                key={bike.id}
                onClick={() => router.push(`/bikes/${bike.id}`)}
                className={`bg-gradient-to-br ${bikeTypeColors[bike.bike_type] || bikeTypeColors.road} border rounded-xl p-6 text-left hover:scale-[1.02] transition-all group`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold">{bike.name}</h3>
                    {(bike.brand || bike.model) && (
                      <p className="text-sm text-gray-400 mt-1">
                        {[bike.brand, bike.model].filter(Boolean).join(' ')}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-gray-800/50 px-2 py-1 rounded uppercase">
                      {bikeTypeLabels[bike.bike_type] || bike.bike_type}
                    </span>
                    <ChevronRight size={20} className="text-gray-500 group-hover:text-white transition-colors" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-2xl font-bold">
                      {(Number(bike.total_distance) * 0.000621371).toFixed(0)}
                    </div>
                    <div className="text-xs text-gray-400 flex items-center gap-1">
                      <Activity size={12} />
                      miles
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{bike.ride_count}</div>
                    <div className="text-xs text-gray-400">rides</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">
                      {(Number(bike.total_elevation) * 3.28084).toFixed(0)}
                    </div>
                    <div className="text-xs text-gray-400 flex items-center gap-1">
                      <Mountain size={12} />
                      ft
                    </div>
                  </div>
                </div>

                {bike.weight && (
                  <div className="text-xs text-gray-500 mt-4">
                    {(Number(bike.weight) * 2.20462).toFixed(1)} lbs
                  </div>
                )}

                {!bike.is_active && (
                  <div className="text-xs text-red-400 mt-2">Retired</div>
                )}
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
