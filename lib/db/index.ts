import { sql } from '@vercel/postgres';

export { sql };

// Database helper functions
export async function getUserByStravaId(stravaId: number) {
  const result = await sql`
    SELECT * FROM users WHERE strava_id = ${stravaId}
  `;
  return result.rows[0];
}

export async function createOrUpdateUser(userData: {
  stravaId: number;
  username?: string;
  firstname?: string;
  lastname?: string;
  email?: string;
  profilePicture?: string;
  accessToken: string;
  refreshToken: string;
  tokenExpiresAt: Date;
}) {
  const result = await sql`
    INSERT INTO users (
      strava_id, username, firstname, lastname, email, 
      profile_picture, access_token, refresh_token, token_expires_at
    )
    VALUES (
      ${userData.stravaId}, ${userData.username}, ${userData.firstname}, 
      ${userData.lastname}, ${userData.email}, ${userData.profilePicture},
      ${userData.accessToken}, ${userData.refreshToken}, ${userData.tokenExpiresAt.toISOString()}
    )
    ON CONFLICT (strava_id) 
    DO UPDATE SET
      username = EXCLUDED.username,
      firstname = EXCLUDED.firstname,
      lastname = EXCLUDED.lastname,
      email = EXCLUDED.email,
      profile_picture = EXCLUDED.profile_picture,
      access_token = EXCLUDED.access_token,
      refresh_token = EXCLUDED.refresh_token,
      token_expires_at = EXCLUDED.token_expires_at,
      updated_at = CURRENT_TIMESTAMP
    RETURNING *
  `;
  return result.rows[0];
}

export async function updateUserTokens(userId: number, accessToken: string, refreshToken: string, expiresAt: Date) {
  await sql`
    UPDATE users 
    SET access_token = ${accessToken}, 
        refresh_token = ${refreshToken}, 
        token_expires_at = ${expiresAt.toISOString()},
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ${userId}
  `;
}

export async function getUserActivities(userId: number, limit: number = 50, offset: number = 0) {
  const result = await sql`
    SELECT * FROM activities 
    WHERE user_id = ${userId} 
    ORDER BY start_date DESC 
    LIMIT ${limit} 
    OFFSET ${offset}
  `;
  return result.rows;
}

export async function getActivitiesByDateRange(userId: number, startDate: Date, endDate: Date) {
  const result = await sql`
    SELECT * FROM activities 
    WHERE user_id = ${userId} 
      AND start_date >= ${startDate.toISOString()}
      AND start_date <= ${endDate.toISOString()}
    ORDER BY start_date DESC
  `;
  return result.rows;
}

