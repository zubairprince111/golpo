import type { Memory, Visibility, StoryIconType } from "../types";
import { SAMPLE_MEMORIES } from "./sample-memories";

/**
 * Data access layer for Golpo.
 */

const MEMORY_KEY = "golpo.memories.v1";
const SESSION_KEY = "golpo.session.v1";
const SAVED_KEY = "golpo.saved.v1";
const REPORTS_KEY = "golpo.reports.v1";
const DELETED_KEY = "golpo.deleted.v1";
const BANNED_USERS_KEY = "golpo.banned_users.v1";
const SETTINGS_KEY = "golpo.settings.v1";
const ANALYTICS_KEY = "golpo.analytics.v1";
const USERS_KEY = "golpo.users.v1";

export interface Session {
  user_id: string;
  email: string;
  anonymous_id: string;
  created_at: string;
}

export interface UserRecord {
  user_id: string;
  email: string;
  anonymous_id: string;
  created_at: string;
  last_active: string;
  status: "active" | "banned";
  memory_count: number;
}

export interface SiteSettings {
  submissions_enabled: boolean;
  maintenance_mode: boolean;
  emergency_broadcast: string | null;
  require_auth: boolean;
}

export interface DailyStat {
  date: string;
  visits: number;
  submissions: number;
  reports: number;
}

export interface AnalyticsData {
  lifetime_visits: number;
  unique_visitors: number;
  daily_stats: DailyStat[];
}

export interface StoryReport {
  id: string;
  memory_id: string;
  memory_title?: string | undefined;
  memory_content: string;
  memory_location: string;
  anonymous_id: string;
  reason: string;
  reason_label: string;
  details?: string | undefined;
  created_at: string;
  status: "pending" | "resolved" | "deleted";
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

// ----------------------------------------------------
// Settings & Analytics
// ----------------------------------------------------

export function getSiteSettings(): SiteSettings {
  return read<SiteSettings>(SETTINGS_KEY, {
    submissions_enabled: true,
    maintenance_mode: false,
    emergency_broadcast: null,
    require_auth: false,
  });
}

export function updateSiteSettings(patch: Partial<SiteSettings>): SiteSettings {
  const current = getSiteSettings();
  const next = { ...current, ...patch };
  write(SETTINGS_KEY, next);
  return next;
}

export function getAnalytics(): AnalyticsData {
  const defaultStats: DailyStat[] = [
    { date: "2026-08-07", visits: 412, submissions: 14, reports: 0 },
    { date: "2026-08-08", visits: 580, submissions: 22, reports: 1 },
    { date: "2026-08-09", visits: 720, submissions: 31, reports: 0 },
    { date: "2026-08-10", visits: 890, submissions: 45, reports: 2 },
    { date: "2026-08-11", visits: 1140, submissions: 58, reports: 1 },
    { date: "2026-08-12", visits: 1420, submissions: 76, reports: 3 },
    { date: "2026-08-13", visits: 1680, submissions: 94, reports: 2 },
  ];

  return read<AnalyticsData>(ANALYTICS_KEY, {
    lifetime_visits: 14850,
    unique_visitors: 4920,
    daily_stats: defaultStats,
  });
}

export function recordPageVisit(): void {
  const analytics = getAnalytics();
  const today = new Date().toISOString().split("T")[0] || "2026-08-13";
  analytics.lifetime_visits += 1;

  const todayIndex = analytics.daily_stats.findIndex((d) => d.date === today);
  if (todayIndex >= 0) {
    analytics.daily_stats[todayIndex]!.visits += 1;
  } else {
    analytics.daily_stats.push({ date: today, visits: 1, submissions: 0, reports: 0 });
  }

  write(ANALYTICS_KEY, analytics);
}

// ----------------------------------------------------
// Banned Users & Moderation
// ----------------------------------------------------

export function listBannedUsers(): string[] {
  return read<string[]>(BANNED_USERS_KEY, []);
}

export function isUserBanned(session: Session | null): boolean {
  if (!session) return false;
  const banned = listBannedUsers();
  return banned.includes(session.user_id) || banned.includes(session.anonymous_id);
}

export function banUser(identifier: string): void {
  const banned = listBannedUsers();
  if (!banned.includes(identifier)) {
    write(BANNED_USERS_KEY, [...banned, identifier]);
  }
}

export function unbanUser(identifier: string): void {
  const banned = listBannedUsers();
  write(
    BANNED_USERS_KEY,
    banned.filter((id) => id !== identifier),
  );
}

export function listRegisteredUsers(): UserRecord[] {
  const localMemories = listLocalMemories();
  const banned = new Set(listBannedUsers());
  const storedUsers = read<UserRecord[]>(USERS_KEY, []);

  // Sync users with memories
  const userMap = new Map<string, UserRecord>();
  for (const u of storedUsers) {
    userMap.set(u.user_id, u);
  }

  // Count memories per user
  for (const m of localMemories) {
    const existing = userMap.get(m.user_id);
    if (existing) {
      existing.memory_count += 1;
      existing.last_active = m.created_at;
    } else {
      userMap.set(m.user_id, {
        user_id: m.user_id,
        email: `user_${m.anonymous_id.toLowerCase()}@golpo.local`,
        anonymous_id: m.anonymous_id,
        created_at: m.created_at,
        last_active: m.created_at,
        status: banned.has(m.user_id) || banned.has(m.anonymous_id) ? "banned" : "active",
        memory_count: 1,
      });
    }
  }

  const all = Array.from(userMap.values()).map((u) => ({
    ...u,
    status: banned.has(u.user_id) || banned.has(u.anonymous_id) ? ("banned" as const) : ("active" as const),
  }));

  write(USERS_KEY, all);
  return all;
}

// ----------------------------------------------------
// Memory Management
// ----------------------------------------------------

/** Deleted / purged memory IDs */
export function listDeletedIds(): string[] {
  return read<string[]>(DELETED_KEY, []);
}

/** Locally authored memories (public + private). */
export function listLocalMemories(): Memory[] {
  return read<Memory[]>(MEMORY_KEY, []);
}

/** Everything the current viewer is allowed to see on the map. */
export function listVisibleMemories(session: Session | null): Memory[] {
  const deleted = new Set(listDeletedIds());
  const banned = new Set(listBannedUsers());

  const local = listLocalMemories().filter(
    (m) =>
      !deleted.has(m.id) &&
      !banned.has(m.user_id) &&
      !banned.has(m.anonymous_id) &&
      (m.visibility === "public" || m.user_id === session?.user_id),
  );

  const seeds = SAMPLE_MEMORIES.filter(
    (m) => !deleted.has(m.id) && !banned.has(m.anonymous_id),
  );

  return [...seeds, ...local].filter((m) => m.status === "published");
}

export function listAllMemoriesAdmin(): Memory[] {
  const deleted = new Set(listDeletedIds());
  const local = listLocalMemories();
  return [...SAMPLE_MEMORIES, ...local].map((m) => ({
    ...m,
    status: deleted.has(m.id) ? ("archived" as const) : m.status,
  }));
}

export function listOwnMemories(session: Session | null): Memory[] {
  if (!session) return [];
  const deleted = new Set(listDeletedIds());
  return listLocalMemories()
    .filter((m) => !deleted.has(m.id) && m.user_id === session.user_id)
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
  icon?: StoryIconType | undefined;
}): Memory {
  const settings = getSiteSettings();
  if (!settings.submissions_enabled) {
    throw new Error("Memories are currently frozen for system maintenance.");
  }

  if (isUserBanned(input.session)) {
    throw new Error("Your account has been banned due to safety policy violations.");
  }

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
    icon: input.icon,
    status: "published",
    created_at: now,
    updated_at: now,
  };

  write(MEMORY_KEY, [...listLocalMemories(), memory]);

  // Record submission in analytics
  const analytics = getAnalytics();
  const today = now.split("T")[0] || "2026-08-13";
  const todayStat = analytics.daily_stats.find((d) => d.date === today);
  if (todayStat) todayStat.submissions += 1;
  write(ANALYTICS_KEY, analytics);

  return memory;
}

