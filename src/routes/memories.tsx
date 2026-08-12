import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useState, useMemo } from "react";
import {
  ArrowLeft,
  MapPin,
  Globe,
  Lock,
  Bookmark,
  BookOpen,
  ArrowUpRight,
  PenLine,
} from "lucide-react";
import { BottomNavigation } from "@/components/navigation/BottomNavigation";
import { formatMemoryDate, isBangla } from "@/lib/format";
import { useAppState } from "@/lib/store";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { STORY_THEMES } from "@/lib/data/icons";
import type { Memory, Visibility } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/memories")({
  head: () => ({
    meta: [
      { title: "Diary — Golpo" },
      {
        name: "description",
        content: "Your personal diary of memories and moments anchored to the map of Bangladesh on Golpo.",
      },
    ],
  }),
  component: DiaryPage,
});

type TabType = "written" | "saved";

function DiaryPage() {
  const { ownMemories, memories, saved, hydrated, user, profile } = useAppState();
  const [activeTab, setActiveTab] = useState<TabType>("written");
  const [visibilityFilter, setVisibilityFilter] = useState<"all" | Visibility>("all");

  const savedMemories = useMemo(
    () => memories.filter((m) => saved.includes(m.id)),
    [memories, saved],
  );

  const filteredWritten = useMemo(() => {
    if (visibilityFilter === "all") return ownMemories;
    return ownMemories.filter((m) => m.visibility === visibilityFilter);
  }, [ownMemories, visibilityFilter]);

  // Group by Year & Month
  const grouped = useMemo(() => {
    const list = activeTab === "written" ? filteredWritten : savedMemories;
    const map = new Map<string, Map<string, Memory[]>>();
    for (const memory of list) {
      const date = new Date(memory.created_at);
      const year = String(date.getFullYear());
      const month = date.toLocaleDateString("en-GB", { month: "long" });
      if (!map.has(year)) map.set(year, new Map());
      const months = map.get(year) as Map<string, Memory[]>;
      if (!months.has(month)) months.set(month, []);
      (months.get(month) as Memory[]).push(memory);
    }
    return map;
  }, [activeTab, filteredWritten, savedMemories]);

  const publicCount = ownMemories.filter((m) => m.visibility === "public").length;
  const privateCount = ownMemories.filter((m) => m.visibility === "private").length;

  return (
    <main className="min-h-svh bg-[#F6F5F2] pb-32 select-text">
      <div className="mx-auto w-full max-w-[36rem] px-4 pt-6 sm:px-8">
        {/* Back Link */}
        <Link
          to="/map"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#71717A] hover:text-[#1D1D1F] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Map</span>
        </Link>

        {/* Masthead */}
        <header className="mt-4 border-b border-black/10 pb-5">
          <div className="flex items-center justify-between">
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#16223B]">
              Diary
            </h1>
            {user && (
              <span className="rounded-full bg-white border border-[#E2E0D8] px-3 py-1 text-[11px] font-medium text-gray-700 shadow-2xs">
                GOLPO-{profile?.anonymous_id ?? "…"}
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-[#71717A] leading-relaxed">
            Your personal chronicle of moments anchored to the landscape of Bangladesh.
          </p>

          {/* Tab Selector: Written Entries vs Saved Stories */}
          <div className="mt-4 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("written")}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-medium transition-all",
                activeTab === "written"
                  ? "bg-black text-white shadow-xs"
                  : "bg-white/80 text-[#71717A] border border-[#E2E0D8] hover:bg-white hover:text-black",
              )}
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span>Written Entries ({ownMemories.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("saved")}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-medium transition-all",
                activeTab === "saved"
                  ? "bg-black text-white shadow-xs"
                  : "bg-white/80 text-[#71717A] border border-[#E2E0D8] hover:bg-white hover:text-black",
              )}
            >
              <Bookmark className="h-3.5 w-3.5" />
              <span>Saved Stories ({savedMemories.length})</span>
            </button>
          </div>
        </header>

        {/* Unauthenticated State */}
        {!hydrated ? null : !user ? (
          <div className="mt-8 rounded-2xl border border-[#E2E0D8] bg-white p-6 sm:p-8 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-700 mb-3">
              <BookOpen className="h-5 w-5" />
            </div>
            <h2 className="font-serif text-lg font-bold text-[#16223B]">
              Your Diary is Private
            </h2>
            <p className="mt-1.5 text-xs text-[#71717A] max-w-sm mx-auto leading-relaxed">
              Sign in to keep your written memories and bookmarked stories synchronized across devices.
            </p>
            <div className="mt-5 max-w-xs mx-auto">
              <GoogleSignInButton redirectTo="/memories" label="Sign in with Google" />
            </div>
          </div>
        ) : activeTab === "written" && ownMemories.length === 0 ? (
          /* Empty Written State */
          <div className="mt-8 rounded-2xl border border-[#E2E0D8] bg-white p-6 sm:p-8 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-800 mb-3">
              <PenLine className="h-5 w-5" />
            </div>
            <h2 className="font-serif text-lg font-bold text-[#16223B]">
              Your diary is quiet.
            </h2>
            <p className="mt-1.5 text-xs text-[#71717A] max-w-md mx-auto leading-relaxed">
              You haven't anchored any memories to the map yet. A quiet street in Old Dhaka, a bench by Dhanmondi Lake, or the monsoon rain in Sylhet — whenever you are ready, leave a memory behind.
            </p>
            <div className="mt-5">
              <Link
                to="/leave"
                className="inline-flex items-center gap-1.5 rounded-full bg-black px-6 py-2.5 text-xs font-medium text-white shadow-xs hover:bg-gray-800 transition-all"
              >
                <PenLine className="h-3.5 w-3.5" />
                <span>Write Your First Entry</span>
              </Link>
            </div>
          </div>
        ) : activeTab === "saved" && savedMemories.length === 0 ? (
          /* Empty Saved State */
          <div className="mt-8 rounded-2xl border border-[#E2E0D8] bg-white p-6 sm:p-8 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-700 mb-3">
              <Bookmark className="h-5 w-5" />
            </div>
            <h2 className="font-serif text-lg font-bold text-[#16223B]">
              No saved stories yet.
            </h2>
            <p className="mt-1.5 text-xs text-[#71717A] max-w-sm mx-auto leading-relaxed">
              When exploring the public map, tap the bookmark icon on any memory to save it here.
            </p>
            <div className="mt-5">
              <Link
                to="/map"
                className="inline-flex items-center gap-1.5 rounded-full bg-black px-6 py-2.5 text-xs font-medium text-white shadow-xs hover:bg-gray-800 transition-all"
              >
                <span>Explore the Map →</span>
              </Link>
            </div>
          </div>
        ) : (
          /* List of Entries */
          <div className="mt-6 space-y-6">
            {/* Filter Bar for Written Tab */}
            {activeTab === "written" && ownMemories.length > 0 ? (
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setVisibilityFilter("all")}
                    className={cn(
                      "rounded-full px-3 py-1 text-[11px] font-medium transition-all",
                      visibilityFilter === "all"
                        ? "bg-black text-white"
                        : "bg-gray-100 text-[#71717A] hover:bg-gray-200",
                    )}
                  >
                    All ({ownMemories.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setVisibilityFilter("public")}
                    className={cn(
                      "rounded-full px-3 py-1 text-[11px] font-medium transition-all",
                      visibilityFilter === "public"
                        ? "bg-black text-white"
                        : "bg-gray-100 text-[#71717A] hover:bg-gray-200",
                    )}
                  >
                    Public ({publicCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setVisibilityFilter("private")}
                    className={cn(
                      "rounded-full px-3 py-1 text-[11px] font-medium transition-all",
                      visibilityFilter === "private"
                        ? "bg-black text-white"
                        : "bg-gray-100 text-[#71717A] hover:bg-gray-200",
                    )}
                  >
                    Private ({privateCount})
                  </button>
                </div>
              </div>
            ) : null}


            {/* Grouped Timeline */}
            {[...grouped.entries()].map(([year, months]) => (
              <div key={year} className="space-y-4">
                <h2 className="font-serif text-lg font-bold text-[#16223B]/60 tracking-wider">
                  {year}
                </h2>

                {[...months.entries()].map(([month, entries]) => (
                  <div key={month} className="space-y-3">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-[#8E8E93]">
                      {month}
                    </p>

                    <div className="space-y-3.5">
                      {entries.map((memory) => {
                        const bangla = isBangla(memory.content) || isBangla(memory.title ?? "");
                        const theme = STORY_THEMES.find((t) => t.id === memory.icon) ?? STORY_THEMES[0];
                        const ThemeIcon = theme.icon;

                        return (
                          <motion.div
                            key={memory.id}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="rounded-2xl border border-[#E2E0D8] bg-white p-4 sm:p-5 shadow-xs transition-all hover:shadow-md hover:border-[#D6D4CC]"
                          >
                            {/* Card Top: Theme & Location & Visibility */}
                            <div className="flex items-center justify-between pb-2 border-b border-gray-100 text-xs">
                              <div className="flex items-center gap-2">
                                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-gray-800">
                                  <ThemeIcon className="h-3.5 w-3.5" />
                                </div>
                                <span className="font-medium text-[11px] text-gray-700">
                                  {theme.label}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                {memory.visibility === "public" ? (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-700">
                                    <Globe className="h-2.5 w-2.5" />
                                    <span>Public</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] text-amber-800">
                                    <Lock className="h-2.5 w-2.5" />
                                    <span>Private</span>
                                  </span>
                                )}
                                <span className="text-[11px] text-[#8E8E93]">
                                  {formatMemoryDate(memory.created_at)}
                                </span>
                              </div>
                            </div>

                            {/* Story Body */}
                            <div className="mt-3">
                              {memory.title ? (
                                <h3 className={cn("font-medium text-sm text-[#1D1D1F] mb-1", bangla && "bn")}>
                                  {memory.title}
                                </h3>
                              ) : null}
                              <p
                                className={cn(
                                  "text-xs sm:text-[13px] leading-relaxed text-[#2C2C2E]",
                                  bangla && "bn text-sm leading-relaxed",
                                )}
                              >
                                {memory.content}
                              </p>
                            </div>

                            {/* Card Footer: Place Name + Fly to Map Action */}
                            <div className="mt-3.5 pt-2.5 flex items-center justify-between border-t border-gray-100 text-xs">
                              <div className="flex items-center gap-1.5 text-[#71717A] text-[11px] truncate max-w-[200px]">
                                <MapPin className="h-3.5 w-3.5 shrink-0 text-black" />
                                <span className="truncate font-medium text-[#1D1D1F]">
                                  {memory.location_name}
                                </span>
                              </div>

                              <Link
                                to="/map"
                                search={{ story: memory.id }}
                                className="inline-flex items-center gap-1 rounded-full bg-gray-50 border border-gray-200 px-3 py-1 text-[11px] font-medium text-[#1D1D1F] hover:bg-black hover:text-white transition-all shadow-2xs"
                              >
                                <span>Fly to Place</span>
                                <ArrowUpRight className="h-3 w-3" />
                              </Link>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNavigation />
    </main>
  );
}
