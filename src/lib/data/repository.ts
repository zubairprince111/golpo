import type { Memory, Visibility } from "../types";
import { SAMPLE_MEMORIES } from "./sample-memories";

/**
 * Data access layer.
 *
 * Every read/write in the UI goes through these functions, so swapping the
 * local store for Supabase (`from("memories").select(...)`) is a change in this
 * file only. Nothing here is imported by server code.
 */

const MEMORY_KEY = "amou.memories.v1";
const SESSION_KEY = "amou.session.v1";
const SAVED_KEY = "amou.saved.v1";

export interface Session {
  user_id: string;
  email: string;
  anonymous_id: string;
  created_at: string;
}

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateAnonymousId(): string {
  let out = "";
  for (let i = 0; i < 5; i += 1) {
    out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return out;
}

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable — ignore */
  }
}

/** Locally authored memories (public + private). */
export function listLocalMemories(): Memory[] {
  return read<Memory[]>(MEMORY_KEY, []);
}

/** Everything the current viewer is allowed to see on the map. */
export function listVisibleMemories(session: Session | null): Memory[] {
  const local = listLocalMemories().filter(
    (m) => m.visibility === "public" || m.user_id === session?.user_id,
  );
  return [...SAMPLE_MEMORIES, ...local].filter((m) => m.status === "published");
}

export function listOwnMemories(session: Session | null): Memory[] {
  if (!session) return [];
  return listLocalMemories()
    .filter((m) => m.user_id === session.user_id)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function createMemory(input: {
  session: Session;
  content: string;
  title?: string | undefined;
  latitude: number;
  longitude: number;
  location_name: string;
  visibility: Visibility;
}): Memory {
  const now = new Date().toISOString();
  const memory: Memory = {
    id: `local-${now}-${Math.random().toString(36).slice(2, 7)}`,
    user_id: input.session.user_id,
    anonymous_id: input.session.anonymous_id,
    title: input.title?.trim() || undefined,
    content: input.content.trim(),
    latitude: input.latitude,
    longitude: input.longitude,
    location_name: input.location_name,
    visibility: input.visibility,
    status: "published",
    created_at: now,
    updated_at: now,
  };
  write(MEMORY_KEY, [...listLocalMemories(), memory]);
  return memory;
}

export function getSession(): Session | null {
  return read<Session | null>(SESSION_KEY, null);
}

export function signIn(email: string): Session {
  const existing = getSession();
  const session: Session =
    existing && existing.email === email
      ? existing
      : {
          user_id: `u-${Math.random().toString(36).slice(2, 12)}`,
          email,
          anonymous_id: generateAnonymousId(),
          created_at: new Date().toISOString(),
        };
  write(SESSION_KEY, session);
  return session;
}

export function signOut() {
  write(SESSION_KEY, null);
}

export function listSaved(): string[] {
  return read<string[]>(SAVED_KEY, []);
}

export function toggleSaved(id: string): string[] {
  const current = listSaved();
  const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
  write(SAVED_KEY, next);
  return next;
}
