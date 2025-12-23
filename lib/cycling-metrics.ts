/**
 * Advanced Cycling Metrics Calculator
 * Implements industry-standard calculations for power-based training
 */

export interface PowerData {
  watts: number[];
  time: number[]; // seconds from start
}

export interface HeartRateData {
  heartRate: number[];
  time: number[];
}

/**
 * Calculate Normalized Power (NP)
 * Normalized Power is a better representation of the metabolic cost of a workout
 * than average power, accounting for variability
 */
export function calculateNormalizedPower(powerData: number[]): number {
  if (!powerData || powerData.length === 0) return 0;

  // Step 1: Calculate 30-second rolling average
  const rollingAvg: number[] = [];
  for (let i = 0; i < powerData.length; i++) {
    const start = Math.max(0, i - 29);
    const slice = powerData.slice(start, i + 1);
    const avg = slice.reduce((sum, val) => sum + val, 0) / slice.length;
    rollingAvg.push(avg);
  }

  // Step 2: Raise each value to the 4th power
  const raised = rollingAvg.map(val => Math.pow(val, 4));

  // Step 3: Find average of those values
  const avgRaised = raised.reduce((sum, val) => sum + val, 0) / raised.length;

  // Step 4: Take 4th root
  return Math.pow(avgRaised, 0.25);
}

/**
 * Calculate Intensity Factor (IF)
 * Ratio of Normalized Power to FTP
 */
export function calculateIntensityFactor(normalizedPower: number, ftp: number): number {
  if (!ftp || ftp === 0) return 0;
  return normalizedPower / ftp;
}

/**
 * Calculate Training Stress Score (TSS)
 * Quantifies the training load of a workout
 */
export function calculateTSS(
  normalizedPower: number,
  durationSeconds: number,
  ftp: number
): number {
  if (!ftp || ftp === 0) return 0;
  const intensityFactor = calculateIntensityFactor(normalizedPower, ftp);
  return (durationSeconds * normalizedPower * intensityFactor) / (ftp * 36);
}

/**
 * Calculate Variability Index (VI)
 * Ratio of Normalized Power to Average Power
 * Lower is better (more consistent effort)
 */
export function calculateVariabilityIndex(
  normalizedPower: number,
  averagePower: number
): number {
  if (!averagePower || averagePower === 0) return 0;
  return normalizedPower / averagePower;
}

/**
 * Calculate power curve (best power for each duration)
 * Returns map of duration (in seconds) to best average power
 */
export function calculatePowerCurve(powerData: number[], maxDuration: number = 3600): Map<number, number> {
  const curve = new Map<number, number>();
  
  // Key durations to calculate (in seconds)
  const durations = [
    5, 10, 15, 20, 30, // sprints
    60, 120, 180, 300, 360, // 1-6 min
    600, 900, 1200, 1500, 1800, // 10-30 min
    2400, 3000, 3600, // 40-60 min
    5400, 7200 // 90-120 min
  ].filter(d => d <= maxDuration && d <= powerData.length);

  for (const duration of durations) {
    let maxAvg = 0;
    
    // Sliding window to find best average for this duration
    for (let i = 0; i <= powerData.length - duration; i++) {
      const slice = powerData.slice(i, i + duration);
      const avg = slice.reduce((sum, val) => sum + val, 0) / slice.length;
      maxAvg = Math.max(maxAvg, avg);
    }
    
    curve.set(duration, Math.round(maxAvg));
  }

  return curve;
}

/**
 * Estimate FTP from 20-minute power test
 * FTP ≈ 95% of best 20-minute power
 */
export function estimateFTPFrom20Min(power20min: number): number {
  return Math.round(power20min * 0.95);
}

/**
 * Calculate Chronic Training Load (CTL) - Fitness
 * Exponentially weighted average of daily TSS over ~42 days
 */
export function calculateCTL(previousCTL: number, todayTSS: number): number {
  const timeConstant = 42;
  return previousCTL + (todayTSS - previousCTL) / timeConstant;
}

/**
 * Calculate Acute Training Load (ATL) - Fatigue
 * Exponentially weighted average of daily TSS over ~7 days
 */
export function calculateATL(previousATL: number, todayTSS: number): number {
  const timeConstant = 7;
  return previousATL + (todayTSS - previousATL) / timeConstant;
}

/**
 * Calculate Training Stress Balance (TSB) - Form
 * Difference between fitness and fatigue
 * Positive = fresh, Negative = fatigued
 */
export function calculateTSB(ctl: number, atl: number): number {
  return ctl - atl;
}

/**
 * Calculate power training zones based on FTP
 */
