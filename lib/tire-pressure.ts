// Tire Pressure Calculator - Blended Rene Herse + Silca Methods
// Calculates front and rear PSI separately based on weight distribution

export interface SurfaceCategory {
  id: string;
  name: string;
  description: string;
  roughnessFactor: number; // 1.0 = smooth, higher = rougher -> lower pressure
}

export const SURFACE_CATEGORIES: SurfaceCategory[] = [
  {
    id: 'velodrome',
    name: 'Velodrome / Indoor Trainer',
    description: 'Glass-smooth wooden or concrete track, or a stationary trainer where rolling resistance doesn\'t matter much',
    roughnessFactor: 1.0
  },
  {
    id: 'fresh_pavement',
    name: 'Fresh Smooth Pavement',
    description: 'Newly paved road with no cracks or patches — like riding on butter',
    roughnessFactor: 1.02
  },
  {
    id: 'good_pavement',
    name: 'Good Pavement',
    description: 'Well-maintained road with minor texture and occasional seams — typical nice suburban street',
    roughnessFactor: 1.05
  },
  {
    id: 'average_pavement',
    name: 'Average Pavement',
    description: 'Normal road with some patches, cracks, and rough spots — what most of us ride on daily',
    roughnessFactor: 1.10
  },
  {
    id: 'rough_pavement',
    name: 'Rough Pavement',
    description: 'Beat-up road with lots of patches, potholes, cracked sections, and expansion joints',
    roughnessFactor: 1.18
  },
  {
    id: 'cobblestones',
    name: 'Cobblestones / Brick',
    description: 'Old brick streets, cobblestones, or very rough chipseal — Paris-Roubaix vibes',
    roughnessFactor: 1.28
  },
  {
    id: 'packed_gravel',
    name: 'Packed Gravel / Hard-Pack Dirt',
    description: 'Well-packed rail trails, smooth fire roads, or hard-packed gravel paths',
    roughnessFactor: 1.22
  },
  {
    id: 'loose_gravel',
    name: 'Loose Gravel',
    description: 'Chunky gravel roads, loose surface — tires sink in slightly and you hear crunching',
    roughnessFactor: 1.35
  },
  {
    id: 'mixed_terrain',
    name: 'Mixed Road & Gravel',
    description: 'Alternating between pavement and gravel sections — typical mixed-surface adventure ride',
    roughnessFactor: 1.20
  },
  {
    id: 'singletrack',
    name: 'Singletrack / Off-Road',
    description: 'Mountain bike trails, roots, rocks, and natural terrain — maximum grip needed',
    roughnessFactor: 1.45
  }
];

export interface TirePressureInput {
  riderWeightKg: number;
  bikeWeightKg: number;
  tireWidthFront: number; // mm
  tireWidthRear: number;  // mm
  tireType: 'tubeless' | 'clincher' | 'tubular';
  surfaceId: string;
  frontRearSplit: number; // fraction on front wheel (0.42 default)
}

export interface TirePressureResult {
  frontPsi: number;
  rearPsi: number;
  method: string;
  notes: string[];
}

export interface TirePressureOutput {
  reneHerse: TirePressureResult;
  silca: TirePressureResult;
  recommended: {
    frontPsiLow: number;
    frontPsiHigh: number;
    rearPsiLow: number;
    rearPsiHigh: number;
  };
  surface: SurfaceCategory;
  totalWeightKg: number;
  frontLoadKg: number;
  rearLoadKg: number;
}

/**
 * Rene Herse method - based on Bicycle Quarterly real-road testing
 *
 * Key insight from BQ: optimal tire pressure scales with wheel load divided
 * by tire cross-section area (width²). On real roads (not smooth lab drums),
 * optimal pressure is lower than most cyclists think — a slightly under-
 * inflated tire conforms to surface roughness and actually rolls faster.
 *
 * Formula: PSI = 1400 × (wheel_load_kg / tire_width_mm²)
 *   then adjusted for surface roughness and tire type.
 *
 * Coefficient 1400 is calibrated against published BQ data across 23–50mm.
 * Produces results ~10–15% below Silca, matching BQ's real-road philosophy.
 */
