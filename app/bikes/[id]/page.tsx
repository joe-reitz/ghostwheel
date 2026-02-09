"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Nav } from "@/components/nav"
import { ArrowLeft, Plus, Trash2, ArrowRightLeft, Settings, Activity, Mountain } from "lucide-react"

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
  notes?: string
}

interface ComponentData {
  id: number
  component_type: string
  brand?: string
  model?: string
  install_date: string
  install_distance: number
  current_distance: number
  expected_lifetime_distance?: number
  expected_lifetime_days?: number
  status: string
  notes?: string
  install_activity_name?: string
}

interface BikeActivity {
  id: number
  name: string
  start_date: string
  distance: number
}

const COMPONENT_OPTIONS = [
  { id: 'chain', name: 'Chain', defaultMiles: 2000 },
  { id: 'cassette', name: 'Cassette', defaultMiles: 5000 },
  { id: 'chainrings', name: 'Chainrings', defaultMiles: 10000 },
  { id: 'rear_derailleur', name: 'Rear Derailleur', defaultMiles: 15000 },
  { id: 'tires_front', name: 'Front Tire', defaultMiles: 3500 },
  { id: 'tires_rear', name: 'Rear Tire', defaultMiles: 3000 },
  { id: 'brake_pads', name: 'Brake Pads', defaultMiles: 1000 },
  { id: 'bar_tape', name: 'Bar Tape', defaultMiles: 5000 },
  { id: 'chain_wax', name: 'Chain Wax', defaultMiles: 200 },
  { id: 'chain_lube', name: 'Chain Lube', defaultMiles: 100 },
  { id: 'cables', name: 'Cables & Housing', defaultMiles: 5000 },
  { id: 'wheels', name: 'Wheels', defaultMiles: 20000 },
  { id: 'bottom_bracket', name: 'Bottom Bracket', defaultMiles: 10000 },
  { id: 'headset', name: 'Headset Bearings', defaultMiles: 15000 },
  { id: 'hub_bearings', name: 'Hub Bearings', defaultMiles: 15000 },
]

const MI_TO_M = 1609.34

