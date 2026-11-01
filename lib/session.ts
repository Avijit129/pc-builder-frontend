// lib/session.ts
// The login token lives in ONE cookie. These three functions are the only code
// that touches it.
//
// - httpOnly: JavaScript in the browser cannot read the cookie, so a script
//   injected into a page cannot steal the token.
// - sameSite "lax": the browser does not send it on requests started by
//   another site (protection against CSRF).
// - secure: only over https. Off in development, because localhost is http.
//
// Only a Server Action or a Route Handler may change cookies. A Server
// Component can only read them.

import { cookies } from "next/headers";

const COOKIE_NAME = "pc_builder_token";

/** The token, or null when nobody is logged in. */
export async function getSessionToken(): Promise<string | null> {
  const value = (await cookies()).get(COOKIE_NAME)?.value;

  return value ? value : null;
}

/** Called after a successful login or register. expiresAt comes from the API. */
export async function setSessionToken(
  token: string,
  expiresAt: string,
): Promise<void> {
  const expires = new Date(expiresAt);

  (await cookies()).set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    // Same moment as the token in Laravel (about 30 days). If the date is not
    // valid, the cookie lives until the browser closes.
    expires: Number.isNaN(expires.getTime()) ? undefined : expires,
  });
}

export async function clearSessionToken(): Promise<void> {
  (await cookies()).delete(COOKIE_NAME);
}