export async function createOrUpdateActivity(activityData: any) {
  try {
    // Try with bike columns (requires setup-bikes-db migration)
    const result = await sql`
      INSERT INTO activities (
        user_id, strava_id, name, type, start_date, distance, moving_time,
        elapsed_time, total_elevation_gain, average_speed, max_speed,
        average_watts, max_watts, weighted_power, average_heartrate,
        max_heartrate, average_cadence, max_cadence, kilojoules,
        device_watts, has_heartrate, tss, intensity_factor,
        variability_index, summary_polyline, map_id,
        strava_gear_id, bike_id
      )
      VALUES (
        ${activityData.userId}, ${activityData.stravaId}, ${activityData.name},
        ${activityData.type}, ${activityData.startDate}, ${activityData.distance},
        ${activityData.movingTime}, ${activityData.elapsedTime},
        ${activityData.totalElevationGain}, ${activityData.averageSpeed},
        ${activityData.maxSpeed}, ${activityData.averageWatts},
        ${activityData.maxWatts}, ${activityData.weightedPower},
        ${activityData.averageHeartrate}, ${activityData.maxHeartrate},
        ${activityData.averageCadence}, ${activityData.maxCadence},
        ${activityData.kilojoules}, ${activityData.deviceWatts},
        ${activityData.hasHeartrate}, ${activityData.tss},
        ${activityData.intensityFactor}, ${activityData.variabilityIndex},
        ${activityData.summaryPolyline}, ${activityData.mapId},
        ${activityData.stravaGearId || null}, ${activityData.bikeId || null}
      )
      ON CONFLICT (strava_id)
      DO UPDATE SET
        name = EXCLUDED.name,
        distance = EXCLUDED.distance,
        moving_time = EXCLUDED.moving_time,
        elapsed_time = EXCLUDED.elapsed_time,
        total_elevation_gain = EXCLUDED.total_elevation_gain,
        average_speed = EXCLUDED.average_speed,
        max_speed = EXCLUDED.max_speed,
        average_watts = EXCLUDED.average_watts,
        max_watts = EXCLUDED.max_watts,
        weighted_power = EXCLUDED.weighted_power,
        average_heartrate = EXCLUDED.average_heartrate,
        max_heartrate = EXCLUDED.max_heartrate,
        average_cadence = EXCLUDED.average_cadence,
        max_cadence = EXCLUDED.max_cadence,
        tss = EXCLUDED.tss,
        intensity_factor = EXCLUDED.intensity_factor,
        variability_index = EXCLUDED.variability_index,
        strava_gear_id = COALESCE(EXCLUDED.strava_gear_id, activities.strava_gear_id),
        bike_id = COALESCE(EXCLUDED.bike_id, activities.bike_id),
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    return result.rows[0];
  } catch (e: any) {
    // Fall back to original query if bike columns don't exist yet
    if (e.message?.includes('column') && (e.message?.includes('strava_gear_id') || e.message?.includes('bike_id'))) {
      const result = await sql`
        INSERT INTO activities (
          user_id, strava_id, name, type, start_date, distance, moving_time,
          elapsed_time, total_elevation_gain, average_speed, max_speed,
          average_watts, max_watts, weighted_power, average_heartrate,
          max_heartrate, average_cadence, max_cadence, kilojoules,
          device_watts, has_heartrate, tss, intensity_factor,
          variability_index, summary_polyline, map_id
        )
        VALUES (
          ${activityData.userId}, ${activityData.stravaId}, ${activityData.name},
          ${activityData.type}, ${activityData.startDate}, ${activityData.distance},
          ${activityData.movingTime}, ${activityData.elapsedTime},
          ${activityData.totalElevationGain}, ${activityData.averageSpeed},
          ${activityData.maxSpeed}, ${activityData.averageWatts},
          ${activityData.maxWatts}, ${activityData.weightedPower},
          ${activityData.averageHeartrate}, ${activityData.maxHeartrate},
          ${activityData.averageCadence}, ${activityData.maxCadence},
          ${activityData.kilojoules}, ${activityData.deviceWatts},
          ${activityData.hasHeartrate}, ${activityData.tss},
          ${activityData.intensityFactor}, ${activityData.variabilityIndex},
          ${activityData.summaryPolyline}, ${activityData.mapId}
        )
        ON CONFLICT (strava_id)
        DO UPDATE SET
          name = EXCLUDED.name,
          distance = EXCLUDED.distance,
          moving_time = EXCLUDED.moving_time,
          elapsed_time = EXCLUDED.elapsed_time,
          total_elevation_gain = EXCLUDED.total_elevation_gain,
          average_speed = EXCLUDED.average_speed,
          max_speed = EXCLUDED.max_speed,
          average_watts = EXCLUDED.average_watts,
          max_watts = EXCLUDED.max_watts,
          weighted_power = EXCLUDED.weighted_power,
          average_heartrate = EXCLUDED.average_heartrate,
          max_heartrate = EXCLUDED.max_heartrate,
          average_cadence = EXCLUDED.average_cadence,
          max_cadence = EXCLUDED.max_cadence,
          tss = EXCLUDED.tss,
          intensity_factor = EXCLUDED.intensity_factor,
          variability_index = EXCLUDED.variability_index,
          updated_at = CURRENT_TIMESTAMP
        RETURNING *
      `;
      return result.rows[0];
    }
    throw e;
  }
}

export async function getTrainingLoad(userId: number, days: number = 90) {
  const result = await sql`
    SELECT * FROM training_load
    WHERE user_id = ${userId}
      AND date >= CURRENT_DATE - INTERVAL '${days} days'
    ORDER BY date DESC
  `;
  return result.rows;
}

export async function updateTrainingLoad(userId: number, date: Date, dailyTSS: number, ctl: number, atl: number, tsb: number) {
  await sql`
    INSERT INTO training_load (user_id, date, daily_tss, ctl, atl, tsb)
    VALUES (${userId}, ${date.toISOString().split('T')[0]}, ${dailyTSS}, ${ctl}, ${atl}, ${tsb})
    ON CONFLICT (user_id, date)
    DO UPDATE SET
      daily_tss = EXCLUDED.daily_tss,
      ctl = EXCLUDED.ctl,
      atl = EXCLUDED.atl,
      tsb = EXCLUDED.tsb,
      updated_at = CURRENT_TIMESTAMP
  `;
}

export async function getUserGoals(userId: number) {
  const result = await sql`
    SELECT * FROM goals
    WHERE user_id = ${userId}
    ORDER BY target_date ASC
  `;
  return result.rows;
}

export async function createGoal(goalData: {
  userId: number;
  name: string;
  type: string;
  targetValue?: number;
  targetDate?: Date;
  description?: string;
}) {
  const result = await sql`
    INSERT INTO goals (user_id, name, type, target_value, target_date, description)
    VALUES (
      ${goalData.userId}, ${goalData.name}, ${goalData.type},
      ${goalData.targetValue}, ${goalData.targetDate?.toISOString()},
      ${goalData.description}
    )
    RETURNING *
  `;
  return result.rows[0];
}

export async function getPersonalRecords(userId: number) {
  const result = await sql`
    SELECT * FROM personal_records
    WHERE user_id = ${userId}
    ORDER BY record_type, duration
  `;
  return result.rows;
}

export async function updatePersonalRecord(
  userId: number,
  recordType: string,
  value: number,
  duration: number | null,
  activityId: number,
  dateAchieved: Date
) {
  await sql`
    INSERT INTO personal_records (user_id, record_type, value, duration, activity_id, date_achieved)
    VALUES (${userId}, ${recordType}, ${value}, ${duration}, ${activityId}, ${dateAchieved.toISOString()})
    ON CONFLICT (user_id, record_type, duration)
    DO UPDATE SET
      value = EXCLUDED.value,
      activity_id = EXCLUDED.activity_id,
      date_achieved = EXCLUDED.date_achieved
    WHERE EXCLUDED.value > personal_records.value
  `;
}

export async function saveAIAnalysis(activityId: number, analysis: string, feedback: string) {
  await sql`
    UPDATE activities
    SET ai_analysis = ${analysis},
        ai_feedback = ${feedback},
        analyzed_at = CURRENT_TIMESTAMP
    WHERE id = ${activityId}
  `;
}

export async function createCoachingInsight(insightData: {
  userId: number;
  insightType: string;
  title: string;
  content: string;
  severity?: string;
  data?: any;
}) {
  const result = await sql`
    INSERT INTO coaching_insights (user_id, insight_type, title, content, severity, data)
    VALUES (
      ${insightData.userId}, ${insightData.insightType}, ${insightData.title},
      ${insightData.content}, ${insightData.severity || 'info'},
      ${JSON.stringify(insightData.data || {})}
    )
    RETURNING *
  `;
  return result.rows[0];
}

export async function getUnreadInsights(userId: number) {
  const result = await sql`
    SELECT * FROM coaching_insights
    WHERE user_id = ${userId} AND read = false
    ORDER BY created_at DESC
    LIMIT 10
  `;
  return result.rows;
}

export async function getLatestActivity(userId: number) {
  const result = await sql`
    SELECT * FROM activities
    WHERE user_id = ${userId}
    ORDER BY start_date DESC
    LIMIT 1
  `;
  return result.rows[0] || null;
}

// ============ Bikes ============

export async function createOrUpdateBike(bikeData: {
  userId: number;
  stravaGearId?: string;
  name: string;
  brand?: string;
  model?: string;
  bikeType?: string;
  weight?: number;
  totalDistance?: number;
}) {
  if (bikeData.stravaGearId) {
    const result = await sql`
      INSERT INTO bikes (user_id, strava_gear_id, name, brand, model, bike_type, weight, total_distance)
      VALUES (
        ${bikeData.userId}, ${bikeData.stravaGearId}, ${bikeData.name},
        ${bikeData.brand || null}, ${bikeData.model || null},
        ${bikeData.bikeType || 'road'}, ${bikeData.weight || null},
        ${bikeData.totalDistance || 0}
      )
      ON CONFLICT (user_id, strava_gear_id)
      DO UPDATE SET
        name = EXCLUDED.name,
        brand = COALESCE(EXCLUDED.brand, bikes.brand),
        model = COALESCE(EXCLUDED.model, bikes.model),
        total_distance = EXCLUDED.total_distance,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    return result.rows[0];
  }
  const result = await sql`
    INSERT INTO bikes (user_id, name, brand, model, bike_type, weight)
    VALUES (
      ${bikeData.userId}, ${bikeData.name},
      ${bikeData.brand || null}, ${bikeData.model || null},
      ${bikeData.bikeType || 'road'}, ${bikeData.weight || null}
    )
    RETURNING *
  `;
  return result.rows[0];
}

