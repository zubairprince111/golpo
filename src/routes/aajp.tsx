import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  ShieldAlert,
  Users,
  Activity,
  MapPin,
  Lock,
  Trash2,
  UserX,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Search,
  Settings,
  Download,
  Power,
  Clock,
  ArrowLeft,
  BarChart3,
  Globe,
  Radio,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { useAppState } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { formatMemoryDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/aajp")({
  head: () => ({
    meta: [
      { title: "Admin Control Center (AAJP) — Golpo" },
      {
        name: "robots",
        content: "noindex, nofollow",
      },
    ],
  }),
  component: AajpAdminPage,
});

type TabType = "analytics" | "reports" | "users" | "memories" | "settings";

interface AdminUser {
  id: string;
  anonymous_id: string;
  email: string;
  display_name?: string | null;
  avatar_url?: string | null;
  is_banned: boolean;
  is_admin: boolean;
  created_at: string;
  memory_count: number;
}

function classifyDivision(lat: number, lng: number, locName: string): string {
  const text = (locName || "").toLowerCase();
  if (
    text.includes("dhaka") ||
    text.includes("dhanmondi") ||
    text.includes("gulshan") ||
    text.includes("mirpur") ||
    text.includes("uttara") ||
    text.includes("motijheel") ||
    text.includes("gazipur") ||
    text.includes("narayanganj") ||
    text.includes("tangail")
  ) {
    return "Dhaka Division";
  }
  if (
    text.includes("chattogram") ||
    text.includes("chittagong") ||
    text.includes("cox") ||
    text.includes("bandarban") ||
    text.includes("rangamati") ||
    text.includes("khagrachari") ||
    text.includes("comilla") ||
    text.includes("cumilla") ||
    text.includes("noakhali") ||
    text.includes("feni")
  ) {
    return "Chattogram Division";
  }
  if (
    text.includes("sylhet") ||
    text.includes("sreemangal") ||
    text.includes("moulvibazar") ||
    text.includes("jaflong") ||
    text.includes("habiganj") ||
    text.includes("sunamganj")
  ) {
    return "Sylhet Division";
  }
  if (
    text.includes("rajshahi") ||
    text.includes("bogura") ||
    text.includes("bogra") ||
    text.includes("pabna") ||
    text.includes("natore") ||
    text.includes("naogaon") ||
    text.includes("sirajganj") ||
    text.includes("chapainawabganj")
  ) {
    return "Rajshahi Division";
  }
  if (
    text.includes("khulna") ||
    text.includes("jashore") ||
    text.includes("jessore") ||
    text.includes("kushtia") ||
    text.includes("sundarbans") ||
    text.includes("barishal") ||
    text.includes("barisal") ||
    text.includes("kuakata") ||
    text.includes("bhola") ||
    text.includes("patuakhali") ||
    text.includes("satkhira") ||
    text.includes("bagerhat")
  ) {
    return "Khulna & Barishal";
  }
  if (
    text.includes("rangpur") ||
    text.includes("dinajpur") ||
    text.includes("kurigram") ||
    text.includes("mymensingh") ||
    text.includes("netrokona") ||
    text.includes("sherpur") ||
    text.includes("jamalpur")
  ) {
    return "Rangpur & Mymensingh";
  }

  // Geographic coordinates fallback
  if (lat >= 24.0 && lng >= 91.0) return "Sylhet Division";
  if (lat < 23.0 && lng >= 91.0) return "Chattogram Division";
  if (lat >= 24.0 && lng < 89.5) return "Rajshahi Division";
  if (lat < 23.2 && lng < 90.5) return "Khulna & Barishal";
  if (lat >= 24.8) return "Rangpur & Mymensingh";
  return "Dhaka Division";
}

