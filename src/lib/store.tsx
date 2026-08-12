import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { getVisitorToken } from "@/lib/visitor";
import { isWithinBangladesh, reverseGeocodeLiveLocation } from "./data/places";
import type { Memory, Visibility, StoryIconType } from "./types";
import { SAMPLE_MEMORIES } from "./data/sample-memories";

// ─── Profile shape from DB ───────────────────────────────────
export interface Profile {
  id: string;
  email: string;
  anonymous_id: string;
  display_name: string | null;
  avatar_url: string | null;
  is_admin: boolean;
  is_banned: boolean;
  created_at: string;
  last_active: string;
}

// ─── Report shape from DB ────────────────────────────────────
export interface StoryReport {
  id: string;
  memory_id: string | null;
  memory_snapshot: Record<string, unknown> | null;
  reporter_anon_id: string | null;
  reason: string;
  reason_label: string;
  details: string | null;
  status: "pending" | "resolved" | "deleted";
  created_at: string;
}

// ─── Site settings ───────────────────────────────────────────
export interface SiteSettings {
  submissions_enabled: boolean;
  maintenance_mode: boolean;
  emergency_broadcast: string | null;
  require_auth: boolean;
}

// ─── Reaction shape ──────────────────────────────────────────
export interface Reaction {
  memory_id: string;
  reaction_type: "heart" | "solidarity";
}

// ─── User GPS Location shape ─────────────────────────────────
export interface UserLocation {
  latitude: number;
  longitude: number;
  name?: string | undefined;
}

// ─── App state interface ─────────────────────────────────────
interface AppState {
  hydrated: boolean;
  user: User | null;
  profile: Profile | null;
  session: { user: User } | null; // compat shim
  userLocation: UserLocation | null;
  requestUserLocation: () => Promise<UserLocation | null>;
  memories: Memory[];
  ownMemories: Memory[];
  saved: string[];
  reactionCounts: Record<string, { heart: number; solidarity: number }>;
  userReactions: Record<string, "heart" | "solidarity">; // memoryId -> active reaction
  reports: StoryReport[];
  loadReports: () => Promise<void>;
  settings: SiteSettings;
  signOut: () => Promise<void>;
  addMemory: (input: {
    content: string;
    title?: string | undefined;
    latitude: number;
    longitude: number;
    location_name: string;
    visibility: Visibility;
    icon?: StoryIconType | undefined;
  }) => Promise<Memory | null>;
  toggleSaved: (memoryId: string) => Promise<void>;
  toggleReaction: (memoryId: string, type: "heart" | "solidarity") => Promise<void>;
  reportStory: (input: {
    memory: Memory;
    reason: string;
    reason_label: string;
    details?: string | undefined;
  }) => Promise<void>;
  deleteMemoryByMod: (memoryId: string, reportId?: string) => Promise<void>;
  dismissReport: (reportId: string) => Promise<void>;
  banUser: (profileId: string) => Promise<void>;
  unbanUser: (profileId: string) => Promise<void>;
  purgeUserMemories: (userId: string) => Promise<void>;
  updateSettings: (patch: Partial<SiteSettings>) => Promise<void>;
}

const AppStateContext = createContext<AppState | null>(null);