export async function getUserBikes(userId: number) {
  const result = await sql`
    SELECT * FROM bikes
    WHERE user_id = ${userId}
    ORDER BY is_active DESC, name ASC
  `;
  return result.rows;
}

export async function getBikeById(bikeId: number) {
  const result = await sql`
    SELECT * FROM bikes WHERE id = ${bikeId}
  `;
  return result.rows[0] || null;
}

export async function updateBike(bikeId: number, data: {
  name?: string;
  brand?: string;
  model?: string;
  bikeType?: string;
  weight?: number;
  isActive?: boolean;
  notes?: string;
}) {
  const result = await sql`
    UPDATE bikes SET
      name = COALESCE(${data.name || null}, name),
      brand = COALESCE(${data.brand || null}, brand),
      model = COALESCE(${data.model || null}, model),
      bike_type = COALESCE(${data.bikeType || null}, bike_type),
      weight = COALESCE(${data.weight || null}, weight),
      is_active = COALESCE(${data.isActive ?? null}, is_active),
      notes = COALESCE(${data.notes || null}, notes),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ${bikeId}
    RETURNING *
  `;
  return result.rows[0];
}

export async function deleteBike(bikeId: number) {
  await sql`DELETE FROM bikes WHERE id = ${bikeId}`;
}

export async function updateBikeStats(bikeId: number) {
  await sql`
    UPDATE bikes SET
      total_distance = COALESCE((
        SELECT SUM(distance) FROM activities WHERE bike_id = ${bikeId}
      ), 0),
      ride_count = COALESCE((
        SELECT COUNT(*) FROM activities WHERE bike_id = ${bikeId}
      ), 0),
      total_elevation = COALESCE((
        SELECT SUM(total_elevation_gain) FROM activities WHERE bike_id = ${bikeId}
      ), 0),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ${bikeId}
  `;
}

