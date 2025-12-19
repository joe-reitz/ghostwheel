import { cookies } from 'next/headers';
import { getUserByStravaId } from './db';

const SESSION_COOKIE_NAME = 'ghostwheel_session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export interface SessionUser {
  id: number;
  stravaId: number;
  username?: string;
  firstname?: string;
  lastname?: string;
  email?: string;
  profilePicture?: string;
  ftp?: number;
  maxHr?: number;
  accessToken: string;
  refreshToken: string;
  tokenExpiresAt: Date;
}

/**
 * Create a session for a user
 */
export async function createSession(stravaId: number) {
  const cookieStore = await cookies();
  
  cookieStore.set(SESSION_COOKIE_NAME, stravaId.toString(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  });
}

/**
 * Get the current session user
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
    
    if (!sessionCookie) {
      return null;
    }

    const stravaId = parseInt(sessionCookie.value);
    if (isNaN(stravaId)) {
      return null;
    }

    const user = await getUserByStravaId(stravaId);
    
    if (!user) {
      return null;
    }

    return {
      id: user.id,
      stravaId: user.strava_id,
      username: user.username,
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      profilePicture: user.profile_picture,
      ftp: user.ftp,
      maxHr: user.max_hr,
      accessToken: user.access_token,
      refreshToken: user.refresh_token,
      tokenExpiresAt: new Date(user.token_expires_at),
    };
  } catch (error) {
    console.error('Error getting session user:', error);
    return null;
  }
}

/**
 * Destroy the current session
 */
export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Require authentication (use in API routes)
 */
export async function requireAuth(): Promise<SessionUser> {
  const user = await getSessionUser();
  
  if (!user) {
    console.error('requireAuth: No user found in session');
    throw new Error('Unauthorized');
  }
  
  console.log('requireAuth: User authenticated:', { stravaId: user.stravaId, id: user.id });
  return user;
}