export function purgeAllMemoriesByUser(userIdOrAnonId: string): void {
  const local = listLocalMemories();
  const toDelete = local
    .filter((m) => m.user_id === userIdOrAnonId || m.anonymous_id === userIdOrAnonId)
    .map((m) => m.id);

  const deleted = listDeletedIds();
  write(DELETED_KEY, Array.from(new Set([...deleted, ...toDelete])));
  write(
    MEMORY_KEY,
    local.filter((m) => m.user_id !== userIdOrAnonId && m.anonymous_id !== userIdOrAnonId),
  );
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

  // Register in user registry
  const users = listRegisteredUsers();
  const userRecord = users.find((u) => u.user_id === session.user_id);
  if (!userRecord) {
    write(USERS_KEY, [
      ...users,
      {
        user_id: session.user_id,
        email: session.email,
        anonymous_id: session.anonymous_id,
        created_at: session.created_at,
        last_active: new Date().toISOString(),
        status: "active" as const,
        memory_count: 0,
      },
    ]);
  }

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

// ----------------------------------------------------
// Reports & Moderation
// ----------------------------------------------------

export function listReports(): StoryReport[] {
  return read<StoryReport[]>(REPORTS_KEY, []);
}

export function submitStoryReport(input: {
  memory: Memory;
  reason: string;
  reason_label: string;
  details?: string | undefined;
}): StoryReport {
  const report: StoryReport = {
    id: `rep-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    memory_id: input.memory.id,
    memory_title: input.memory.title,
    memory_content: input.memory.content,
    memory_location: input.memory.location_name,
    anonymous_id: input.memory.anonymous_id,
    reason: input.reason,
    reason_label: input.reason_label,
    details: input.details?.trim() || undefined,
    created_at: new Date().toISOString(),
    status: "pending",
  };

  const existing = listReports();
  write(REPORTS_KEY, [report, ...existing]);

  // Record in analytics
  const analytics = getAnalytics();
  const today = new Date().toISOString().split("T")[0] || "2026-08-13";
  const todayStat = analytics.daily_stats.find((d) => d.date === today);
  if (todayStat) todayStat.reports += 1;
  write(ANALYTICS_KEY, analytics);

  return report;
}

export function purgeMemoryByModeration(memoryId: string, reportId?: string): void {
  const deleted = listDeletedIds();
  if (!deleted.includes(memoryId)) {
    write(DELETED_KEY, [...deleted, memoryId]);
  }

  const local = listLocalMemories().filter((m) => m.id !== memoryId);
  write(MEMORY_KEY, local);

  if (reportId) {
    const reports = listReports().map((r) =>
      r.id === reportId ? { ...r, status: "deleted" as const } : r,
    );
    write(REPORTS_KEY, reports);
  }
}

export function resolveReport(reportId: string): void {
  const reports = listReports().map((r) =>
    r.id === reportId ? { ...r, status: "resolved" as const } : r,
  );
  write(REPORTS_KEY, reports);
}