export async function getBikeByStravaGearId(userId: number, stravaGearId: string) {
  const result = await sql`
    SELECT * FROM bikes
    WHERE user_id = ${userId} AND strava_gear_id = ${stravaGearId}
  `;
  return result.rows[0] || null;
}

// ============ Components ============

export async function getBikeActivities(bikeId: number) {
  const result = await sql`
    SELECT id, name, start_date, distance FROM activities
    WHERE bike_id = ${bikeId}
    ORDER BY start_date DESC
  `;
  return result.rows;
}

export async function calculateInstallDistanceFromActivity(bikeId: number, activityId: number) {
  // Get the activity's start_date
  const activityResult = await sql`
    SELECT start_date FROM activities WHERE id = ${activityId}
  `;
  if (!activityResult.rows[0]) throw new Error('Activity not found');
  const activityDate = activityResult.rows[0].start_date;

  // Sum all distances for this bike from that activity's date onward
  const sumResult = await sql`
    SELECT COALESCE(SUM(distance), 0) as total_since
    FROM activities
    WHERE bike_id = ${bikeId} AND start_date >= ${activityDate}
  `;

  // Get bike's current total distance
  const bikeResult = await sql`
    SELECT total_distance FROM bikes WHERE id = ${bikeId}
  `;
  if (!bikeResult.rows[0]) throw new Error('Bike not found');

  const bikeTotal = Number(bikeResult.rows[0].total_distance);
  const totalSince = Number(sumResult.rows[0].total_since);

  // install_distance = bike total - distance accumulated since that ride
  return bikeTotal - totalSince;
}