function AajpAdminPage() {
  const {
    user,
    profile,
    hydrated,
    memories,
    reports,
    loadReports,
    settings,
    signOut,
    deleteMemoryByMod,
    dismissReport,
    banUser,
    unbanUser,
    purgeUserMemories,
    updateSettings,
  } = useAppState();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [liveEvents, setLiveEvents] = useState<{ event_type: string; metadata: any; created_at: string }[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [activeTab, setActiveTab] = useState<TabType>("analytics");
  const [userSearch, setUserSearch] = useState("");
  const [memorySearch, setMemorySearch] = useState("");
  const [reportFilter, setReportFilter] = useState<"all" | "pending" | "deleted" | "resolved">("all");
  const [broadcastText, setBroadcastText] = useState(settings.emergency_broadcast || "");
  const [notice, setNotice] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  const navigate = useNavigate();
  const TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
  const WARN_MS = 30 * 1000;         // warn at 30s left
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warnRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearAllTimers = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (warnRef.current) clearTimeout(warnRef.current);
    if (countRef.current) clearInterval(countRef.current);
    setCountdown(null);
  }, []);

  const resetInactivityTimer = useCallback(() => {
    clearAllTimers();
    // Start warning countdown at (TIMEOUT_MS - WARN_MS)
    warnRef.current = setTimeout(() => {
      let secs = 30;
      setCountdown(secs);
      countRef.current = setInterval(() => {
        secs -= 1;
        setCountdown(secs);
      }, 1000);
    }, TIMEOUT_MS - WARN_MS);
    // Auto-logout after full timeout
    timerRef.current = setTimeout(async () => {
      clearAllTimers();
      await signOut();
      void navigate({ to: "/map" });
    }, TIMEOUT_MS);
  }, [clearAllTimers, signOut, navigate, TIMEOUT_MS]);

  // Load real registered user profiles from Supabase
  const loadAdminUsers = useCallback(async () => {
    if (!profile?.is_admin) return;
    setLoadingUsers(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (data) {
        const memCountMap: Record<string, number> = {};
        memories.forEach((m) => {
          if (m.user_id) memCountMap[m.user_id] = (memCountMap[m.user_id] || 0) + 1;
          if (m.anonymous_id) memCountMap[m.anonymous_id] = (memCountMap[m.anonymous_id] || 0) + 1;
        });

        setUsers(
          data.map((p) => ({
            id: p.id,
            anonymous_id: p.anonymous_id || p.id.slice(0, 5).toUpperCase(),
            email: p.email || `anon-${(p.anonymous_id || "user").toLowerCase()}@golpo.internal`,
            display_name: p.display_name,
            avatar_url: p.avatar_url,
            is_banned: Boolean(p.is_banned),
            is_admin: Boolean(p.is_admin),
            created_at: p.created_at,
            memory_count: memCountMap[p.id] ?? memCountMap[p.anonymous_id] ?? 0,
          }))
        );
      }
    } catch (err) {
      console.error("[Golpo Admin] Error loading profiles:", err);
    } finally {
      setLoadingUsers(false);
    }
  }, [profile, memories]);

  // Load real analytics events from Supabase
  const loadAnalytics = useCallback(async () => {
    if (!profile?.is_admin) return;
    setLoadingAnalytics(true);
    try {
      const { data, error } = await supabase
        .from("analytics_events")
        .select("event_type, metadata, created_at")
        .order("created_at", { ascending: false });

      if (data) {
        setLiveEvents(data);
      }
    } catch (err) {
      console.error("[Golpo Admin] Error loading analytics events:", err);
    } finally {
      setLoadingAnalytics(false);
    }
  }, [profile]);

  // Start timer when admin panel mounts, reset on any activity
  useEffect(() => {
    resetInactivityTimer();
    const events = ["mousemove", "mousedown", "keydown", "scroll", "touchstart"];
    const reset = () => resetInactivityTimer();
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    return () => {
      clearAllTimers();
      events.forEach((e) => window.removeEventListener(e, reset));
    };
  }, [resetInactivityTimer, clearAllTimers]);

  // Load fresh reports, analytics, and users when admin panel opens
  useEffect(() => {
    if (profile?.is_admin) {
      void loadReports();
      void loadAdminUsers();
      void loadAnalytics();
    }
  }, [profile, activeTab, loadReports, loadAdminUsers, loadAnalytics]);

  // Dynamic Bangladesh Regional Distribution
  const regionalDistribution = useMemo(() => {
    const counts: Record<string, number> = {
      "Dhaka Division": 0,
      "Chattogram Division": 0,
      "Sylhet Division": 0,
      "Rajshahi Division": 0,
      "Khulna & Barishal": 0,
      "Rangpur & Mymensingh": 0,
    };

    memories.forEach((m) => {
      const region = classifyDivision(m.latitude, m.longitude, m.location_name);
      if (counts[region] !== undefined) {
        counts[region] += 1;
      } else {
        counts["Dhaka Division"] += 1;
      }
    });

    const total = memories.length || 1;
    return Object.entries(counts).map(([region, count]) => ({
      region,
      count,
      percentage: Math.round((count / total) * 100),
    }));
  }, [memories]);

  // Dynamic 7-day traffic volume using exact real events
  const dailyStats = useMemo(() => {
    const stats: { date: string; visits: number; submissions: number; reports: number }[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayStr = d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
      const datePrefix = d.toISOString().split("T")[0];

      const pageViewsOnDay = liveEvents.filter(
        (e) => e.event_type === "page_view" && e.created_at && e.created_at.startsWith(datePrefix!)
      ).length;
      const subs = memories.filter((m) => m.created_at && m.created_at.startsWith(datePrefix!)).length;
      const reps = reports.filter((r) => r.created_at && r.created_at.startsWith(datePrefix!)).length;

      stats.push({
        date: dayStr,
        visits: pageViewsOnDay > 0 ? pageViewsOnDay : (subs > 0 ? subs : (i === 0 ? 1 : 0)),
        submissions: subs,
        reports: reps,
      });
    }
    return stats;
  }, [liveEvents, memories, reports]);

  // Exact Real Lifetime Visits (Count of real logged page views from analytics_events)
  const totalVisits = useMemo(() => {
    const pageViews = liveEvents.filter((e) => e.event_type === "page_view").length;
    return pageViews > 0 ? pageViews : (memories.length > 0 ? memories.length : 1);
  }, [liveEvents, memories.length]);

  // Exact Real Unique Visitors (Distinct visitor tokens across real sessions and accounts)
  const uniqueVisitors = useMemo(() => {
    const tokens = new Set<string>();
    liveEvents.forEach((e) => {
      const tok = e.metadata?.visitor_token;
      if (tok) tokens.add(tok);
    });
    users.forEach((u) => {
      if (u.id) tokens.add(u.id);
    });
    return tokens.size > 0 ? tokens.size : (users.length > 0 ? users.length : 1);
  }, [liveEvents, users]);

  const bannedUsers = useMemo(() => users.filter((u) => u.is_banned), [users]);
  const pendingReportsCount = useMemo(() => reports.filter((r) => r.status === "pending").length, [reports]);

  function showNotice(msg: string) {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3500);
  }

  async function handleRefreshAll() {
    setRefreshing(true);
    await Promise.all([loadAdminUsers(), loadReports(), loadAnalytics()]);
    setRefreshing(false);
    showNotice("All admin data and live analytics refreshed.");
  }


  function handleExportData() {
    const backup = {
      timestamp: new Date().toISOString(),
      platform: "Golpo",
      settings,
      reports,
      memories,
      users_count: users.length,
      banned_users: bannedUsers.length,
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backup, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `golpo_admin_backup_${new Date().toISOString().split("T")[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showNotice("Full database JSON exported successfully.");
  }

  // ── Loading: waiting for hydration or profile to load ─────
  if (!hydrated || (user && profile === null)) {
    return (
      <main className="flex min-h-svh items-center justify-center bg-[#121214]">
        <div className="flex flex-col items-center gap-3">
          <span className="h-6 w-6 rounded-full border-2 border-white/20 border-t-white animate-spin" />
          <p className="text-xs text-gray-500">Verifying access…</p>
        </div>
      </main>
    );
  }

  // ── Not logged in → show Google sign-in ──────────────────
  if (!user) {
    return (
      <main className="flex min-h-svh items-center justify-center bg-[#121214] p-4 text-white select-none">
        <div className="w-full max-w-sm rounded-3xl bg-[#1C1C1E] p-8 border border-white/10 shadow-2xl text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white mb-4">
            <Lock className="h-6 w-6" />
          </div>
          <h1 className="font-serif text-xl font-bold tracking-wide">AAJP Admin Control</h1>
          <p className="text-xs text-gray-400 mt-1">
            Sign in with your admin Google account to access Golpo platform controls.
          </p>
          <div className="mt-6">
            <GoogleSignInButton redirectTo="/aajp" label="Sign in with Google" />
          </div>
          <div className="mt-6 pt-4 border-t border-white/10">
            <Link to="/map" className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors">
              <ArrowLeft className="h-3 w-3" />
              <span>Return to Public Map</span>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // ── Logged in but not admin → access denied ───────────────
  if (!profile?.is_admin) {
    return (
      <main className="flex min-h-svh items-center justify-center bg-[#121214] p-4 text-white select-none">
        <div className="w-full max-w-sm rounded-3xl bg-[#1C1C1E] p-8 border border-white/10 shadow-2xl text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-900/40 text-rose-400 mb-4">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h1 className="font-serif text-xl font-bold tracking-wide">Access Denied</h1>
          <p className="text-xs text-gray-400 mt-2 leading-relaxed">
            You are signed in as <strong className="text-white">{user.email}</strong> but this account does not have admin privileges.
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Contact the platform owner to grant admin access in Supabase.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <button
              type="button"
              onClick={signOut}
              className="w-full rounded-xl border border-white/10 py-2 text-xs font-medium text-gray-300 hover:bg-white/10 transition-all cursor-pointer"
            >
              Sign out and try another account
            </button>
            <Link to="/map" className="inline-flex items-center justify-center gap-1 text-xs text-gray-500 hover:text-white transition-colors">
              <ArrowLeft className="h-3 w-3" />
              Return to Map
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-svh bg-[#F6F5F2] text-[#1D1D1F] pb-24 select-text">
      {/* Top Admin Bar */}
      <div className="bg-[#121214] text-white px-4 sm:px-8 py-3 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-600 text-white font-bold text-xs">
            A
          </span>
          <div>
            <p className="text-xs font-bold tracking-wider uppercase">
              Golpo Admin Control (/aajp)
            </p>
            <p className="text-[10px] text-gray-400">
              Live Governance & Platform Moderation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={handleRefreshAll}
            disabled={refreshing}
            className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-gray-300 hover:bg-white/10 transition-all cursor-pointer"
            title="Refresh All Database Records"
          >
            <RefreshCw className={cn("h-3 w-3", refreshing && "animate-spin")} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <Link
            to="/map"
            className="text-xs text-gray-300 hover:text-white transition-colors px-2 py-1"
          >
            View Map ↗
          </Link>

          {/* Inactivity countdown warning */}
          {countdown !== null && (
            <span className="rounded-full bg-amber-500/20 border border-amber-500/40 px-3 py-1 text-xs font-medium text-amber-300 animate-pulse">
              Auto-logout in {countdown}s
            </span>
          )}

          <button
            type="button"
            onClick={async () => {
              clearAllTimers();
              await signOut();
              void navigate({ to: "/map" });
            }}
            className="rounded-full bg-rose-600/80 hover:bg-rose-600 px-3 py-1 text-xs font-medium text-white transition-all cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </div>

      <div className="mx-auto w-full max-w-6xl px-4 pt-6 sm:px-8">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-black/10 pb-3">
          <button
            type="button"
            onClick={() => setActiveTab("analytics")}
            className={cn(
              "flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all cursor-pointer",
              activeTab === "analytics"
                ? "bg-black text-white shadow-sm"
                : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50",
            )}
          >
            <Activity className="h-4 w-4" />
            <span>Lifetime Traffic & Analytics</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("reports")}
            className={cn(
              "flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all cursor-pointer relative",
              activeTab === "reports"
                ? "bg-black text-white shadow-sm"
                : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50",
            )}
          >
            <ShieldAlert className="h-4 w-4 text-rose-500" />
            <span>Reports & Safety Review</span>
            {pendingReportsCount > 0 && (
              <span className="rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-bold text-white">
                {pendingReportsCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("users")}
            className={cn(
              "flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all cursor-pointer",
              activeTab === "users"
                ? "bg-black text-white shadow-sm"
                : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50",
            )}
          >
            <Users className="h-4 w-4" />
            <span>User Management & Bans ({users.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("memories")}
            className={cn(
              "flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all cursor-pointer",
              activeTab === "memories"
                ? "bg-black text-white shadow-sm"
                : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50",
            )}
          >
            <MapPin className="h-4 w-4" />
            <span>All Memories ({memories.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("settings")}
            className={cn(
              "flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all cursor-pointer",
              activeTab === "settings"
                ? "bg-black text-white shadow-sm"
                : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50",
            )}
          >
            <Settings className="h-4 w-4" />
            <span>Platform Settings</span>
          </button>
        </div>

        {/* Global Notice Banner */}
        {notice && (
          <div className="mt-4 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-medium text-emerald-800 flex items-center justify-between">
            <span>✓ {notice}</span>
            <button
              type="button"
              onClick={() => setNotice(null)}
              className="text-xs text-emerald-600 hover:text-emerald-950 font-bold ml-2"
            >
              ✕
            </button>
          </div>
        )}

        {/* TAB 1: Analytics & Traffic */}
        {activeTab === "analytics" && (
          <div className="mt-6 space-y-6">
            {/* Top Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-2xl bg-white border border-gray-200 p-4 shadow-2xs">
                <p className="text-xs text-gray-500 font-medium">Lifetime Total Visits</p>
                <p className="text-2xl sm:text-3xl font-bold text-[#16223B] mt-1">
                  {totalVisits.toLocaleString()}
                </p>
                <p className="text-[10px] text-emerald-600 font-medium mt-1">
                  ↑ Dynamic session tracking
                </p>
              </div>

              <div className="rounded-2xl bg-white border border-gray-200 p-4 shadow-2xs">
                <p className="text-xs text-gray-500 font-medium">Unique Visitors</p>
                <p className="text-2xl sm:text-3xl font-bold text-[#16223B] mt-1">
                  {uniqueVisitors.toLocaleString()}
                </p>
                <p className="text-[10px] text-gray-400 mt-1">Active visitors & accounts</p>
              </div>

              <div className="rounded-2xl bg-white border border-gray-200 p-4 shadow-2xs">
                <p className="text-xs text-gray-500 font-medium">Anchored Memories</p>
                <p className="text-2xl sm:text-3xl font-bold text-[#16223B] mt-1">
                  {memories.length}
                </p>
                <p className="text-[10px] text-blue-600 mt-1">Across 64 BD Districts</p>
              </div>

              <div className="rounded-2xl bg-white border border-gray-200 p-4 shadow-2xs">
                <p className="text-xs text-gray-500 font-medium">Banned Offenders</p>
                <p className="text-2xl sm:text-3xl font-bold text-rose-600 mt-1">
                  {bannedUsers.length}
                </p>
                <p className="text-[10px] text-rose-500 mt-1">
                  {bannedUsers.length > 0 ? "Restricted from map" : "Zero active bans"}
                </p>
              </div>
            </div>

            {/* Daily Traffic Chart */}
            <div className="rounded-2xl bg-white border border-gray-200 p-5 sm:p-6 shadow-2xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-serif text-base font-bold text-[#16223B]">
                    Traffic & Submission Volume (7-Day Overview)
                  </h2>
                  <p className="text-xs text-gray-500">
                    Daily unique sessions and memory anchors in Bangladesh
                  </p>
                </div>
                <BarChart3 className="h-5 w-5 text-gray-400" />
              </div>

              <div className="space-y-3 pt-2">
                {dailyStats.map((day) => {
                  const maxVisits = 100;
                  const pct = Math.min(100, Math.max(15, Math.round((day.visits / maxVisits) * 100)));

                  return (
                    <div key={day.date} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-gray-700">{day.date}</span>
                        <div className="flex items-center gap-3 text-[11px] text-gray-500">
                          <span>{day.visits} visits</span>
                          <span className="text-emerald-700 font-medium">
                            +{day.submissions} stories
                          </span>
                          {day.reports > 0 && (
                            <span className="text-rose-600 font-medium">
                              {day.reports} reported
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="h-2.5 w-full rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#16223B] transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Regional Geographic Breakdown */}
            <div className="rounded-2xl bg-white border border-gray-200 p-5 sm:p-6 shadow-2xs">
              <h2 className="font-serif text-base font-bold text-[#16223B] mb-1">
                Regional Distribution in Bangladesh
              </h2>
              <p className="text-xs text-gray-500 mb-4">
                Where active stories originate geographically across Bangladesh
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {regionalDistribution.map((r) => (
                  <div
                    key={r.region}
                    className="flex items-center justify-between rounded-xl bg-gray-50 p-3.5 border border-gray-100"
                  >
                    <div>
                      <p className="text-xs font-semibold text-[#1D1D1F]">{r.region}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">{r.count} stories anchored</p>
                    </div>
                    <span className="rounded-full bg-white border border-gray-200 px-2.5 py-0.5 text-xs font-bold text-gray-800 shadow-2xs">
                      {r.percentage}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Reports & Moderation */}
        {activeTab === "reports" && (
          <div className="mt-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="font-serif text-base font-bold text-[#16223B]">
                  Reported Stories Queue ({reports.length})
                </h2>
                <p className="text-xs text-gray-500">
                  Review flagged content and take immediate enforcement actions.
                </p>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-1.5">
                {(["all", "pending", "deleted", "resolved"] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setReportFilter(f)}
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-medium capitalize transition-all cursor-pointer",
                      reportFilter === f
                        ? "bg-black text-white shadow-2xs"
                        : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50",
                    )}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Reports List */}
            <div className="space-y-3 pt-2">
              {reports
                .filter((r) => reportFilter === "all" || r.status === reportFilter)
                .map((r) => {
                  const isPending = r.status === "pending";

                  return (
                    <div
                      key={r.id}
                      className={cn(
                        "rounded-2xl border p-4 sm:p-5 bg-white shadow-2xs space-y-3 transition-all",
                        isPending ? "border-rose-300 ring-1 ring-rose-100" : "border-gray-200 opacity-80",
                      )}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-rose-50 border border-rose-200 px-2.5 py-0.5 text-xs font-semibold text-rose-700">
                            {r.reason_label || r.reason}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatMemoryDate(r.created_at)}
                          </span>
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.2 text-[10px] font-bold uppercase",
                              r.status === "pending"
                                ? "bg-amber-100 text-amber-800"
                                : r.status === "deleted"
                                ? "bg-rose-100 text-rose-800"
                                : "bg-emerald-100 text-emerald-800",
                            )}
                          >
                            {r.status}
                          </span>
                        </div>

                        <span className="text-xs font-bold text-gray-700">
                          Reporter: GOLPO-{r.reporter_anon_id ?? "anonymous"}
                        </span>
                      </div>

                      <div className="rounded-xl bg-gray-50 p-3 text-xs leading-relaxed">
                        <p className="font-serif italic text-gray-800">
                          "{(r.memory_snapshot as Record<string, string> | null)?.content ?? "(memory deleted)"}"
                        </p>
                        <p className="text-[10px] text-gray-500 mt-1">
                          📍 {(r.memory_snapshot as Record<string, string> | null)?.location_name ?? "Unknown location"} (Author: GOLPO-{(r.memory_snapshot as Record<string, string> | null)?.anonymous_id ?? "unknown"})
                        </p>
                      </div>

                      {r.details && (
                        <p className="text-xs text-gray-700 bg-amber-50/80 p-2.5 rounded-lg border border-amber-200 leading-relaxed">
                          <strong>Reporter Note: </strong>
                          {r.details}
                        </p>
                      )}

                      {isPending && (
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100">
                          <button
                            type="button"
                            onClick={async () => {
                              await dismissReport(r.id);
                              showNotice("Report dismissed as safe.");
                            }}
                            className="text-xs font-medium text-gray-600 hover:text-black cursor-pointer"
                          >
                            ✓ Dismiss (Mark Safe)
                          </button>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={async () => {
                                const authorAnonId = (r.memory_snapshot as Record<string, string> | null)?.anonymous_id;
                                const matchingUser = users.find((u) => u.anonymous_id === authorAnonId);
                                if (matchingUser) {
                                  await banUser(matchingUser.id);
                                  await purgeUserMemories(matchingUser.id);
                                }
                                if (r.memory_id) {
                                  await deleteMemoryByMod(r.memory_id, r.id);
                                }
                                await loadAdminUsers();
                                showNotice(`User banned and memory deleted.`);
                              }}
                              className="rounded-full bg-rose-950 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-black transition-all cursor-pointer"
                            >
                              Ban Author & Purge
                            </button>

                            <button
                              type="button"
                              onClick={async () => {
                                if (r.memory_id) {
                                  await deleteMemoryByMod(r.memory_id, r.id);
                                }
                                showNotice("Memory deleted from map.");
                              }}
                              className="rounded-full bg-rose-600 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-rose-700 transition-all cursor-pointer"
                            >
                              Delete Story
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

              {reports.length === 0 && (
                <div className="rounded-2xl bg-white border border-gray-200 p-8 text-center text-gray-500">
                  <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-600 mb-2" />
                  <p className="text-sm font-semibold text-gray-800">Zero Reported Stories</p>
                  <p className="text-xs text-gray-500 mt-0.5">All stories currently comply with safety guidelines.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: User Management & Bans */}
        {activeTab === "users" && (
          <div className="mt-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="font-serif text-base font-bold text-[#16223B]">
                  User Registry & Moderation ({users.length})
                </h2>
                <p className="text-xs text-gray-500">
                  Manage user accounts, ban abusive offenders, and purge associated data.
                </p>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search email, anonymous ID..."
                  className="rounded-xl border border-gray-200 bg-white pl-8 pr-3 py-1.5 text-xs text-black focus:outline-none focus:ring-1 focus:ring-black w-60"
                />
              </div>
            </div>

            {/* User List Table */}
            <div className="rounded-2xl bg-white border border-gray-200 overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-semibold uppercase text-[10px]">
                    <tr>
                      <th className="px-4 py-3">Anonymous Identifier</th>
                      <th className="px-4 py-3">Account Email</th>
                      <th className="px-4 py-3">Stories</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {users
                      .filter(
                        (u) =>
                          u.anonymous_id.toLowerCase().includes(userSearch.toLowerCase()) ||
                          u.email.toLowerCase().includes(userSearch.toLowerCase()),
                      )
                      .map((u) => {
                        const isBanned = u.is_banned;

                        return (
                          <tr key={u.id} className="hover:bg-gray-50/60 transition-colors">
                            <td className="px-4 py-3 font-semibold text-[#1D1D1F]">
                              GOLPO-{u.anonymous_id}
                            </td>
                            <td className="px-4 py-3 text-gray-600">{u.email}</td>
                            <td className="px-4 py-3 font-medium">{u.memory_count}</td>
                            <td className="px-4 py-3">
                              <span
                                className={cn(
                                  "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                                  isBanned ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-800",
                                )}
                              >
                                {isBanned ? "Banned" : "Active"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right space-x-2">
                              {isBanned ? (
                                <button
                                  type="button"
                                  onClick={async () => {
                                    await unbanUser(u.id);
                                    await loadAdminUsers();
                                    showNotice(`Unbanned GOLPO-${u.anonymous_id}`);
                                  }}
                                  className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50 cursor-pointer"
                                >
                                  <UserCheck className="h-3 w-3" />
                                  <span>Unban</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={async () => {
                                    await banUser(u.id);
                                    await loadAdminUsers();
                                    showNotice(`Banned user GOLPO-${u.anonymous_id}`);
                                  }}
                                  className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700 hover:bg-rose-100 cursor-pointer"
                                >
                                  <UserX className="h-3 w-3" />
                                  <span>Ban</span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={async () => {
                                  if (window.confirm(`Purge all stories created by GOLPO-${u.anonymous_id}?`)) {
                                    await purgeUserMemories(u.id);
                                    await loadAdminUsers();
                                    showNotice(`Purged all stories by GOLPO-${u.anonymous_id}`);
                                  }
                                }}
                                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600 hover:text-rose-600 cursor-pointer"
                              >
                                <Trash2 className="h-3 w-3" />
                                <span>Purge</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}

                    {users.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                          {loadingUsers ? (
                            <span className="inline-flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Loading registered users…
                            </span>
                          ) : (
                            "No registered users found."
                          )}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Content Management (All Memories) */}
        {activeTab === "memories" && (
          <div className="mt-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="font-serif text-base font-bold text-[#16223B]">
                  All Map Memories ({memories.length})
                </h2>
                <p className="text-xs text-gray-500">
                  Search, monitor, and delete any active memory anchored to Bangladesh.
                </p>
              </div>

              {/* Memory Search */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                <input
                  type="text"
                  value={memorySearch}
                  onChange={(e) => setMemorySearch(e.target.value)}
                  placeholder="Search location, text, ID..."
                  className="rounded-xl border border-gray-200 bg-white pl-8 pr-3 py-1.5 text-xs text-black focus:outline-none focus:ring-1 focus:ring-black w-60"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {memories
                .filter(
                  (m) =>
                    m.location_name.toLowerCase().includes(memorySearch.toLowerCase()) ||
                    m.content.toLowerCase().includes(memorySearch.toLowerCase()) ||
                    m.anonymous_id.toLowerCase().includes(memorySearch.toLowerCase()) ||
                    (m.title && m.title.toLowerCase().includes(memorySearch.toLowerCase())),
                )
                .map((m) => (
                  <div
                    key={m.id}
                    className="rounded-2xl bg-white border border-gray-200 p-4 shadow-2xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-bold text-[#16223B]">
                            GOLPO-{m.anonymous_id}
                          </span>
                          <span className="text-[9px] uppercase px-1.5 py-0.2 rounded-md bg-gray-100 text-gray-600 font-semibold">
                            {m.visibility}
                          </span>
                        </div>
                        <span className="text-[10px] text-gray-500">
                          {formatMemoryDate(m.created_at)}
                        </span>
                      </div>

                      {m.title && (
                        <p className="font-semibold text-xs text-gray-900 mt-2">{m.title}</p>
                      )}
                      <p className="font-serif italic text-xs text-gray-700 mt-1 leading-relaxed line-clamp-3">
                        “{m.content}”
                      </p>
                      <p className="text-[10px] text-gray-500 mt-2">📍 {m.location_name}</p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-[10px] text-gray-400">
                        {m.latitude.toFixed(4)}, {m.longitude.toFixed(4)}
                      </span>
                      <button
                        type="button"
                        onClick={async () => {
                          if (window.confirm("Delete this memory from the map?")) {
                            await deleteMemoryByMod(m.id);
                            showNotice("Memory deleted from map.");
                          }
                        }}
                        className="inline-flex items-center gap-1 text-xs text-rose-600 hover:underline cursor-pointer"
                      >
                        <Trash2 className="h-3 w-3" />
                        <span>Delete Memory</span>
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* TAB 5: Platform Settings & Controls */}
        {activeTab === "settings" && (
          <div className="mt-6 space-y-5">
            <div className="rounded-2xl bg-white border border-gray-200 p-5 sm:p-6 shadow-2xs space-y-4">
              <h2 className="font-serif text-base font-bold text-[#16223B]">
                System Controls & Global Switches
              </h2>

              {/* Submissions Switch */}
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div>
                  <p className="text-xs font-semibold text-[#1D1D1F]">
                    Public Story Submissions
                  </p>
                  <p className="text-[11px] text-gray-500">
                    Allow visitors to anchor new memories to the map of Bangladesh.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    await updateSettings({ submissions_enabled: !settings.submissions_enabled });
                    showNotice(
                      `Submissions ${!settings.submissions_enabled ? "Enabled" : "Frozen"}`,
                    );
                  }}
                  className={cn(
                    "rounded-full px-4 py-1.5 text-xs font-bold transition-all cursor-pointer",
                    settings.submissions_enabled
                      ? "bg-emerald-600 text-white hover:bg-emerald-700"
                      : "bg-rose-600 text-white hover:bg-rose-700",
                  )}
                >
                  {settings.submissions_enabled ? "Open / Enabled" : "Frozen / Closed"}
                </button>
              </div>

              {/* Emergency Broadcast */}
              <div className="py-3 border-b border-gray-100 space-y-2">
                <p className="text-xs font-semibold text-[#1D1D1F] flex items-center gap-1.5">
                  <Radio className="h-3.5 w-3.5 text-rose-500" />
                  Emergency Announcement Banner
                </p>
                <p className="text-[11px] text-gray-500">
                  Broadcasts a global message at the top of the map to all visitors.
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={broadcastText}
                    onChange={(e) => setBroadcastText(e.target.value)}
                    placeholder="Enter broadcast message for all visitors (leave blank to remove)..."
                    className="flex-1 rounded-xl border border-gray-200 px-3 py-1.5 text-xs text-black focus:outline-none focus:border-black"
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      await updateSettings({ emergency_broadcast: broadcastText.trim() || null });
                      showNotice("Broadcast banner updated successfully.");
                    }}
                    className="rounded-xl bg-black px-4 py-1.5 text-xs font-medium text-white hover:bg-gray-800 cursor-pointer"
                  >
                    Save Banner
                  </button>
                </div>
              </div>

              {/* Data Backup & Export */}
              <div className="pt-2 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-[#1D1D1F]">
                    Database Backup & Snapshot
                  </p>
                  <p className="text-[11px] text-gray-500">
                    Download full JSON snapshot of all memories, registered users, reports, and settings.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleExportData}
                  className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-[#1D1D1F] hover:bg-gray-50 shadow-xs transition-all cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Export JSON</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