const DEFAULT_SETTINGS: SiteSettings = {
  submissions_enabled: true,
  maintenance_mode: false,
  emergency_broadcast: null,
  require_auth: false,
};

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(() => {
    try {
      const cached = sessionStorage.getItem("golpo_user_location");
      return cached ? (JSON.parse(cached) as UserLocation) : null;
    } catch {
      return null;
    }
  });
  const [memories, setMemories] = useState<Memory[]>(SAMPLE_MEMORIES);
  const [saved, setSaved] = useState<string[]>([]);
  const [reactionCounts, setReactionCounts] = useState<Record<string, { heart: number; solidarity: number }>>({});
  const [userReactions, setUserReactions] = useState<Record<string, "heart" | "solidarity">>({});
  const [reports, setReports] = useState<StoryReport[]>([]);
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);

  // ── Auto-request user geolocation on entry ──────────────
  const requestUserLocation = useCallback(async (): Promise<UserLocation | null> => {
    if (typeof window === "undefined" || !navigator.geolocation) return null;

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          let name: string | undefined = undefined;

          if (isWithinBangladesh(latitude, longitude)) {
            try {
              const res = await reverseGeocodeLiveLocation(latitude, longitude);
              name = res.name;
            } catch {
              // Ignore network fallback
            }
          }

          const loc: UserLocation = { latitude, longitude, name };
          setUserLocation(loc);
          try {
            sessionStorage.setItem("golpo_user_location", JSON.stringify(loc));
          } catch {
            // Ignore
          }
          resolve(loc);
        },
        () => {
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    });
  }, []);

  useEffect(() => {
    void requestUserLocation();
  }, [requestUserLocation]);


  // ── Load public memories from Supabase ──────────────────
  const loadMemories = useCallback(async (userId: string | null) => {
    const { data: publicMems } = await supabase
      .from("memories")
      .select("*")
      .eq("status", "published")
      .eq("visibility", "public");

    let privateMems: Memory[] = [];
    if (userId) {
      const { data } = await supabase
        .from("memories")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "published")
        .eq("visibility", "private");
      privateMems = (data as Memory[]) ?? [];
    }

    const dbMems: Memory[] = [...(publicMems as Memory[] ?? []), ...privateMems];

    // Merge: seed memories first, then real DB memories (no duplicates by id)
    const dbIds = new Set(dbMems.map((m) => m.id));
    const seeds = SAMPLE_MEMORIES.filter((m) => !dbIds.has(m.id));
    setMemories([...seeds, ...dbMems]);
  }, []);

  // ── Load saved memory IDs ────────────────────────────────
  const loadSaved = useCallback(async (userId: string) => {
    // 1. Instant cache recovery
    try {
      const cached = localStorage.getItem(`golpo_saved_${userId}`);
      if (cached) {
        setSaved(JSON.parse(cached));
      }
    } catch {
      // Ignore JSON parse errors
    }

    // 2. Fetch fresh from Supabase
    const { data, error } = await supabase
      .from("saved_memories")
      .select("memory_id")
      .eq("user_id", userId);

    if (error) {
      console.error("[Golpo Saved] loadSaved error:", error.message, error);
    } else if (data) {
      const ids = data.map((r: { memory_id: string }) => r.memory_id);
      setSaved(ids);
      try {
        localStorage.setItem(`golpo_saved_${userId}`, JSON.stringify(ids));
      } catch {
        // Ignore quota
      }
    }
  }, []);

  // ── Load reaction counts (public) and visitor's own reactions ─
  const loadReactions = useCallback(async (userId: string | null) => {
    const token = getVisitorToken();

    // Load all public counts & identify visitor's active reaction
    const { data: allReactions } = await supabase
      .from("reactions")
      .select("memory_id, reaction_type, user_id, visitor_token");

    if (allReactions) {
      const counts: Record<string, { heart: number; solidarity: number }> = {};
      const myReactions: Record<string, "heart" | "solidarity"> = {};

      for (const r of allReactions as {
        memory_id: string;
        reaction_type: "heart" | "solidarity";
        user_id: string | null;
        visitor_token: string;
      }[]) {
        if (!counts[r.memory_id]) counts[r.memory_id] = { heart: 0, solidarity: 0 };
        if (r.reaction_type === "heart") counts[r.memory_id].heart += 1;
        if (r.reaction_type === "solidarity") counts[r.memory_id].solidarity += 1;

        if ((userId && r.user_id === userId) || r.visitor_token === token) {
          myReactions[r.memory_id] = r.reaction_type;
        }
      }
      setReactionCounts(counts);
      setUserReactions(myReactions);
    }
  }, []);

  // ── Load reported stories for moderation ────────────────
  const loadReports = useCallback(async () => {
    if (!profile?.is_admin) return;
    const { data, error } = await supabase
      .from("reports")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[Golpo Admin] loadReports error:", error.message, error);
    } else if (data) {
      setReports(data as StoryReport[]);
    }
  }, [profile]);

  // ── Load profile ─────────────────────────────────────────
  const loadProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    if (error) {
      console.error("[Golpo] loadProfile error:", error.message, error.code);
    }
    if (data) {
      const p = data as Profile;
      setProfile(p);
      if (p.is_admin) {
        void loadReports();
      }
    }
  }, [loadReports]);


  // ── Load site settings ───────────────────────────────────
  const loadSettings = useCallback(async () => {
    const { data } = await supabase.from("site_settings").select("*");
    if (data) {
      const map: Record<string, unknown> = {};
      for (const row of data as { key: string; value: unknown }[]) {
        map[row.key] = row.value;
      }
      setSettings({
        submissions_enabled: (map.submissions_enabled as boolean) ?? true,
        maintenance_mode: (map.maintenance_mode as boolean) ?? false,
        emergency_broadcast: (map.emergency_broadcast as string | null) ?? null,
        require_auth: (map.require_auth as boolean) ?? false,
      });
    }
  }, []);

  // ── Bootstrap: auth state listener & real visit logging ─
  useEffect(() => {
    // 1. Log real visit session to analytics_events
    try {
      const token = getVisitorToken();
      // Track page load once per session window
      if (!sessionStorage.getItem("golpo_visited_session")) {
        sessionStorage.setItem("golpo_visited_session", "1");
        void supabase.from("analytics_events").insert({
          event_type: "page_view",
          metadata: {
            visitor_token: token,
            path: typeof window !== "undefined" ? window.location.pathname : "/",
            time: new Date().toISOString(),
          },
        });
      }
    } catch {
      // Ignore
    }

    // 2. Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        loadProfile(u.id);
        loadSaved(u.id);
      }
      loadMemories(u?.id ?? null);
      loadReactions(u?.id ?? null);
      loadSettings();
      setHydrated(true);
    });


    // Listen for auth changes (login / logout / token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const u = session?.user ?? null;
        setUser(u);
        if (u) {
          loadProfile(u.id);
          loadSaved(u.id);
        } else {
          setProfile(null);
          setSaved([]);
          setUserReactions([]);
        }
        loadMemories(u?.id ?? null);
        loadReactions(u?.id ?? null);
      },
    );

    // Re-fetch profile when user returns to tab (picks up DB changes like is_admin)
    async function handleFocus() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        loadProfile(session.user.id);
        loadSettings();
        loadReactions(session.user.id);
      }
    }
    window.addEventListener("focus", handleFocus);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("focus", handleFocus);
    };
  }, [loadMemories, loadSaved, loadProfile, loadSettings, loadReactions]);

  // ── Actions ──────────────────────────────────────────────

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSaved([]);
    loadMemories(null);
  }, [loadMemories]);

  const addMemory = useCallback(
    async (input: {
      content: string;
      title?: string | undefined;
      latitude: number;
      longitude: number;
      location_name: string;
      visibility: Visibility;
      icon?: StoryIconType | undefined;
    }): Promise<Memory | null> => {
      if (!user || !profile) return null;

      const { data, error } = await supabase
        .from("memories")
        .insert({
          user_id: user.id,
          anonymous_id: profile.anonymous_id,
          title: input.title?.trim() || null,
          content: input.content.trim(),
          latitude: input.latitude,
          longitude: input.longitude,
          location_name: input.location_name,
          visibility: input.visibility,
          icon: input.icon ?? null,
          status: "published",
        })
        .select()
        .single();

      if (error || !data) return null;

      // Track analytics
      await supabase.from("analytics_events").insert({
        event_type: "memory_created",
        user_id: user.id,
      });

      await loadMemories(user.id);
      return data as Memory;
    },
    [user, profile, loadMemories],
  );

  const toggleSaved = useCallback(
    async (memoryId: string) => {
      if (!user) return;

      if (saved.includes(memoryId)) {
        const next = saved.filter((id) => id !== memoryId);
        setSaved(next);
        try {
          localStorage.setItem(`golpo_saved_${user.id}`, JSON.stringify(next));
        } catch {
          // Ignore
        }

        const { error } = await supabase
          .from("saved_memories")
          .delete()
          .eq("user_id", user.id)
          .eq("memory_id", memoryId);

        if (error) {
          console.error("[Golpo Saved] Delete failed:", error.message, error);
        }
      } else {
        const next = [...saved, memoryId];
        setSaved(next);
        try {
          localStorage.setItem(`golpo_saved_${user.id}`, JSON.stringify(next));
        } catch {
          // Ignore
        }

        const { error } = await supabase
          .from("saved_memories")
          .upsert(
            { user_id: user.id, memory_id: memoryId },
            { onConflict: "user_id, memory_id" }
          );

        if (error) {
          console.error("[Golpo Saved] Upsert failed:", error.message, error);
        }
      }
    },
    [user, saved],
  );

  const toggleReaction = useCallback(
    async (memoryId: string, newType: "heart" | "solidarity") => {
      const token = getVisitorToken();
      const currentReaction = userReactions[memoryId];

      if (currentReaction === newType) {
        // 1. Tapping the already-active reaction -> REMOVE (Toggle off)
        setUserReactions((prev) => {
          const next = { ...prev };
          delete next[memoryId];
          return next;
        });
        setReactionCounts((counts) => {
          const prev = counts[memoryId] ?? { heart: 0, solidarity: 0 };
          return {
            ...counts,
            [memoryId]: {
              ...prev,
              [newType]: Math.max(0, prev[newType] - 1),
            },
          };
        });

        if (user) {
          const { error } = await supabase
            .from("reactions")
            .delete()
            .eq("memory_id", memoryId)
            .or(`user_id.eq.${user.id},visitor_token.eq.${token}`);
          if (error) console.error("[Golpo Reactions] Delete failed:", error.message, error);
        } else {
          const { error } = await supabase
            .from("reactions")
            .delete()
            .eq("memory_id", memoryId)
            .eq("visitor_token", token);
          if (error) console.error("[Golpo Reactions] Delete failed:", error.message, error);
        }
      } else if (currentReaction && currentReaction !== newType) {
        // 2. Switching reaction (e.g. Heart -> Solidarity)
        const oldType = currentReaction;
        setUserReactions((prev) => ({
          ...prev,
          [memoryId]: newType,
        }));
        setReactionCounts((counts) => {
          const prev = counts[memoryId] ?? { heart: 0, solidarity: 0 };
          return {
            ...counts,
            [memoryId]: {
              ...prev,
              [oldType]: Math.max(0, prev[oldType] - 1),
              [newType]: prev[newType] + 1,
            },
          };
        });

        const { error } = await supabase
          .from("reactions")
          .upsert(
            {
              memory_id: memoryId,
              reaction_type: newType,
              user_id: user?.id ?? null,
              visitor_token: token,
            },
            { onConflict: "memory_id, visitor_token" }
          );
        if (error) console.error("[Golpo Reactions] Upsert failed:", error.message, error);
      } else {
        // 3. New reaction on this post
        setUserReactions((prev) => ({
          ...prev,
          [memoryId]: newType,
        }));
        setReactionCounts((counts) => {
          const prev = counts[memoryId] ?? { heart: 0, solidarity: 0 };
          return {
            ...counts,
            [memoryId]: {
              ...prev,
              [newType]: prev[newType] + 1,
            },
          };
        });

        const { error } = await supabase
          .from("reactions")
          .upsert(
            {
              memory_id: memoryId,
              reaction_type: newType,
              user_id: user?.id ?? null,
              visitor_token: token,
            },
            { onConflict: "memory_id, visitor_token" }
          );
        if (error) console.error("[Golpo Reactions] Upsert failed:", error.message, error);
      }
    },
    [user, userReactions],
  );

  const reportStory = useCallback(
    async (input: {
      memory: Memory;
      reason: string;
      reason_label: string;
      details?: string | undefined;
    }) => {
      if (!user || !profile) return;

      const { error } = await supabase.from("reports").insert({
        memory_id: input.memory.id,
        memory_snapshot: {
          id: input.memory.id,
          title: input.memory.title,
          content: input.memory.content,
          location_name: input.memory.location_name,
          anonymous_id: input.memory.anonymous_id,
        },
        reporter_anon_id: profile.anonymous_id,
        reported_by: user.id,
        reason: input.reason,
        reason_label: input.reason_label,
        details: input.details?.trim() ?? null,
        status: "pending",
      });

      if (error) {
        console.error("[Golpo] Report submission failed:", error.message, error);
      }

      await supabase.from("analytics_events").insert({
        event_type: "report_submitted",
        user_id: user.id,
      });

      if (profile.is_admin) {
        await loadReports();
      }
    },
    [user, profile, loadReports],
  );

  const deleteMemoryByMod = useCallback(
    async (memoryId: string, reportId?: string) => {
      await supabase
        .from("memories")
        .update({ status: "removed" })
        .eq("id", memoryId);

      if (reportId) {
        await supabase
          .from("reports")
          .update({ status: "deleted", reviewed_by: user?.id ?? null, reviewed_at: new Date().toISOString() })
          .eq("id", reportId);
      }

      await loadMemories(user?.id ?? null);
      await loadReports();
    },
    [user, loadMemories, loadReports],
  );

  const dismissReport = useCallback(
    async (reportId: string) => {
      await supabase
        .from("reports")
        .update({ status: "resolved", reviewed_by: user?.id ?? null, reviewed_at: new Date().toISOString() })
        .eq("id", reportId);

      await loadReports();
    },
    [user, loadReports],
  );

  const banUser = useCallback(async (profileId: string) => {
    await supabase
      .from("profiles")
      .update({ is_banned: true })
      .eq("id", profileId);
  }, []);

  const unbanUser = useCallback(async (profileId: string) => {
    await supabase
      .from("profiles")
      .update({ is_banned: false })
      .eq("id", profileId);
  }, []);

  const purgeUserMemories = useCallback(
    async (userId: string) => {
      await supabase
        .from("memories")
        .update({ status: "removed" })
        .eq("user_id", userId);
      await loadMemories(user?.id ?? null);
    },
    [user, loadMemories],
  );

  const updateSettings = useCallback(async (patch: Partial<SiteSettings>) => {
    const updates = Object.entries(patch).map(([key, value]) => ({
      key,
      value: value === null ? null : value,
    }));

    for (const u of updates) {
      await supabase.from("site_settings").upsert({
        key: u.key,
        value: u.value === null ? null : u.value,
      });
    }

    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  // ── Compat shim for routes that still reference session ──
  const session = useMemo(
    () => (user ? { user } : null),
    [user],
  );

  const ownMemories = useMemo(
    () => memories.filter((m) => user && m.user_id === user.id),
    [memories, user],
  );

  const value = useMemo<AppState>(
    () => ({
      hydrated,
      user,
      profile,
      session,
      userLocation,
      requestUserLocation,
      memories,
      ownMemories,
      saved,
      reactionCounts,
      userReactions,
      reports,
      loadReports,
      settings,
      signOut,
      addMemory,
      toggleSaved,
      toggleReaction,
      reportStory,
      deleteMemoryByMod,
      dismissReport,
      banUser,
      unbanUser,
      purgeUserMemories,
      updateSettings,
    }),
    [
      hydrated, user, profile, session, userLocation, requestUserLocation,
      memories, ownMemories, saved, reactionCounts, userReactions, reports,
      loadReports, settings, signOut, addMemory, toggleSaved, toggleReaction,
      reportStory, deleteMemoryByMod, dismissReport, banUser, unbanUser,
      purgeUserMemories, updateSettings,
    ],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppState {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used inside AppStateProvider");
  return ctx;
}