export async function getBikeComponents(bikeId: number) {
  try {
    const result = await sql`
      SELECT c.*, a.name as install_activity_name
      FROM components c
      LEFT JOIN activities a ON c.install_activity_id = a.id
      WHERE c.bike_id = ${bikeId} AND c.status = 'active'
      ORDER BY c.component_type ASC
    `;
    return result.rows;
  } catch {
    // Fallback if install_activity_id column doesn't exist yet
    const result = await sql`
      SELECT * FROM components
      WHERE bike_id = ${bikeId} AND status = 'active'
      ORDER BY component_type ASC
    `;
    return result.rows;
  }
}

export async function createComponent(data: {
  userId: number;
  bikeId: number;
  componentType: string;
  brand?: string;
  model?: string;
  installDate?: string;
  installDistance?: number;
  installActivityId?: number;
  expectedLifetimeDistance?: number;
  expectedLifetimeDays?: number;
  notes?: string;
}) {
  let result;
  try {
    result = await sql`
      INSERT INTO components (
        user_id, bike_id, component_type, brand, model,
        install_date, install_distance, install_activity_id,
        expected_lifetime_distance, expected_lifetime_days, notes
      )
      VALUES (
        ${data.userId}, ${data.bikeId}, ${data.componentType},
        ${data.brand || null}, ${data.model || null},
        ${data.installDate || new Date().toISOString().split('T')[0]},
        ${data.installDistance || 0},
        ${data.installActivityId || null},
        ${data.expectedLifetimeDistance || null},
        ${data.expectedLifetimeDays || null},
        ${data.notes || null}
      )
      RETURNING *
    `;
  } catch (e: any) {
    // Fallback if install_activity_id column doesn't exist yet
    if (e.message?.includes('install_activity_id')) {
      result = await sql`
        INSERT INTO components (
          user_id, bike_id, component_type, brand, model,
          install_date, install_distance, expected_lifetime_distance,
          expected_lifetime_days, notes
        )
        VALUES (
          ${data.userId}, ${data.bikeId}, ${data.componentType},
          ${data.brand || null}, ${data.model || null},
          ${data.installDate || new Date().toISOString().split('T')[0]},
          ${data.installDistance || 0},
          ${data.expectedLifetimeDistance || null},
          ${data.expectedLifetimeDays || null},
          ${data.notes || null}
        )
        RETURNING *
      `;
    } else {
      throw e;
    }
  }

  // Record install event
  await sql`
    INSERT INTO component_history (component_id, event_type, to_bike_id, distance_at_event, notes)
    VALUES (${result.rows[0].id}, 'installed', ${data.bikeId}, ${data.installDistance || 0}, 'Initial install')
  `;

  return result.rows[0];
}

export async function updateComponent(componentId: number, data: {
  currentDistance?: number;
  brand?: string;
  model?: string;
  expectedLifetimeDistance?: number;
  expectedLifetimeDays?: number;
  notes?: string;
}) {
  const result = await sql`
    UPDATE components SET
      current_distance = COALESCE(${data.currentDistance ?? null}, current_distance),
      brand = COALESCE(${data.brand || null}, brand),
      model = COALESCE(${data.model || null}, model),
      expected_lifetime_distance = COALESCE(${data.expectedLifetimeDistance ?? null}, expected_lifetime_distance),
      expected_lifetime_days = COALESCE(${data.expectedLifetimeDays ?? null}, expected_lifetime_days),
      notes = COALESCE(${data.notes || null}, notes),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ${componentId}
    RETURNING *
  `;
  return result.rows[0];
}