export default function BikeDetailPage() {
  const router = useRouter()
  const params = useParams()
  const bikeId = params.id as string

  const [bike, setBike] = useState<BikeData | null>(null)
  const [components, setComponents] = useState<ComponentData[]>([])
  const [allBikes, setAllBikes] = useState<BikeData[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddComponent, setShowAddComponent] = useState(false)
  const [bikeActivities, setBikeActivities] = useState<BikeActivity[]>([])
  const [newComp, setNewComp] = useState({ componentType: 'chain', brand: '', model: '', notes: '', installActivityId: '' })
  const [moveTarget, setMoveTarget] = useState<{ componentId: number; show: boolean }>({ componentId: 0, show: false })
  const [retireTarget, setRetireTarget] = useState<{ componentId: number; show: boolean; reason: string }>({ componentId: 0, show: false, reason: '' })

  useEffect(() => {
    fetchBike()
    fetchComponents()
    fetchAllBikes()
  }, [bikeId])

  async function fetchBike() {
    try {
      const res = await fetch(`/api/bikes/${bikeId}`)
      if (res.ok) setBike(await res.json())
    } catch (e) {
      console.error('Error fetching bike:', e)
    } finally {
      setLoading(false)
    }
  }

  async function fetchComponents() {
    try {
      const res = await fetch(`/api/bikes/${bikeId}/components`)
      if (res.ok) setComponents(await res.json())
    } catch (e) {
      console.error('Error fetching components:', e)
    }
  }

  async function fetchAllBikes() {
    try {
      const res = await fetch('/api/bikes')
      if (res.ok) setAllBikes(await res.json())
    } catch (e) {
      console.error('Error fetching bikes:', e)
    }
  }

  async function fetchBikeActivities() {
    try {
      const res = await fetch(`/api/bikes/${bikeId}/activities`)
      if (res.ok) setBikeActivities(await res.json())
    } catch (e) {
      console.error('Error fetching bike activities:', e)
    }
  }

  async function addComponent() {
    if (!newComp.componentType) return
    const option = COMPONENT_OPTIONS.find(o => o.id === newComp.componentType)
    try {
      const res = await fetch(`/api/bikes/${bikeId}/components`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          componentType: newComp.componentType,
          brand: newComp.brand || undefined,
          model: newComp.model || undefined,
          notes: newComp.notes || undefined,
          expectedLifetimeDistance: option ? option.defaultMiles * MI_TO_M : undefined,
          installActivityId: newComp.installActivityId ? Number(newComp.installActivityId) : undefined,
        })
      })
      if (res.ok) {
        setShowAddComponent(false)
        setNewComp({ componentType: 'chain', brand: '', model: '', notes: '', installActivityId: '' })
        await fetchComponents()
      }
    } catch (e) {
      console.error('Error adding component:', e)
    }
  }

  async function handleMove(componentId: number, toBikeId: number) {
    try {
      await fetch(`/api/bikes/${bikeId}/components/${componentId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'move',
          toBikeId,
          distanceAtEvent: bike?.total_distance || 0
        })
      })
      setMoveTarget({ componentId: 0, show: false })
      await fetchComponents()
    } catch (e) {
      console.error('Error moving component:', e)
    }
  }

  async function handleRetire(componentId: number) {
    try {
      await fetch(`/api/bikes/${bikeId}/components/${componentId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'retire',
          reason: retireTarget.reason || 'Worn out',
          distanceAtEvent: bike?.total_distance || 0
        })
      })
      setRetireTarget({ componentId: 0, show: false, reason: '' })
      await fetchComponents()
    } catch (e) {
      console.error('Error retiring component:', e)
    }
  }

  function getComponentPercentRemaining(comp: ComponentData) {
    if (!comp.expected_lifetime_distance) return null
    const bikeDistAtInstall = Number(comp.install_distance)
    const bikeDistNow = Number(bike?.total_distance || 0)
    const distOnComponent = bikeDistNow - bikeDistAtInstall
    const lifetime = Number(comp.expected_lifetime_distance)
    const pct = Math.max(0, Math.min(100, ((lifetime - distOnComponent) / lifetime) * 100))
    return pct
  }

  function getComponentMilesUsed(comp: ComponentData) {
    const bikeDistAtInstall = Number(comp.install_distance)
    const bikeDistNow = Number(bike?.total_distance || 0)
    return (bikeDistNow - bikeDistAtInstall) * 0.000621371
  }

  function getComponentName(typeId: string) {
    return COMPONENT_OPTIONS.find(o => o.id === typeId)?.name || typeId
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-dark">
        <Nav />
        <main className="mx-auto max-w-6xl px-4 py-8">
          <div className="text-center text-white py-12">Loading bike details...</div>
        </main>
      </div>
    )
  }

  if (!bike) {
    return (
      <div className="min-h-screen bg-gradient-dark">
        <Nav />
        <main className="mx-auto max-w-6xl px-4 py-8">
          <div className="text-center text-white py-12">Bike not found</div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-dark text-white">
      <Nav />

      <main className="mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/bikes')}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Bikes
          </button>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold mb-1">{bike.name}</h1>
              {(bike.brand || bike.model) && (
                <p className="text-lg text-gray-400">
                  {[bike.brand, bike.model].filter(Boolean).join(' ')}
                </p>
              )}
            </div>
            <span className="text-sm bg-gray-800 px-3 py-1 rounded-lg uppercase">
              {bike.bike_type}
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
            <Activity className="text-purple-400 mb-2" size={20} />
            <div className="text-3xl font-bold">{(Number(bike.total_distance) * 0.000621371).toFixed(0)}</div>
            <div className="text-sm text-gray-400">miles</div>
          </div>
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
            <div className="text-purple-400 mb-2 text-lg font-bold">#</div>
            <div className="text-3xl font-bold">{bike.ride_count}</div>
            <div className="text-sm text-gray-400">rides</div>
          </div>
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
            <Mountain className="text-purple-400 mb-2" size={20} />
            <div className="text-3xl font-bold">{(Number(bike.total_elevation) * 3.28084).toFixed(0)}</div>
            <div className="text-sm text-gray-400">ft climbed</div>
          </div>
          {bike.weight && (
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
              <Settings className="text-purple-400 mb-2" size={20} />
              <div className="text-3xl font-bold">{(Number(bike.weight) * 2.20462).toFixed(1)}</div>
              <div className="text-sm text-gray-400">lbs</div>
            </div>
          )}
        </div>

        {/* Components */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Components</h2>
            <button
              onClick={() => {
                const next = !showAddComponent
                setShowAddComponent(next)
                if (next && bikeActivities.length === 0) fetchBikeActivities()
              }}
              className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition-colors"
            >
              <Plus size={14} />
              Add Component
            </button>
          </div>

          {/* Add Component Form */}
          {showAddComponent && (
            <div className="bg-gray-700/50 rounded-lg p-4 mb-6 border border-gray-600">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Type</label>
                  <select
                    value={newComp.componentType}
                    onChange={e => setNewComp({...newComp, componentType: e.target.value})}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 focus:border-purple-500 focus:outline-none"
                  >
                    {COMPONENT_OPTIONS.map(o => (
                      <option key={o.id} value={o.id}>{o.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Brand</label>
                  <input
                    type="text"
                    value={newComp.brand}
                    onChange={e => setNewComp({...newComp, brand: e.target.value})}
                    placeholder="Shimano"
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 focus:border-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Model</label>
                  <input
                    type="text"
                    value={newComp.model}
                    onChange={e => setNewComp({...newComp, model: e.target.value})}
                    placeholder="Ultegra"
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 focus:border-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Notes</label>
                  <input
                    type="text"
                    value={newComp.notes}
                    onChange={e => setNewComp({...newComp, notes: e.target.value})}
                    placeholder="Optional notes"
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-1">Track From</label>
                <select
                  value={newComp.installActivityId}
                  onChange={e => setNewComp({...newComp, installActivityId: e.target.value})}
                  className="w-full md:w-1/2 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 focus:border-purple-500 focus:outline-none"
                >
                  <option value="">All Time (default)</option>
                  {bikeActivities.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.name} — {new Date(a.start_date).toLocaleDateString()} ({(Number(a.distance) * 0.000621371).toFixed(1)} mi)
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Choose a ride to start tracking mileage from that point, or leave as All Time.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={addComponent}
                  className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  Add
                </button>
                <button
                  onClick={() => setShowAddComponent(false)}
                  className="text-gray-400 hover:text-white px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Component List */}
          {components.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No components tracked yet. Add your first component above.</p>
          ) : (
            <div className="space-y-4">
              {components.map(comp => {
                const pctRemaining = getComponentPercentRemaining(comp)
                const milesUsed = getComponentMilesUsed(comp)
                const lifetimeMiles = comp.expected_lifetime_distance
                  ? Number(comp.expected_lifetime_distance) * 0.000621371
                  : null

                return (
                  <div key={comp.id} className="bg-gray-700/30 border border-gray-700 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-bold">{getComponentName(comp.component_type)}</h4>
                        {(comp.brand || comp.model) && (
                          <p className="text-sm text-gray-400">
                            {[comp.brand, comp.model].filter(Boolean).join(' ')}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          Installed: {new Date(comp.install_date).toLocaleDateString()}
                        </p>
                        {comp.install_activity_name ? (
                          <p className="text-xs text-purple-400 mt-0.5">
                            Tracking from: {comp.install_activity_name}
                          </p>
                        ) : (
                          <p className="text-xs text-gray-600 mt-0.5">Tracking: all time</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Move */}
                        <button
                          onClick={() => setMoveTarget({
                            componentId: comp.id,
                            show: moveTarget.componentId === comp.id ? !moveTarget.show : true
                          })}
                          className="text-gray-500 hover:text-blue-400 p-1 transition-colors"
                          title="Move to another bike"
                        >
                          <ArrowRightLeft size={16} />
                        </button>
                        {/* Retire */}
                        <button
                          onClick={() => setRetireTarget({
                            componentId: comp.id,
                            show: retireTarget.componentId === comp.id ? !retireTarget.show : true,
                            reason: ''
                          })}
                          className="text-gray-500 hover:text-red-400 p-1 transition-colors"
                          title="Retire component"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Progress bar */}
                    {pctRemaining !== null && (
                      <div className="mb-2">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-400">
                            {milesUsed.toFixed(0)} mi used
                          </span>
                          <span className={`font-medium ${
                            pctRemaining <= 0 ? 'text-red-400' :
                            pctRemaining <= 10 ? 'text-yellow-400' :
                            'text-green-400'
                          }`}>
                            {pctRemaining.toFixed(0)}% remaining
                          </span>
                        </div>
                        <div className="w-full bg-gray-600 rounded-full h-2.5">
                          <div
                            className={`h-2.5 rounded-full transition-all ${
                              pctRemaining <= 0 ? 'bg-red-500' :
                              pctRemaining <= 10 ? 'bg-yellow-500' :
                              pctRemaining <= 30 ? 'bg-green-400' :
                              'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(100, pctRemaining)}%` }}
                          />
                        </div>
                        {lifetimeMiles && (
                          <p className="text-xs text-gray-500 mt-1">
                            Expected lifetime: {lifetimeMiles.toFixed(0)} mi
                          </p>
                        )}
                      </div>
                    )}

                    {/* Move dropdown */}
                    {moveTarget.componentId === comp.id && moveTarget.show && (
                      <div className="mt-3 p-3 bg-gray-700/50 rounded-lg border border-gray-600">
                        <p className="text-sm text-gray-400 mb-2">Move to:</p>
                        <div className="flex flex-wrap gap-2">
                          {allBikes.filter(b => b.id !== Number(bikeId) && b.is_active).map(b => (
                            <button
                              key={b.id}
                              onClick={() => handleMove(comp.id, b.id)}
                              className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm transition-colors"
                            >
                              {b.name}
                            </button>
                          ))}
                          {allBikes.filter(b => b.id !== Number(bikeId) && b.is_active).length === 0 && (
                            <p className="text-sm text-gray-500">No other bikes to move to</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Retire confirmation */}
                    {retireTarget.componentId === comp.id && retireTarget.show && (
                      <div className="mt-3 p-3 bg-gray-700/50 rounded-lg border border-red-500/30">
                        <p className="text-sm text-gray-400 mb-2">Retire this component?</p>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={retireTarget.reason}
                            onChange={e => setRetireTarget({...retireTarget, reason: e.target.value})}
                            placeholder="Reason (e.g., worn out)"
                            className="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-1.5 text-sm focus:border-purple-500 focus:outline-none"
                          />
                          <button
                            onClick={() => handleRetire(comp.id)}
                            className="bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded text-sm transition-colors"
                          >
                            Retire
                          </button>
                        </div>
                      </div>
                    )}

                    {comp.notes && (
                      <p className="text-xs text-gray-500 mt-2">{comp.notes}</p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