export function calculatePowerZones(ftp: number) {
  return {
    zone1: { name: 'Active Recovery', min: 0, max: Math.round(ftp * 0.55) },
    zone2: { name: 'Endurance', min: Math.round(ftp * 0.56), max: Math.round(ftp * 0.75) },
    zone3: { name: 'Tempo', min: Math.round(ftp * 0.76), max: Math.round(ftp * 0.90) },
    zone4: { name: 'Lactate Threshold', min: Math.round(ftp * 0.91), max: Math.round(ftp * 1.05) },
    zone5: { name: 'VO2 Max', min: Math.round(ftp * 1.06), max: Math.round(ftp * 1.20) },
    zone6: { name: 'Anaerobic Capacity', min: Math.round(ftp * 1.21), max: Math.round(ftp * 1.50) },
    zone7: { name: 'Neuromuscular Power', min: Math.round(ftp * 1.51), max: 9999 }
  };
}

/**
 * Calculate heart rate training zones (5-zone model)
 */
export function calculateHRZones(maxHR: number) {
  return {
    zone1: { name: 'Active Recovery', min: 0, max: Math.round(maxHR * 0.60) },
    zone2: { name: 'Endurance', min: Math.round(maxHR * 0.60), max: Math.round(maxHR * 0.75) },
    zone3: { name: 'Tempo', min: Math.round(maxHR * 0.75), max: Math.round(maxHR * 0.85) },
    zone4: { name: 'Threshold', min: Math.round(maxHR * 0.85), max: Math.round(maxHR * 0.95) },
    zone5: { name: 'Maximum', min: Math.round(maxHR * 0.95), max: maxHR }
  };
}

/**
 * Calculate time in each power zone
 */
export function calculateTimeInZones(powerData: number[], ftp: number): Record<string, number> {
  const zones = calculatePowerZones(ftp);
  const timeInZones: Record<string, number> = {
    zone1: 0, zone2: 0, zone3: 0, zone4: 0, zone5: 0, zone6: 0, zone7: 0
  };

  powerData.forEach(watts => {
    if (watts <= zones.zone1.max) timeInZones.zone1++;
    else if (watts <= zones.zone2.max) timeInZones.zone2++;
    else if (watts <= zones.zone3.max) timeInZones.zone3++;
    else if (watts <= zones.zone4.max) timeInZones.zone4++;
    else if (watts <= zones.zone5.max) timeInZones.zone5++;
    else if (watts <= zones.zone6.max) timeInZones.zone6++;
    else timeInZones.zone7++;
  });

  return timeInZones;
}

/**
 * Calculate work (kilojoules)
 */
export function calculateWork(powerData: number[]): number {
  // Each second at X watts = X joules
  // Sum all joules and divide by 1000 for kilojoules
  return powerData.reduce((sum, watts) => sum + watts, 0) / 1000;
}

/**
 * Calculate efficiency (work per heart beat)
 */
export function calculateEfficiency(kilojoules: number, averageHR: number, durationSeconds: number): number {
  if (!averageHR || averageHR === 0) return 0;
  const totalHeartbeats = (averageHR * durationSeconds) / 60;
  return (kilojoules * 1000) / totalHeartbeats; // joules per beat
}

/**
 * Analyze ride pacing
 */
export function analyzePacing(powerData: number[]): {
  firstHalfAvg: number;
  secondHalfAvg: number;
  pacingScore: number; // 1.0 = perfect, >1 = went too hard early
  variability: number;
} {
  const midpoint = Math.floor(powerData.length / 2);
  const firstHalf = powerData.slice(0, midpoint);
  const secondHalf = powerData.slice(midpoint);

  const firstHalfAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
  const secondHalfAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;

  const pacingScore = secondHalfAvg > 0 ? firstHalfAvg / secondHalfAvg : 1;
  
  // Calculate coefficient of variation
  const mean = powerData.reduce((sum, val) => sum + val, 0) / powerData.length;
  const variance = powerData.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / powerData.length;
  const stdDev = Math.sqrt(variance);
  const variability = mean > 0 ? stdDev / mean : 0;

  return {
    firstHalfAvg: Math.round(firstHalfAvg),
    secondHalfAvg: Math.round(secondHalfAvg),
    pacingScore: Math.round(pacingScore * 100) / 100,
    variability: Math.round(variability * 100) / 100
  };
}

/**
 * Calculate estimated distance for target time at average speed
 */
export function estimateDistance(averageSpeedMps: number, timeHours: number): number {
  return averageSpeedMps * timeHours * 3600; // meters
}

/**
 * Calculate required average speed for target distance and time
 */
export function requiredAverageSpeed(distanceMeters: number, timeHours: number): number {
  return distanceMeters / (timeHours * 3600); // m/s
}

/**
 * Convert speed units
 */
export const speedConversion = {
  mpsToMph: (mps: number) => mps * 2.23694,
  mpsToKmh: (mps: number) => mps * 3.6,
  mphToMps: (mph: number) => mph / 2.23694,
  kmhToMps: (kmh: number) => kmh / 3.6
};

/**
 * Calculate watts per kg (power-to-weight ratio)
 */
export function calculateWattsPerKg(watts: number, weightKg: number): number {
  if (!weightKg || weightKg === 0) return 0;
  return watts / weightKg;
}