export async function updateComponentInstallTracking(componentId: number, installDistance: number, installActivityId: number | null) {
  try {
    await sql`
      UPDATE components SET
        install_distance = ${installDistance},
        install_activity_id = ${installActivityId},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${componentId}
    `;
  } catch {
    // Fallback if install_activity_id column doesn't exist
    await sql`
      UPDATE components SET
        install_distance = ${installDistance},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${componentId}
    `;
  }
}

export async function moveComponent(componentId: number, toBikeId: number, distanceAtEvent: number) {
  const component = await sql`SELECT * FROM components WHERE id = ${componentId}`;
  if (!component.rows[0]) return null;

  const fromBikeId = component.rows[0].bike_id;

  await sql`
    UPDATE components SET
      bike_id = ${toBikeId},
      status = 'active',
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ${componentId}
  `;

  await sql`
    INSERT INTO component_history (component_id, event_type, from_bike_id, to_bike_id, distance_at_event, notes)
    VALUES (${componentId}, 'moved', ${fromBikeId}, ${toBikeId}, ${distanceAtEvent}, ${`Moved from bike ${fromBikeId} to bike ${toBikeId}`})
  `;

  return { success: true };
}

export async function retireComponent(componentId: number, reason: string, distanceAtEvent: number) {
  await sql`
    UPDATE components SET
      status = 'retired',
      retirement_reason = ${reason},
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ${componentId}
  `;

  const component = await sql`SELECT * FROM components WHERE id = ${componentId}`;

  await sql`
    INSERT INTO component_history (component_id, event_type, from_bike_id, distance_at_event, notes)
    VALUES (${componentId}, 'retired', ${component.rows[0]?.bike_id || null}, ${distanceAtEvent}, ${reason})
  `;

  return { success: true };
}

export async function getComponentHistory(componentId: number) {
  const result = await sql`
    SELECT ch.*,
      fb.name as from_bike_name,
      tb.name as to_bike_name
    FROM component_history ch
    LEFT JOIN bikes fb ON ch.from_bike_id = fb.id
    LEFT JOIN bikes tb ON ch.to_bike_id = tb.id
    WHERE ch.component_id = ${componentId}
    ORDER BY ch.created_at DESC
  `;
  return result.rows;
}

// ============ Maintenance Schedules ============

export async function getMaintenanceSchedules(userId: number, bikeId?: number) {
  if (bikeId) {
    const result = await sql`
      SELECT ms.*, b.name as bike_name
      FROM maintenance_schedules ms
      JOIN bikes b ON ms.bike_id = b.id
      WHERE ms.user_id = ${userId} AND ms.bike_id = ${bikeId}
      ORDER BY ms.component_type ASC
    `;
    return result.rows;
  }
  const result = await sql`
    SELECT ms.*, b.name as bike_name
    FROM maintenance_schedules ms
    JOIN bikes b ON ms.bike_id = b.id
    WHERE ms.user_id = ${userId}
    ORDER BY b.name ASC, ms.component_type ASC
  `;
  return result.rows;
}

export async function createMaintenanceSchedule(data: {
  userId: number;
  bikeId: number;
  componentType: string;
  intervalDistance?: number;
  intervalDays?: number;
  lastServiceDate?: string;
  lastServiceDistance?: number;
  emailAlert?: boolean;
}) {
  const result = await sql`
    INSERT INTO maintenance_schedules (
      user_id, bike_id, component_type, interval_distance,
      interval_days, last_service_date, last_service_distance, email_alert
    )
    VALUES (
      ${data.userId}, ${data.bikeId}, ${data.componentType},
      ${data.intervalDistance || null}, ${data.intervalDays || null},
      ${data.lastServiceDate || new Date().toISOString().split('T')[0]},
      ${data.lastServiceDistance || 0},
      ${data.emailAlert || false}
    )
    RETURNING *
  `;
  return result.rows[0];
}

