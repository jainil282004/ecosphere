import type { CookieOptions, Response } from 'express';

export const ACCESS_COOKIE = 'ecosphere_access';
export const REFRESH_COOKIE = 'ecosphere_refresh';

const COOKIE_PATH = '/api/v1';

function baseCookieOptions(maxAgeMs: number): CookieOptions {
  const secure = process.env.COOKIE_SECURE !== 'false';

  return {
    httpOnly: true,
    secure,
    sameSite: secure ? 'none' : 'lax',
    path: COOKIE_PATH,
    maxAge: maxAgeMs,
  };
}

export function accessCookieOptions(): CookieOptions {
  return baseCookieOptions(15 * 60 * 1000);
}

export function refreshCookieOptions(): CookieOptions {
  return baseCookieOptions(7 * 24 * 60 * 60 * 1000);
}

export function setAuthCookies(
  response: Response,
  accessToken: string,
  refreshToken: string,
): void {
  response.cookie(ACCESS_COOKIE, accessToken, accessCookieOptions());
  response.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions());
}

function clearCookieOptions(source: CookieOptions): CookieOptions {
  return {
    httpOnly: source.httpOnly,
    secure: source.secure,
    sameSite: source.sameSite,
    path: source.path,
  };
}

export function clearAuthCookies(response: Response): void {
  response.clearCookie(ACCESS_COOKIE, clearCookieOptions(accessCookieOptions()));
  response.clearCookie(REFRESH_COOKIE, clearCookieOptions(refreshCookieOptions()));
}