export function calculateReneHersePressure(input: TirePressureInput): TirePressureResult {
  const surface = SURFACE_CATEGORIES.find(s => s.id === input.surfaceId) || SURFACE_CATEGORIES[3];
  const totalWeight = input.riderWeightKg + input.bikeWeightKg;
  const frontLoad = totalWeight * input.frontRearSplit;
  const rearLoad = totalWeight * (1 - input.frontRearSplit);
  const notes: string[] = [];

  // Base PSI: load per cross-section area (width²), not per diameter
  // This correctly captures that wider tires need disproportionately less pressure
  const coefficient = 1400;
  let frontPsi = coefficient * (frontLoad / (input.tireWidthFront * input.tireWidthFront));
  let rearPsi = coefficient * (rearLoad / (input.tireWidthRear * input.tireWidthRear));

  // Surface adjustment — rougher surfaces benefit from lower pressure.
  // BQ found that on rough roads, lower pressure is both faster and more comfortable.
  frontPsi /= surface.roughnessFactor;
  rearPsi /= surface.roughnessFactor;

  // Tire type adjustment
  if (input.tireType === 'tubeless') {
    frontPsi *= 0.90;
    rearPsi *= 0.90;
    notes.push('Tubeless: 10% reduction (no pinch flat risk, better casing compliance)');
  } else if (input.tireType === 'tubular') {
    frontPsi *= 0.95;
    rearPsi *= 0.95;
    notes.push('Tubular: 5% reduction (supple round casing profile)');
  }

  // Guardrails: clamp to width-appropriate max/min PSI
  // Max is based on typical tire sidewall ratings and physical limits
  const frontMax = maxPsiForWidth(input.tireWidthFront);
  const rearMax = maxPsiForWidth(input.tireWidthRear);
  if (frontPsi > frontMax) {
    frontPsi = frontMax;
    notes.push(`Front clamped to ${frontMax} PSI (max for ${input.tireWidthFront}mm tire)`);
  }
  if (rearPsi > rearMax) {
    rearPsi = rearMax;
    notes.push(`Rear clamped to ${rearMax} PSI (max for ${input.tireWidthRear}mm tire)`);
  }
  frontPsi = Math.max(20, frontPsi);
  rearPsi = Math.max(20, rearPsi);

  notes.push('Based on Bicycle Quarterly real-road testing data');
  notes.push('Optimizes for lowest rolling resistance on actual roads (not just drums)');

  return {
    frontPsi: Math.round(frontPsi * 2) / 2, // Round to nearest 0.5
    rearPsi: Math.round(rearPsi * 2) / 2,
    method: 'Rene Herse / Bicycle Quarterly',
    notes
  };
}

/** Width-based max PSI guardrail — prevents unsafe recommendations */
function maxPsiForWidth(widthMm: number): number {
  if (widthMm >= 42) return 60;
  if (widthMm >= 38) return 70;
  if (widthMm >= 35) return 75;
  if (widthMm >= 32) return 80;
  if (widthMm >= 28) return 95;
  return 120; // 23–27mm
}

/**
 * Silca method - based on breakpoint physics
 * Uses tire volume and load to find the "breakpoint" pressure where
 * the tire contact patch transitions from round to flat
 */
