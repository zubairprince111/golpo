import { Bookmark, Heart, Share2, MoreHorizontal, Users, X, Flag, Check } from "lucide-react";
import { useState } from "react";
import type { Memory } from "@/lib/types";
import { formatMemoryDate, isBangla } from "@/lib/format";
import { STORY_THEMES } from "@/lib/data/icons";
import { ReportStoryModal } from "@/components/modals/ReportStoryModal";
import { cn } from "@/lib/utils";
import { useAppState } from "@/lib/store";

export function StoryPopupCard({
  memory,
  saved,
  onToggleSaved,
  onClose,
}: {
  memory: Memory;
  saved: boolean;
  onToggleSaved: () => void;
  onClose: () => void;
}) {
  const { user, reactionCounts, userReactions, toggleReaction } = useAppState();
  const [copied, setCopied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  const bangla = isBangla(memory.content) || isBangla(memory.title ?? "");
  const theme = memory.icon ? STORY_THEMES.find((t) => t.id === memory.icon) : null;
  const ThemeIcon = theme ? theme.icon : null;

  // Real counts from DB (with optimistic updates from store)
  const counts = reactionCounts[memory.id] ?? { heart: 0, solidarity: 0 };
  const activeReaction = userReactions[memory.id];
  const hasHearted = activeReaction === "heart";
  const hasSupported = activeReaction === "solidarity";

  function handleSupport() {
    void toggleReaction(memory.id, "solidarity");
  }

  function handleHeart() {
    void toggleReaction(memory.id, "heart");
  }

  async function handleShare() {
    const url = `${window.location.origin}/map?story=${memory.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: memory.location_name, url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      }
    } catch {
      /* cancelled */
    }
  }

  return (
    <>
      <div
        role="dialog"
        aria-label={`Story at ${memory.location_name}`}
        className="amou-story-balloon relative w-[315px] sm:w-[360px] max-w-[calc(100vw-1.5rem)] p-4 sm:p-5 text-[#1E1E1E] select-text shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Controls Row */}
        <div className="flex items-center justify-between pb-2 mb-1.5 border-b border-black/5">
          {theme && ThemeIcon ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-black/5 px-2.5 py-0.5 text-[10px] font-medium text-gray-700">
              <ThemeIcon className="h-3 w-3 text-gray-600 shrink-0" strokeWidth={2} />
              <span>{theme.label}</span>
            </span>
          ) : (
            <span className="text-[10px] uppercase font-semibold tracking-wider text-gray-400">
              Memory
            </span>
          )}

          <button
            type="button"
            onClick={onClose}
            aria-label="Close story card"
            className="text-[#8E8E93] hover:text-[#1E1E1E] transition-colors p-1 -mr-1"
          >
            <X className="h-3.5 w-3.5" strokeWidth={1.5} />
          </button>
        </div>

        {/* Story Content */}
        <div className="pt-1">
          {memory.title ? (
            <h3 className={cn("font-medium text-sm text-[#1D1D1F] mb-1.5 leading-snug", bangla && "bn")}>
              {memory.title}
            </h3>
          ) : null}

          <p
            className={cn(
              "text-[13px] leading-[1.6] text-[#2C2C2E] font-normal whitespace-pre-line",
              bangla && "bn text-[14px] leading-[1.7]",
            )}
          >
            {memory.content}
          </p>
        </div>

        {/* Author Anonymous Identifier & Geographic Location */}
        <div className="mt-3.5 pt-2 flex items-center justify-between border-t border-black/5">
          <div>
            <p className="text-[11px] font-semibold text-[#3A3A3C]">
              GOLPO-{memory.anonymous_id}
            </p>
            <p className="text-[10px] text-[#8E8E93]">
              {formatMemoryDate(memory.created_at)}
            </p>
          </div>
          <p className="text-[10px] font-medium text-[#71717A] max-w-[150px] truncate text-right">
            📍 {memory.location_name}
          </p>
        </div>

        {/* Bottom Action Row: Reactions, Share, Report */}
        <div className="mt-3 flex items-center justify-between border-t border-[#EBEAE5] pt-2.5 text-[12px] text-[#48484A]">
          {/* Reaction Counters: Bookmark (logged in only), Support, Heart (everyone) */}
          <div className="flex items-center gap-3">
            {/* Bookmark / Save - Only shown when logged in */}
            {user ? (
              <button
                type="button"
                onClick={onToggleSaved}
                className="flex items-center gap-1 transition-colors cursor-pointer hover:text-[#1D1D1F]"
                title={saved ? "Saved in your diary" : "Save story"}
              >
                <Bookmark
                  className={cn("h-3.5 w-3.5", saved && "fill-[#1D1D1F] text-[#1D1D1F]")}
                  strokeWidth={1.5}
                />
                <span className="text-[11px]">{saved ? "Saved" : "Save"}</span>
              </button>
            ) : null}

            {/* Solidarity - 1 reaction per post, available to everyone */}
            <button
              type="button"
              onClick={handleSupport}
              className={cn(
                "flex items-center gap-1 transition-all cursor-pointer",
                hasSupported ? "text-gray-900 font-semibold" : "hover:text-[#1D1D1F] text-[#48484A]"
              )}
              title={hasSupported ? "Remove solidarity" : "Express solidarity"}
            >
              <Users
                className={cn("h-3.5 w-3.5", hasSupported && "text-[#1D1D1F] stroke-[2.5]")}
                strokeWidth={1.5}
              />
              <span className="text-[11px]">{counts.solidarity}</span>
            </button>

            {/* Heart - 1 reaction per post, available to everyone */}
            <button
              type="button"
              onClick={handleHeart}
              className={cn(
                "flex items-center gap-1 transition-all cursor-pointer",
                hasHearted ? "text-rose-600 font-semibold" : "hover:text-[#1D1D1F] text-[#48484A]"
              )}
              title={hasHearted ? "Remove heart" : "Heart story"}
            >
              <Heart
                className={cn(
                  "h-3.5 w-3.5 transition-transform active:scale-125",
                  hasHearted ? "fill-rose-500 text-rose-500" : "text-[#48484A]",
                )}
                strokeWidth={1.5}
              />
              <span className="text-[11px]">{counts.heart}</span>
            </button>
          </div>

          {/* Right Actions: Share & Report Menu */}
          <div className="flex items-center gap-2.5 relative">
            <button
              type="button"
              onClick={handleShare}
              aria-label="Share story"
              className="hover:text-[#1D1D1F] transition-colors p-1 cursor-pointer"
              title={copied ? "Link copied!" : "Share link"}
            >
              {copied ? (
                <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-0.5">
                  <Check className="h-3 w-3" /> Copied
                </span>
              ) : (
                <Share2 className="h-3.5 w-3.5" strokeWidth={1.5} />
              )}
            </button>

            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="More options"
              className="hover:text-[#1D1D1F] transition-colors p-1 cursor-pointer"
            >
              <MoreHorizontal className="h-3.5 w-3.5" strokeWidth={1.5} />
            </button>

            {/* Report Dropdown */}
            {menuOpen ? (
              <div className="absolute bottom-7 right-0 w-36 rounded-xl border border-gray-200 bg-white p-1 shadow-xl z-50 overflow-hidden">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setShowReportModal(true);
                  }}
                  className="flex w-full items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  <Flag className="h-3.5 w-3.5" />
                  <span>Report story</span>
                </button>
              </div>
            ) : null}
          </div>
        </div>

        {/* Auth nudge only for bookmark saving */}
        {!user && (
          <p className="mt-2 text-center text-[10px] text-[#8E8E93]">
            <span className="italic">Sign in to save stories to your private diary</span>
          </p>
        )}
      </div>

      {/* Interactive Report Story Modal */}
      <ReportStoryModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        memory={memory}
      />
    </>
  );
}