export async function updateMaintenanceSchedule(scheduleId: number, data: {
  intervalDistance?: number;
  intervalDays?: number;
  lastServiceDate?: string;
  lastServiceDistance?: number;
  emailAlert?: boolean;
}) {
  const result = await sql`
    UPDATE maintenance_schedules SET
      interval_distance = COALESCE(${data.intervalDistance ?? null}, interval_distance),
      interval_days = COALESCE(${data.intervalDays ?? null}, interval_days),
      last_service_date = COALESCE(${data.lastServiceDate || null}, last_service_date),
      last_service_distance = COALESCE(${data.lastServiceDistance ?? null}, last_service_distance),
      email_alert = COALESCE(${data.emailAlert ?? null}, email_alert),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ${scheduleId}
    RETURNING *
  `;
  return result.rows[0];
}

export async function getOverdueMaintenanceItems(userId: number) {
  const result = await sql`
    SELECT ms.*, b.name as bike_name, b.total_distance as bike_distance
    FROM maintenance_schedules ms
    JOIN bikes b ON ms.bike_id = b.id
    WHERE ms.user_id = ${userId}
    ORDER BY b.name ASC, ms.component_type ASC
  `;

  const now = new Date();
  return result.rows.map(schedule => {
    let distanceRemaining = null;
    let daysRemaining = null;
    let percentRemaining = 100;
    let status = 'ok';

    if (schedule.interval_distance && schedule.bike_distance != null) {
      const distanceSinceService = Number(schedule.bike_distance) - Number(schedule.last_service_distance);
      distanceRemaining = Number(schedule.interval_distance) - distanceSinceService;
      const distPercent = (distanceRemaining / Number(schedule.interval_distance)) * 100;
      percentRemaining = Math.min(percentRemaining, distPercent);
    }

    if (schedule.interval_days && schedule.last_service_date) {
      const lastService = new Date(schedule.last_service_date);
      const daysSince = Math.floor((now.getTime() - lastService.getTime()) / (1000 * 60 * 60 * 24));
      daysRemaining = schedule.interval_days - daysSince;
      const dayPercent = (daysRemaining / schedule.interval_days) * 100;
      percentRemaining = Math.min(percentRemaining, dayPercent);
    }

    if (percentRemaining <= 0) status = 'overdue';
    else if (percentRemaining <= 10) status = 'due_soon';

    return {
      ...schedule,
      distance_remaining: distanceRemaining,
      days_remaining: daysRemaining,
      percent_remaining: Math.max(0, percentRemaining),
      status
    };
  });
}

// ============ Tire Pressure Configs ============

export async function saveTirePressureConfig(data: {
  userId: number;
  bikeId?: number;
  name: string;
  tireWidthFront: number;
  tireWidthRear: number;
  tireType: string;
  surfaceType: string;
  riderWeight: number;
  bikeWeight: number;
  frontRearSplit: number;
  calculatedFrontPsi: number;
  calculatedRearPsi: number;
  isDefault?: boolean;
}) {
  const result = await sql`
    INSERT INTO tire_pressure_configs (
      user_id, bike_id, name, tire_width_front, tire_width_rear,
      tire_type, surface_type, rider_weight, bike_weight,
      front_rear_split, calculated_front_psi, calculated_rear_psi, is_default
    )
    VALUES (
      ${data.userId}, ${data.bikeId || null}, ${data.name},
      ${data.tireWidthFront}, ${data.tireWidthRear},
      ${data.tireType}, ${data.surfaceType},
      ${data.riderWeight}, ${data.bikeWeight},
      ${data.frontRearSplit}, ${data.calculatedFrontPsi},
      ${data.calculatedRearPsi}, ${data.isDefault || false}
    )
    RETURNING *
  `;
  return result.rows[0];
}

export async function getTirePressureConfigs(userId: number) {
  const result = await sql`
    SELECT tpc.*, b.name as bike_name
    FROM tire_pressure_configs tpc
    LEFT JOIN bikes b ON tpc.bike_id = b.id
    WHERE tpc.user_id = ${userId}
    ORDER BY tpc.is_default DESC, tpc.created_at DESC
  `;
  return result.rows;
}

export async function deleteTirePressureConfig(configId: number, userId: number) {
  await sql`DELETE FROM tire_pressure_configs WHERE id = ${configId} AND user_id = ${userId}`;
}

