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

