// lib/visitor-ip.ts
// The IP address of the visitor, for the login and register limits of Laravel.
//
// Why: login and register run on THIS server (Server Actions), so Laravel
// sees the address of this server for every visitor. All visitors would share
// one "10 registrations per hour" counter. We pass the visitor address along.
//
// We read ONLY the "x-real-ip" header. The proxy in front of this server must
// SET it itself (many hosts do; Nginx needs
// "proxy_set_header X-Real-IP $remote_addr;"). If nothing sets it, this
// returns null and nothing is forwarded, so Laravel works as before.
// Only set VISITOR_IP_SECRET on the server when that is true. Otherwise a
// visitor could send a fake x-real-ip and escape the limits.

import { headers } from "next/headers";

/** The visitor address, or null when no proxy told us. Server Actions only. */
export async function getVisitorIp(): Promise<string | null> {
  const value = (await headers()).get("x-real-ip")?.trim();

  return value ? value : null;
}
