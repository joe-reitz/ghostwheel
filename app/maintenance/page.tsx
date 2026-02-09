"use client"

import { useState, useEffect } from "react"
import { Nav } from "@/components/nav"
import { AlertTriangle, CheckCircle, Clock, Plus, Wrench } from "lucide-react"

interface MaintenanceItem {
  id: number
  bike_id: number
  bike_name: string
  component_type: string
  interval_distance?: number
  interval_days?: number
  last_service_date?: string
  last_service_distance: number
  email_alert: boolean
  bike_distance: number
  distance_remaining: number | null
  days_remaining: number | null
  percent_remaining: number
  status: 'overdue' | 'due_soon' | 'ok'
}

interface BikeData {
  id: number
  name: string
  total_distance: number
}

const COMPONENT_NAMES: Record<string, string> = {
  chain: 'Chain', cassette: 'Cassette', chainrings: 'Chainrings',
  tires_front: 'Front Tire', tires_rear: 'Rear Tire', brake_pads: 'Brake Pads',
  bar_tape: 'Bar Tape', chain_wax: 'Chain Wax', chain_lube: 'Chain Lube',
  cables: 'Cables', wheels: 'Wheels', bottom_bracket: 'Bottom Bracket',
  headset: 'Headset', hub_bearings: 'Hub Bearings',
}

const MI_TO_M = 1609.34

