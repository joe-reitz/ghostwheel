"use client"

import { useState, useEffect } from "react"
import { Nav } from "@/components/nav"
import { Save, Trash2, Info } from "lucide-react"

interface SurfaceCategory {
  id: string
  name: string
  description: string
  roughnessFactor: number
}

const SURFACES: SurfaceCategory[] = [
  { id: 'velodrome', name: 'Velodrome / Indoor Trainer', description: 'Glass-smooth wooden or concrete track, or a stationary trainer', roughnessFactor: 1.0 },
  { id: 'fresh_pavement', name: 'Fresh Smooth Pavement', description: 'Newly paved road with no cracks or patches — like riding on butter', roughnessFactor: 1.02 },
  { id: 'good_pavement', name: 'Good Pavement', description: 'Well-maintained road with minor texture and occasional seams', roughnessFactor: 1.05 },
  { id: 'average_pavement', name: 'Average Pavement', description: 'Normal road with some patches, cracks, and rough spots — what most of us ride on daily', roughnessFactor: 1.10 },
  { id: 'rough_pavement', name: 'Rough Pavement', description: 'Beat-up road with lots of patches, potholes, and cracked sections', roughnessFactor: 1.18 },
  { id: 'cobblestones', name: 'Cobblestones / Brick', description: 'Old brick streets, cobblestones, or very rough chipseal — Paris-Roubaix vibes', roughnessFactor: 1.28 },
  { id: 'packed_gravel', name: 'Packed Gravel / Hard-Pack Dirt', description: 'Well-packed rail trails, smooth fire roads, or hard-packed gravel paths', roughnessFactor: 1.22 },
  { id: 'loose_gravel', name: 'Loose Gravel', description: 'Chunky gravel roads, loose surface — tires sink in and you hear crunching', roughnessFactor: 1.35 },
  { id: 'mixed_terrain', name: 'Mixed Road & Gravel', description: 'Alternating between pavement and gravel sections', roughnessFactor: 1.20 },
  { id: 'singletrack', name: 'Singletrack / Off-Road', description: 'Mountain bike trails, roots, rocks, and natural terrain', roughnessFactor: 1.45 },
]

const TIRE_WIDTH_PRESETS = [
  { label: '23mm', value: 23 },
  { label: '25mm', value: 25 },
  { label: '28mm', value: 28 },
  { label: '30mm', value: 30 },
  { label: '32mm', value: 32 },
  { label: '35mm', value: 35 },
  { label: '38mm', value: 38 },
  { label: '40mm', value: 40 },
  { label: '43mm', value: 43 },
  { label: '47mm', value: 47 },
  { label: '50mm', value: 50 },
]

interface PressureResult {
  frontPsi: number
  rearPsi: number
  notes: string[]
}

interface SavedConfig {
  id: number
  name: string
  tire_width_front: number
  tire_width_rear: number
  tire_type: string
  surface_type: string
  rider_weight: number
  bike_weight: number
  front_rear_split: number
  calculated_front_psi: number
  calculated_rear_psi: number
  bike_name?: string
}