export function calculateSilcaPressure(input: TirePressureInput): TirePressureResult {
  const surface = SURFACE_CATEGORIES.find(s => s.id === input.surfaceId) || SURFACE_CATEGORIES[3];
  const totalWeight = input.riderWeightKg + input.bikeWeightKg;
  const frontLoad = totalWeight * input.frontRearSplit;
  const rearLoad = totalWeight * (1 - input.frontRearSplit);
  const notes: string[] = [];

  // Silca breakpoint method:
  // Base pressure from tire volume and wheel load
  // Approximate tire volume (cc) from width, assuming ~622mm BSD (700c)
  // Volume ≈ π * (width/2)^2 * π * (622 + width) / 1000
  const frontVolume = Math.PI * Math.pow(input.tireWidthFront / 2, 2) * Math.PI * (622 + input.tireWidthFront) / 1000;
  const rearVolume = Math.PI * Math.pow(input.tireWidthRear / 2, 2) * Math.PI * (622 + input.tireWidthRear) / 1000;

  // Breakpoint pressure: load_newtons / (tire_cross_section_area * contact_coefficient)
  // Simplified: PSI ≈ (load_kg * 9.81) / (width_mm * contact_length_mm) * 145.038 (Pa to PSI)
  // Contact length approximation varies with tire volume
  const frontContactLength = 0.7 * input.tireWidthFront; // approximate contact patch length
  const rearContactLength = 0.7 * input.tireWidthRear;

  // Convert: load(N) / contact_area(mm²) -> Pa -> PSI
  let frontPsi = (frontLoad * 9.81) / (input.tireWidthFront * frontContactLength) * 145.038;
  let rearPsi = (rearLoad * 9.81) / (input.tireWidthRear * rearContactLength) * 145.038;

  // Volume correction: larger volume tires can run proportionally lower
  // This accounts for the casing's ability to absorb bumps
  const volumeBaseRef = 300; // cc, reference for a 25mm tire
  const frontVolumeCorrection = Math.pow(volumeBaseRef / frontVolume, 0.15);
  const rearVolumeCorrection = Math.pow(volumeBaseRef / rearVolume, 0.15);
  frontPsi *= frontVolumeCorrection;
  rearPsi *= rearVolumeCorrection;

  // Surface roughness derating (Silca applies a CRR-optimized reduction on rough surfaces)
  const surfaceDerating = 1 - (surface.roughnessFactor - 1) * 0.6;
  frontPsi *= surfaceDerating;
  rearPsi *= surfaceDerating;

  // Tire type correction
  if (input.tireType === 'tubeless') {
    frontPsi *= 0.93;
    rearPsi *= 0.93;
    notes.push('Tubeless: 7% reduction for improved compliance and no tube friction');
  } else if (input.tireType === 'tubular') {
    frontPsi *= 0.96;
    rearPsi *= 0.96;
    notes.push('Tubular: 4% reduction for round casing profile');
  }

  notes.push('Based on Silca breakpoint physics model');
  notes.push('Targets the pressure where contact patch shape transitions from round to flat');

  return {
    frontPsi: Math.round(frontPsi * 2) / 2,
    rearPsi: Math.round(rearPsi * 2) / 2,
    method: 'Silca (Breakpoint Physics)',
    notes
  };
}

/**
 * Main calculator: returns both methods side-by-side with a recommended range
 */
export function calculateTirePressure(input: TirePressureInput): TirePressureOutput {
  const surface = SURFACE_CATEGORIES.find(s => s.id === input.surfaceId) || SURFACE_CATEGORIES[3];
  const totalWeight = input.riderWeightKg + input.bikeWeightKg;

  const reneHerse = calculateReneHersePressure(input);
  const silca = calculateSilcaPressure(input);

  // Recommended range: spans both methods with a small buffer
  const frontPsiLow = Math.min(reneHerse.frontPsi, silca.frontPsi) - 2;
  const frontPsiHigh = Math.max(reneHerse.frontPsi, silca.frontPsi) + 2;
  const rearPsiLow = Math.min(reneHerse.rearPsi, silca.rearPsi) - 2;
  const rearPsiHigh = Math.max(reneHerse.rearPsi, silca.rearPsi) + 2;

  // Clamp to width-appropriate bounds
  const frontMax = maxPsiForWidth(input.tireWidthFront);
  const rearMax = maxPsiForWidth(input.tireWidthRear);

  return {
    reneHerse,
    silca,
    recommended: {
      frontPsiLow: Math.round(Math.max(20, frontPsiLow) * 2) / 2,
      frontPsiHigh: Math.round(Math.min(frontMax, frontPsiHigh) * 2) / 2,
      rearPsiLow: Math.round(Math.max(20, rearPsiLow) * 2) / 2,
      rearPsiHigh: Math.round(Math.min(rearMax, rearPsiHigh) * 2) / 2,
    },
    surface,
    totalWeightKg: totalWeight,
    frontLoadKg: totalWeight * input.frontRearSplit,
    rearLoadKg: totalWeight * (1 - input.frontRearSplit),
  };
}