export default function MaintenancePage() {
  const [items, setItems] = useState<MaintenanceItem[]>([])
  const [summary, setSummary] = useState({ overdue: 0, dueSoon: 0, ok: 0, total: 0 })
  const [bikes, setBikes] = useState<BikeData[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [newSchedule, setNewSchedule] = useState({
    bikeId: '',
    componentType: 'chain',
    intervalMiles: '2000',
    intervalDays: '',
  })

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const [checkRes, bikesRes] = await Promise.all([
        fetch('/api/maintenance/check'),
        fetch('/api/bikes')
      ])
      if (checkRes.ok) {
        const data = await checkRes.json()
        setItems(data.items)
        setSummary(data.summary)
      }
      if (bikesRes.ok) {
        const bikesData = await bikesRes.json()
        setBikes(bikesData)
        if (bikesData.length > 0 && !newSchedule.bikeId) {
          setNewSchedule(prev => ({ ...prev, bikeId: String(bikesData[0].id) }))
        }
      }
    } catch (e) {
      console.error('Error fetching maintenance data:', e)
    } finally {
      setLoading(false)
    }
  }

  async function addSchedule() {
    if (!newSchedule.bikeId || !newSchedule.componentType) return
    try {
      const bike = bikes.find(b => b.id === Number(newSchedule.bikeId))
      const res = await fetch('/api/maintenance/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bikeId: Number(newSchedule.bikeId),
          componentType: newSchedule.componentType,
          intervalDistance: newSchedule.intervalMiles ? Number(newSchedule.intervalMiles) * MI_TO_M : undefined,
          intervalDays: newSchedule.intervalDays ? Number(newSchedule.intervalDays) : undefined,
          lastServiceDate: new Date().toISOString().split('T')[0],
          lastServiceDistance: bike ? Number(bike.total_distance) : 0,
        })
      })
      if (res.ok) {
        setShowAdd(false)
        setNewSchedule(prev => ({ ...prev, componentType: 'chain', intervalMiles: '2000', intervalDays: '' }))
        await fetchData()
      }
    } catch (e) {
      console.error('Error adding schedule:', e)
    }
  }

  async function markServiced(item: MaintenanceItem) {
    try {
      await fetch('/api/maintenance/schedules', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: item.id,
          lastServiceDate: new Date().toISOString().split('T')[0],
          lastServiceDistance: Number(item.bike_distance),
        })
      })
      await fetchData()
    } catch (e) {
      console.error('Error marking serviced:', e)
    }
  }

  // Group items by bike
  const groupedByBike: Record<string, MaintenanceItem[]> = {}
  items.forEach(item => {
    const key = item.bike_name || `Bike ${item.bike_id}`
    if (!groupedByBike[key]) groupedByBike[key] = []
    groupedByBike[key].push(item)
  })

  return (
    <div className="min-h-screen bg-gradient-dark text-white">
      <Nav />

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Maintenance</h1>
            <p className="text-gray-400">Track service intervals and component wear</p>
          </div>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus size={16} />
            Add Reminder
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className={`bg-gradient-to-br rounded-xl p-6 border ${
            summary.overdue > 0
              ? 'from-red-500/20 to-red-700/20 border-red-500/30'
              : 'from-gray-700/20 to-gray-800/20 border-gray-700'
          }`}>
            <div className="flex items-center gap-3 mb-2">
              <AlertTriangle className={summary.overdue > 0 ? 'text-red-400' : 'text-gray-500'} size={24} />
              <h3 className="text-lg font-bold">Overdue</h3>
            </div>
            <div className="text-4xl font-bold">{summary.overdue}</div>
          </div>

          <div className={`bg-gradient-to-br rounded-xl p-6 border ${
            summary.dueSoon > 0
              ? 'from-yellow-500/20 to-yellow-700/20 border-yellow-500/30'
              : 'from-gray-700/20 to-gray-800/20 border-gray-700'
          }`}>
            <div className="flex items-center gap-3 mb-2">
              <Clock className={summary.dueSoon > 0 ? 'text-yellow-400' : 'text-gray-500'} size={24} />
              <h3 className="text-lg font-bold">Due Soon</h3>
            </div>
            <div className="text-4xl font-bold">{summary.dueSoon}</div>
          </div>

          <div className="bg-gradient-to-br from-green-500/20 to-green-700/20 border border-green-500/30 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="text-green-400" size={24} />
              <h3 className="text-lg font-bold">OK</h3>
            </div>
            <div className="text-4xl font-bold">{summary.ok}</div>
          </div>
        </div>

        {/* Add Schedule Form */}
        {showAdd && (
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-bold mb-4">Add Maintenance Reminder</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Bike</label>
                <select
                  value={newSchedule.bikeId}
                  onChange={e => setNewSchedule({...newSchedule, bikeId: e.target.value})}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 focus:border-purple-500 focus:outline-none"
                >
                  {bikes.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Component</label>
                <select
                  value={newSchedule.componentType}
                  onChange={e => setNewSchedule({...newSchedule, componentType: e.target.value})}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 focus:border-purple-500 focus:outline-none"
                >
                  {Object.entries(COMPONENT_NAMES).map(([id, name]) => (
                    <option key={id} value={id}>{name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Interval (miles)</label>
                <input
                  type="number"
                  value={newSchedule.intervalMiles}
                  onChange={e => setNewSchedule({...newSchedule, intervalMiles: e.target.value})}
                  placeholder="2000"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 focus:border-purple-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Interval (days, optional)</label>
                <input
                  type="number"
                  value={newSchedule.intervalDays}
                  onChange={e => setNewSchedule({...newSchedule, intervalDays: e.target.value})}
                  placeholder="365"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={addSchedule} className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg text-sm transition-colors">
                Add
              </button>
              <button onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-white px-4 py-2 rounded-lg text-sm transition-colors">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading maintenance data...</div>
        ) : items.length === 0 ? (
          <div className="text-center py-16">
            <Wrench size={64} className="text-gray-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">No maintenance reminders</h2>
            <p className="text-gray-400 mb-6">Add reminders to track chain replacement, tire wear, and more</p>
          </div>
        ) : (
          /* Grouped by bike */
          <div className="space-y-8">
            {Object.entries(groupedByBike).map(([bikeName, bikeItems]) => (
              <div key={bikeName}>
                <h3 className="text-xl font-bold mb-4">{bikeName}</h3>
                <div className="space-y-3">
                  {bikeItems.map(item => (
                    <div
                      key={item.id}
                      className={`bg-gray-800/50 border rounded-xl p-5 ${
                        item.status === 'overdue'
                          ? 'border-red-500/30'
                          : item.status === 'due_soon'
                          ? 'border-yellow-500/30'
                          : 'border-gray-700'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-bold">
                              {COMPONENT_NAMES[item.component_type] || item.component_type}
                            </h4>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              item.status === 'overdue'
                                ? 'bg-red-500/20 text-red-400'
                                : item.status === 'due_soon'
                                ? 'bg-yellow-500/20 text-yellow-400'
                                : 'bg-green-500/20 text-green-400'
                            }`}>
                              {item.status === 'overdue' ? 'Overdue' : item.status === 'due_soon' ? 'Due Soon' : 'OK'}
                            </span>
                          </div>

                          {/* Progress bar */}
                          <div className="mb-2 max-w-lg">
                            <div className="w-full bg-gray-600 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all ${
                                  item.status === 'overdue' ? 'bg-red-500' :
                                  item.status === 'due_soon' ? 'bg-yellow-500' :
                                  'bg-green-500'
                                }`}
                                style={{ width: `${Math.min(100, item.percent_remaining)}%` }}
                              />
                            </div>
                          </div>

                          <div className="flex gap-6 text-sm text-gray-400">
                            {item.distance_remaining != null && (
                              <span>
                                {item.distance_remaining > 0
                                  ? `${(item.distance_remaining * 0.000621371).toFixed(0)} mi remaining`
                                  : `${Math.abs(item.distance_remaining * 0.000621371).toFixed(0)} mi overdue`
                                }
                              </span>
                            )}
                            {item.days_remaining != null && (
                              <span>
                                {item.days_remaining > 0
                                  ? `${item.days_remaining} days remaining`
                                  : `${Math.abs(item.days_remaining)} days overdue`
                                }
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => markServiced(item)}
                          className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors flex-shrink-0"
                        >
                          <CheckCircle size={14} />
                          Mark Serviced
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
