// Tire Pressure Calculator - Silca Breakpoint Physics Method
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
  notes: string[];
}

export interface TirePressureOutput {
  result: TirePressureResult;
  surface: SurfaceCategory;
  totalWeightKg: number;
  frontLoadKg: number;
  rearLoadKg: number;
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
  notes.push('Targets the pressure where contact patch transitions from round to flat');

  return {
    frontPsi: Math.round(frontPsi * 2) / 2,
    rearPsi: Math.round(rearPsi * 2) / 2,
    notes
  };
}

/**
 * Main calculator entry point
 */
export function calculateTirePressure(input: TirePressureInput): TirePressureOutput {
  const surface = SURFACE_CATEGORIES.find(s => s.id === input.surfaceId) || SURFACE_CATEGORIES[3];
  const totalWeight = input.riderWeightKg + input.bikeWeightKg;

  return {
    result: calculateSilcaPressure(input),
    surface,
    totalWeightKg: totalWeight,
    frontLoadKg: totalWeight * input.frontRearSplit,
    rearLoadKg: totalWeight * (1 - input.frontRearSplit),
  };
}