export default function TirePressurePage() {
  const [riderWeightLbs, setRiderWeightLbs] = useState<number>(165)
  const [bikeWeightLbs, setBikeWeightLbs] = useState<number>(20)
  const [tireWidthFront, setTireWidthFront] = useState<number>(28)
  const [tireWidthRear, setTireWidthRear] = useState<number>(28)
  const [sameFrontRear, setSameFrontRear] = useState(true)
  const [tireType, setTireType] = useState<'tubeless' | 'clincher' | 'tubular'>('clincher')
  const [surfaceId, setSurfaceId] = useState('average_pavement')
  const [frontRearSplit, setFrontRearSplit] = useState(42)
  const [result, setResult] = useState<PressureResult | null>(null)
  const [savedConfigs, setSavedConfigs] = useState<SavedConfig[]>([])
  const [configName, setConfigName] = useState('')
  const [showSave, setShowSave] = useState(false)
  const [loadingSettings, setLoadingSettings] = useState(true)

  // Load user settings for pre-fill
  useEffect(() => {
    async function load() {
      try {
        const [settingsRes, configsRes] = await Promise.all([
          fetch('/api/user/settings'),
          fetch('/api/tools/tire-pressure')
        ])
        if (settingsRes.ok) {
          const settings = await settingsRes.json()
          if (settings.weight) setRiderWeightLbs(Number((settings.weight * 2.20462).toFixed(1)))
          if (settings.bikeWeight) setBikeWeightLbs(Number((settings.bikeWeight * 2.20462).toFixed(1)))
        }
        if (configsRes.ok) {
          const configs = await configsRes.json()
          setSavedConfigs(configs)
        }
      } catch (e) {
        console.error('Error loading settings:', e)
      } finally {
        setLoadingSettings(false)
      }
    }
    load()
  }, [])

  // Auto-calculate when inputs change
  useEffect(() => {
    if (!loadingSettings) calculate()
  }, [riderWeightLbs, bikeWeightLbs, tireWidthFront, tireWidthRear, tireType, surfaceId, frontRearSplit, loadingSettings])

  function calculate() {
    const riderKg = riderWeightLbs / 2.20462
    const bikeKg = bikeWeightLbs / 2.20462
    const split = frontRearSplit / 100
    const surface = SURFACES.find(s => s.id === surfaceId) || SURFACES[3]
    const totalWeight = riderKg + bikeKg
    const frontLoad = totalWeight * split
    const rearLoad = totalWeight * (1 - split)

    // Silca breakpoint physics
    const frontContactLen = 0.7 * tireWidthFront
    const rearContactLen = 0.7 * tireWidthRear
    let frontPsi = (frontLoad * 9.81) / (tireWidthFront * frontContactLen) * 145.038
    let rearPsi = (rearLoad * 9.81) / (tireWidthRear * rearContactLen) * 145.038

    // Volume correction
    const volRef = 300
    const frontVol = Math.PI * Math.pow(tireWidthFront / 2, 2) * Math.PI * (622 + tireWidthFront) / 1000
    const rearVol = Math.PI * Math.pow(tireWidthRear / 2, 2) * Math.PI * (622 + tireWidthRear) / 1000
    frontPsi *= Math.pow(volRef / frontVol, 0.15)
    rearPsi *= Math.pow(volRef / rearVol, 0.15)

    // Surface derating
    const surfDerate = 1 - (surface.roughnessFactor - 1) * 0.6
    frontPsi *= surfDerate
    rearPsi *= surfDerate

    const notes: string[] = []
    if (tireType === 'tubeless') {
      frontPsi *= 0.93; rearPsi *= 0.93
      notes.push('Tubeless: 7% reduction for better compliance')
    } else if (tireType === 'tubular') {
      frontPsi *= 0.96; rearPsi *= 0.96
      notes.push('Tubular: 4% reduction for round profile')
    }
    notes.push('Based on Silca breakpoint physics model')

    setResult({
      frontPsi: Math.round(frontPsi * 2) / 2,
      rearPsi: Math.round(rearPsi * 2) / 2,
      notes
    })
  }

  async function saveConfig() {
    if (!configName.trim() || !result) return
    try {
      const res = await fetch('/api/tools/tire-pressure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: configName,
          tireWidthFront,
          tireWidthRear,
          tireType,
          surfaceType: surfaceId,
          riderWeight: riderWeightLbs / 2.20462,
          bikeWeight: bikeWeightLbs / 2.20462,
          frontRearSplit: frontRearSplit / 100,
          calculatedFrontPsi: result.frontPsi,
          calculatedRearPsi: result.rearPsi,
        })
      })
      if (res.ok) {
        const config = await res.json()
        setSavedConfigs(prev => [config, ...prev])
        setConfigName('')
        setShowSave(false)
      }
    } catch (e) {
      console.error('Error saving config:', e)
    }
  }

  async function deleteConfig(id: number) {
    try {
      await fetch(`/api/tools/tire-pressure?id=${id}`, { method: 'DELETE' })
      setSavedConfigs(prev => prev.filter(c => c.id !== id))
    } catch (e) {
      console.error('Error deleting config:', e)
    }
  }

  function loadConfig(config: SavedConfig) {
    setRiderWeightLbs(Number((Number(config.rider_weight) * 2.20462).toFixed(1)))
    setBikeWeightLbs(Number((Number(config.bike_weight) * 2.20462).toFixed(1)))
    setTireWidthFront(Number(config.tire_width_front))
    setTireWidthRear(Number(config.tire_width_rear))
    setSameFrontRear(Number(config.tire_width_front) === Number(config.tire_width_rear))
    setTireType(config.tire_type as 'tubeless' | 'clincher' | 'tubular')
    setSurfaceId(config.surface_type)
    setFrontRearSplit(Number((Number(config.front_rear_split) * 100).toFixed(0)))
  }

  const selectedSurface = SURFACES.find(s => s.id === surfaceId)

  return (
    <div className="min-h-screen bg-gradient-dark text-white">
      <Nav />

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Tire Pressure Calculator</h1>
          <p className="text-gray-400">
            Optimal pressure using the Silca breakpoint physics method
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Inputs */}
          <div className="lg:col-span-1 space-y-6">
            {/* Weight */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
              <h3 className="text-lg font-bold mb-4">Weight</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Rider Weight</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={riderWeightLbs}
                      onChange={e => setRiderWeightLbs(Number(e.target.value))}
                      className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 focus:border-purple-500 focus:outline-none"
                    />
                    <span className="text-gray-400 text-sm w-8">lbs</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Bike Weight</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={bikeWeightLbs}
                      onChange={e => setBikeWeightLbs(Number(e.target.value))}
                      className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 focus:border-purple-500 focus:outline-none"
                    />
                    <span className="text-gray-400 text-sm w-8">lbs</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tires */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
              <h3 className="text-lg font-bold mb-4">Tires</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    {sameFrontRear ? 'Tire Width' : 'Front Tire Width'}
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {TIRE_WIDTH_PRESETS.map(p => (
                      <button
                        key={p.value}
                        onClick={() => {
                          setTireWidthFront(p.value)
                          if (sameFrontRear) setTireWidthRear(p.value)
                        }}
                        className={`px-3 py-1 rounded-lg text-sm border transition-colors ${
                          tireWidthFront === p.value
                            ? 'bg-purple-600 border-purple-500 text-white'
                            : 'bg-gray-700 border-gray-600 hover:border-gray-500'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    value={tireWidthFront}
                    onChange={e => {
                      setTireWidthFront(Number(e.target.value))
                      if (sameFrontRear) setTireWidthRear(Number(e.target.value))
                    }}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sameFrontRear}
                    onChange={e => {
                      setSameFrontRear(e.target.checked)
                      if (e.target.checked) setTireWidthRear(tireWidthFront)
                    }}
                    className="rounded border-gray-600 bg-gray-700"
                  />
                  <span className="text-sm text-gray-400">Same width front & rear</span>
                </label>

                {!sameFrontRear && (
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Rear Tire Width</label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {TIRE_WIDTH_PRESETS.map(p => (
                        <button
                          key={p.value}
                          onClick={() => setTireWidthRear(p.value)}
                          className={`px-3 py-1 rounded-lg text-sm border transition-colors ${
                            tireWidthRear === p.value
                              ? 'bg-purple-600 border-purple-500 text-white'
                              : 'bg-gray-700 border-gray-600 hover:border-gray-500'
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                    <input
                      type="number"
                      value={tireWidthRear}
                      onChange={e => setTireWidthRear(Number(e.target.value))}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Tire Type</label>
                  <div className="flex gap-2">
                    {(['clincher', 'tubeless', 'tubular'] as const).map(t => (
                      <button
                        key={t}
                        onClick={() => setTireType(t)}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm border transition-colors capitalize ${
                          tireType === t
                            ? 'bg-purple-600 border-purple-500 text-white'
                            : 'bg-gray-700 border-gray-600 hover:border-gray-500'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Surface */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
              <h3 className="text-lg font-bold mb-4">Surface</h3>
              <div className="space-y-2">
                {SURFACES.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setSurfaceId(s.id)}
                    className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                      surfaceId === s.id
                        ? 'bg-purple-600/20 border-purple-500/50'
                        : 'bg-gray-700/30 border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    <div className="font-medium text-sm">{s.name}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{s.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Weight Distribution */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
              <h3 className="text-lg font-bold mb-4">Weight Distribution</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Front: {frontRearSplit}%</span>
                  <span className="text-gray-400">Rear: {100 - frontRearSplit}%</span>
                </div>
                <input
                  type="range"
                  min={35}
                  max={50}
                  value={frontRearSplit}
                  onChange={e => setFrontRearSplit(Number(e.target.value))}
                  className="w-full accent-purple-500"
                />
                <p className="text-xs text-gray-500">
                  Default 42/58 is typical for road bikes. Aero positions shift weight forward.
                </p>
              </div>
            </div>
          </div>

          {/* Right: Results */}
          <div className="lg:col-span-2 space-y-6">
            {/* Pressure Result */}
            {result && (
              <div className="bg-gradient-to-br from-purple-500/20 to-purple-700/20 border border-purple-500/30 rounded-xl p-8">
                <h2 className="text-2xl font-bold mb-6">Recommended Pressure</h2>
                <div className="grid grid-cols-2 gap-8">
                  <div className="text-center">
                    <div className="text-sm text-gray-400 mb-2 uppercase tracking-wider">Front</div>
                    <div className="text-5xl font-bold text-purple-400">
                      {result.frontPsi}
                    </div>
                    <div className="text-lg text-gray-400 mt-1">PSI</div>
                    <div className="text-xs text-gray-500 mt-2">
                      {(riderWeightLbs / 2.20462 + bikeWeightLbs / 2.20462) * (frontRearSplit / 100) | 0} kg on front wheel
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-400 mb-2 uppercase tracking-wider">Rear</div>
                    <div className="text-5xl font-bold text-purple-400">
                      {result.rearPsi}
                    </div>
                    <div className="text-lg text-gray-400 mt-1">PSI</div>
                    <div className="text-xs text-gray-500 mt-2">
                      {(riderWeightLbs / 2.20462 + bikeWeightLbs / 2.20462) * ((100 - frontRearSplit) / 100) | 0} kg on rear wheel
                    </div>
                  </div>
                </div>
                {result.notes.length > 0 && (
                  <div className="mt-6 space-y-1">
                    {result.notes.map((note, i) => (
                      <p key={i} className="text-xs text-gray-500">• {note}</p>
                    ))}
                  </div>
                )}
                <div className="mt-4 flex items-start gap-2 text-sm text-gray-400 bg-gray-800/50 rounded-lg p-3">
                  <Info size={16} className="flex-shrink-0 mt-0.5" />
                  <span>
                    Adjust based on feel: lower for more comfort and grip, higher for less rolling resistance on smooth roads.
                  </span>
                </div>
              </div>
            )}

            {/* Save Configuration */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
              {!showSave ? (
                <button
                  onClick={() => setShowSave(true)}
                  className="flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors"
                >
                  <Save size={16} />
                  Save this configuration
                </button>
              ) : (
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={configName}
                    onChange={e => setConfigName(e.target.value)}
                    placeholder="Configuration name (e.g., 'Gravel Race Setup')"
                    className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:border-purple-500 focus:outline-none text-sm"
                  />
                  <button
                    onClick={saveConfig}
                    disabled={!configName.trim()}
                    className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors"
                  >
                    <Save size={14} />
                    Save
                  </button>
                  <button
                    onClick={() => { setShowSave(false); setConfigName('') }}
                    className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            {/* Saved Configurations */}
            {savedConfigs.length > 0 && (
              <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                <h3 className="text-lg font-bold mb-4">Saved Configurations</h3>
                <div className="space-y-3">
                  {savedConfigs.map(config => (
                    <div key={config.id} className="flex items-center justify-between bg-gray-700/50 rounded-lg p-4">
                      <button
                        onClick={() => loadConfig(config)}
                        className="flex-1 text-left hover:text-purple-400 transition-colors"
                      >
                        <div className="font-medium">{config.name}</div>
                        <div className="text-xs text-gray-400 mt-1">
                          {config.tire_width_front}mm {config.tire_type} | {SURFACES.find(s => s.id === config.surface_type)?.name} | F:{Number(config.calculated_front_psi).toFixed(0)} R:{Number(config.calculated_rear_psi).toFixed(0)} PSI
                        </div>
                      </button>
                      <button
                        onClick={() => deleteConfig(config.id)}
                        className="text-gray-500 hover:text-red-400 p-2 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* How It Works */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
              <h3 className="text-lg font-bold mb-4">How It Works</h3>
              <div className="space-y-3 text-sm text-gray-400">
                <p>
                  Uses the <strong className="text-purple-400">Silca breakpoint physics</strong> model to find
                  the optimal pressure where the tire contact patch transitions from a round shape to a flat
                  one. Below this pressure, the tire deforms too much and wastes energy. Above it,
                  the tire bounces off imperfections instead of absorbing them.
                </p>
                <p>
                  The calculation accounts for tire volume, wheel load distribution,
                  surface roughness, and tire type (tubeless vs clincher vs tubular).
                </p>
                <p>
                  In practice, use these as a starting point and adjust based on feel. If you&apos;re getting a harsh
                  ride or losing traction in corners, go lower. If the tires feel wallowy in turns or
                  you&apos;re getting pinch flats (clinchers), go higher.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
