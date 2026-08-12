import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";
import {
  ArrowLeft,
  User,
  Plus,
  BookOpen,
  Bookmark,
  Globe,
  LogOut,
  X,
  Feather,
  ShieldAlert,
} from "lucide-react";
import { BottomNavigation } from "@/components/navigation/BottomNavigation";
import { useAppState } from "@/lib/store";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile — Golpo" },
      {
        name: "description",
        content: "Your anonymous identity and memories on Golpo.",
      },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, profile, ownMemories, saved, signOut, hydrated, reports } = useAppState();
  const navigate = useNavigate();
  const [showBeautyQuote, setShowBeautyQuote] = useState(false);
  const pendingReports = reports.filter((r) => r.status === "pending").length;

  const publicCount = ownMemories.filter((m) => m.visibility === "public").length;

  return (
    <main className="min-h-[100dvh] bg-[#F6F5F2] pb-[calc(6.5rem+env(safe-area-inset-bottom))] px-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] select-text text-[#1E1E1E]">
      <div className="mx-auto w-full max-w-[34rem] pt-[max(1.5rem,env(safe-area-inset-top))]">
        {/* Navigation Back */}
        <Link
          to="/map"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#71717A] hover:text-[#1D1D1F] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Map</span>
        </Link>

        {/* Masthead */}
        <header className="mt-4 border-b border-black/10 pb-4">
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#16223B]">
            Profile & Identity
          </h1>
          <p className="mt-1 text-xs text-[#71717A] leading-relaxed">
            Your anonymous identity and stats on the map of Bangladesh.
          </p>
        </header>

        {!hydrated ? null : !user ? (
          <div className="mt-8 rounded-2xl border border-[#E2E0D8] bg-white p-6 sm:p-8 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-700 mb-3">
              <User className="h-5 w-5" />
            </div>
            <h2 className="font-serif text-lg font-bold text-[#16223B]">
              You are currently browsing anonymously
            </h2>
            <p className="mt-1.5 text-xs text-[#71717A] max-w-sm mx-auto leading-relaxed">
              Sign in to preserve your written memories, sync your bookmarked places, and keep your journal safe.
            </p>
            <div className="mt-5 max-w-xs mx-auto">
              <GoogleSignInButton redirectTo="/profile" label="Sign in with Google" />
            </div>
          </div>
        ) : (
          <div className="mt-6 space-y-5">
            {/* Identity Card with Dummy Avatar + Add Photo Trigger */}
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-[#E2E0D8] bg-white p-5 sm:p-6 shadow-xs"
            >
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 pb-5 border-b border-gray-100 text-center sm:text-left">
                {/* Dummy Avatar with "Add Photo" Badge */}
                <div className="relative shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowBeautyQuote(true)}
                    title="Add profile photo"
                    aria-label="Add profile photo"
                    className="group relative flex h-20 w-20 items-center justify-center rounded-full border-2 border-dashed border-[#D6D4CC] bg-[#FAF9F6] transition-all hover:border-black hover:bg-gray-50 focus:outline-none cursor-pointer"
                  >
                    <User className="h-9 w-9 text-[#8E8E93] group-hover:text-black transition-colors" strokeWidth={1.5} />
                    {/* Pop '+' sign */}
                    <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#1E1E1E] text-white shadow-md transition-transform group-hover:scale-110 group-active:scale-95">
                      <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
                    </div>
                  </button>
                </div>

                {/* Identity Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-[#8E8E93]">
                      Anonymous Identifier
                    </p>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-800 w-fit mx-auto sm:mx-0">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                      Active Session
                    </span>
                  </div>

                  <p className="font-serif text-xl sm:text-2xl font-bold text-[#1D1D1F] mt-0.5">
                    GOLPO-{profile?.anonymous_id ?? "…"}
                  </p>

                  <p className="text-xs text-[#71717A] mt-1 truncate">
                    {user.email}
                  </p>

                  <button
                    type="button"
                    onClick={() => setShowBeautyQuote(true)}
                    className="mt-2 inline-flex items-center gap-1 text-[11px] text-[#71717A] hover:text-black transition-colors cursor-pointer"
                  >
                    <span>Tap avatar to set photo</span>
                    <span className="text-gray-400">→</span>
                  </button>
                </div>
              </div>

              {/* Statistics Grid */}
              <div className="grid grid-cols-3 gap-2.5 pt-4 text-center">
                <div className="rounded-xl bg-[#FAF9F6] border border-gray-100 p-2.5">
                  <p className="text-lg font-bold text-[#1D1D1F]">{ownMemories.length}</p>
                  <p className="text-[10px] font-medium text-[#71717A] flex items-center justify-center gap-1 mt-0.5">
                    <BookOpen className="h-3 w-3" />
                    <span>Total Memories</span>
                  </p>
                </div>

                <div className="rounded-xl bg-[#FAF9F6] border border-gray-100 p-2.5">
                  <p className="text-lg font-bold text-[#1D1D1F]">{publicCount}</p>
                  <p className="text-[10px] font-medium text-[#71717A] flex items-center justify-center gap-1 mt-0.5">
                    <Globe className="h-3 w-3" />
                    <span>Public on Map</span>
                  </p>
                </div>

                <div className="rounded-xl bg-[#FAF9F6] border border-gray-100 p-2.5">
                  <p className="text-lg font-bold text-[#1D1D1F]">{saved.length}</p>
                  <p className="text-[10px] font-medium text-[#71717A] flex items-center justify-center gap-1 mt-0.5">
                    <Bookmark className="h-3 w-3" />
                    <span>Saved Stories</span>
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Quick Access to Diary */}
            <Link
              to="/memories"
              className="group flex items-center justify-between rounded-2xl border border-[#E2E0D8] bg-white p-4 sm:p-5 shadow-xs transition-all hover:shadow-md hover:border-black/20"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-white shadow-sm">
                  <BookOpen className="h-5 w-5" strokeWidth={1.75} />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-semibold text-[#1D1D1F]">
                    Open My Diary
                  </p>
                  <p className="text-[11px] text-[#71717A]">
                    Review and manage all your anchored memories & saved bookmarks
                  </p>
                </div>
              </div>
              <span className="text-xs font-medium text-black group-hover:translate-x-0.5 transition-transform">
                →
              </span>
            </Link>

            {/* Moderation & Safety Center Link */}
            <Link
              to="/moderation"
              className="group flex items-center justify-between rounded-2xl border border-[#E2E0D8] bg-white p-4 sm:p-5 shadow-xs transition-all hover:shadow-md hover:border-black/20"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-50 border border-rose-200 text-rose-600 shadow-xs">
                  <ShieldAlert className="h-5 w-5" strokeWidth={1.75} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs sm:text-sm font-semibold text-[#1D1D1F]">
                      Moderation & Safety Center
                    </p>
                    {pendingReports > 0 && (
                      <span className="rounded-full bg-rose-600 px-2 py-0.2 text-[10px] font-bold text-white">
                        {pendingReports} new
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#71717A]">
                    Review reported memories, purge violations, and enforce community standards
                  </p>
                </div>
              </div>
              <span className="text-xs font-medium text-black group-hover:translate-x-0.5 transition-transform">
                →
              </span>
            </Link>

            {/* Colophon on Anonymity */}
            <div className="rounded-2xl border border-[#E2E0D8] bg-[#FAF9F6] p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-1.5 text-gray-700">
                <Feather className="h-3.5 w-3.5" />
                <span className="text-[11px] font-bold uppercase tracking-wider">The Colophon</span>
              </div>
              <p className="font-serif italic text-xs leading-relaxed text-[#48484A]">
                “On this map, everyone is a stranger who loved something once. No profile pictures, no followers, no vanity — just places and the moments they remember.”
              </p>
            </div>

            {/* Logout / Switch Session */}
            <div className="pt-2 flex items-center justify-between">
              <span className="text-[11px] text-[#8E8E93]">
                Logged in as <strong className="text-gray-700">{user?.email}</strong>
              </span>
              <button
                type="button"
                onClick={async () => {
                  await signOut();
                  void navigate({ to: "/map" });
                }}
                className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-4 py-1.5 text-xs font-medium text-rose-600 shadow-2xs hover:bg-rose-50 hover:border-rose-200 transition-all"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* AMOU Poetic Whisper Modal (Exact match to AMOU's Masthead & Philosophy Style) */}
      <AnimatePresence>
        {showBeautyQuote && (
          <div className="fixed inset-0 z-[1100] flex items-center justify-center p-6 select-text">
            {/* Ambient Cream Glass Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowBeautyQuote(false)}
              className="fixed inset-0 bg-[#F6F5F2]/80 backdrop-blur-md"
            />

            {/* AMOU Philosophy Style Card */}
            <motion.div
              initial={{ scale: 0.96, opacity: 0, y: 6 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 6 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="relative z-10 w-full max-w-sm rounded-3xl bg-white/95 p-7 sm:p-8 shadow-2xl border border-black/10 text-center"
            >
              <button
                type="button"
                onClick={() => setShowBeautyQuote(false)}
                aria-label="Close note"
                className="absolute top-4 right-4 text-[#8E8E93] hover:text-[#1E1E1E] transition-colors p-1"
              >
                <X className="h-4 w-4" strokeWidth={1.5} />
              </button>

              <h2 className="font-serif text-sm font-bold tracking-[0.24em] text-[#16223B] uppercase">
                GOLPO
              </h2>

              <div className="my-4 h-px w-10 bg-black/10 mx-auto" />

              <p className="font-serif italic text-lg sm:text-xl text-[#1E1E1E] leading-relaxed">
                “I know you are beautiful.”
              </p>

              <p className="mt-3 font-serif text-xs leading-relaxed text-[#52525B]">
                Leave your face to the mirror, and your heart to the map. Here, anonymity is our quiet sanctuary — only the places you loved need to be remembered.
              </p>

              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => setShowBeautyQuote(false)}
                  className="rounded-full border border-black/15 bg-white px-6 py-2 text-xs font-medium tracking-[0.14em] text-[#1E1E1E] uppercase shadow-xs hover:bg-black hover:text-white transition-all"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <BottomNavigation />
    </main>
  );
}
