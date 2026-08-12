import { AnimatePresence, motion } from "motion/react";
import { Bookmark, Flag, Share2, X, Heart, Users } from "lucide-react";
import { useEffect, useState } from "react";
import type { Memory } from "@/lib/types";
import { formatMemoryDate, isBangla } from "@/lib/format";
import { ReportStoryModal } from "@/components/modals/ReportStoryModal";
import { useAppState } from "@/lib/store";
import { cn } from "@/lib/utils";

function StoryBody({ memory }: { memory: Memory }) {
  const bangla = isBangla(memory.content) || isBangla(memory.title ?? "");
  const latD = Math.floor(Math.abs(memory.latitude));
  const latM = Math.floor((Math.abs(memory.latitude) - latD) * 60);
  const lngD = Math.floor(Math.abs(memory.longitude));
  const lngM = Math.floor((Math.abs(memory.longitude) - lngD) * 60);
  const coordsFormatted = `${latD}°${latM}′N ${lngD}°${lngM}′E`;

  return (
    <article className="flex flex-col">
      {/* Archival Place & Date Colophon */}
      <header className="border-b border-border/70 pb-6">
        <div className="flex items-baseline justify-between gap-4">
          <p className={cn("label-xs text-foreground tracking-[0.18em]", bangla && "bn text-xs")}>
            {memory.location_name}
          </p>
          <span className="label-mono text-[10px] text-subtle">{coordsFormatted}</span>
        </div>

        <p className="label-mono mt-2 text-[11px] text-muted-foreground">
          {formatMemoryDate(memory.created_at)}
        </p>
      </header>

      {/* Story Title / Opening Line */}
      {memory.title ? (
        <h2
          className={cn(
            "mt-8 font-serif text-[1.875rem] leading-[1.22] tracking-[-0.02em] text-foreground sm:text-[2.25rem]",
            bangla && "bn leading-[1.45]",
          )}
        >
          {memory.title}
        </h2>
      ) : null}

      {/* Story Literary Body */}
      <div
        className={cn(
          "prose-story mt-6 text-foreground/90",
          !memory.title && "mt-8",
          bangla && "bn",
        )}
        lang={bangla ? "bn" : "en"}
      >
        {memory.content.split("\n\n").map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>

      {/* Anonymous Signature & Archival Stamp */}
      <footer className="mt-12 border-t border-border/70 pt-6">
        <div className="flex items-end justify-between">
          <div>
            <p className="label-mono text-sm tracking-[0.14em] text-foreground font-medium">
              {memory.anonymous_id}
            </p>
            <p className="label-xs mt-1 text-[10px]">ANONYMOUS AUTHOR</p>
          </div>

          <div className="text-right">
            <span className="label-mono text-[10px] text-subtle uppercase">
              {memory.visibility === "private" ? "PRIVATE ENTRY" : "PUBLIC ON MAP"}
            </span>
          </div>
        </div>
      </footer>
    </article>
  );
}

function ArchivalActions({
  memory,
  saved,
  onToggleSaved,
  onReport,
}: {
  memory: Memory;
  saved: boolean;
  onToggleSaved: () => void;
  onReport: () => void;
}) {
  const { user, reactionCounts, userReactions, toggleReaction } = useAppState();
  const [copied, setCopied] = useState(false);

  const counts = reactionCounts[memory.id] ?? { heart: 0, solidarity: 0 };
  const activeReaction = userReactions[memory.id];
  const hasHearted = activeReaction === "heart";
  const hasSupported = activeReaction === "solidarity";

  async function share() {
    const url = `${window.location.origin}/map?story=${memory.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: memory.location_name, url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      /* user cancelled */
    }
  }

  return (
    <div className="mt-8 flex items-center justify-between border-t border-border pt-4 text-xs">
      <div className="flex items-center gap-5">
        {/* Bookmark / Save (Logged-in only) */}
        {user ? (
          <button
            type="button"
            onClick={onToggleSaved}
            aria-pressed={saved}
            className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
          >
            <Bookmark
              className={cn("h-3.5 w-3.5", saved && "fill-foreground text-foreground")}
              strokeWidth={1.5}
              aria-hidden
            />
            <span className="tracking-[0.06em]">{saved ? "Saved" : "Save"}</span>
          </button>
        ) : null}

        {/* Solidarity (1 reaction per post for everyone) */}
        <button
          type="button"
          onClick={() => void toggleReaction(memory.id, "solidarity")}
          className={cn(
            "inline-flex items-center gap-1.5 transition-colors cursor-pointer",
            hasSupported ? "text-foreground font-semibold" : "text-muted-foreground hover:text-foreground"
          )}
          title={hasSupported ? "Remove solidarity" : "Express solidarity"}
        >
          <Users className={cn("h-3.5 w-3.5", hasSupported && "stroke-[2.5]")} strokeWidth={1.5} aria-hidden />
          <span className="tracking-[0.06em]">{counts.solidarity}</span>
        </button>

        {/* Heart (1 reaction per post for everyone) */}
        <button
          type="button"
          onClick={() => void toggleReaction(memory.id, "heart")}
          className={cn(
            "inline-flex items-center gap-1.5 transition-colors cursor-pointer",
            hasHearted ? "text-rose-600 font-semibold" : "text-muted-foreground hover:text-foreground"
          )}
          title={hasHearted ? "Remove heart" : "Heart story"}
        >
          <Heart
            className={cn("h-3.5 w-3.5 transition-transform active:scale-125", hasHearted && "fill-rose-500 text-rose-500")}
            strokeWidth={1.5}
            aria-hidden
          />
          <span className="tracking-[0.06em]">{counts.heart}</span>
        </button>

        {/* Share */}
        <button
          type="button"
          onClick={share}
          className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
        >
          <Share2 className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
          <span className="tracking-[0.06em]">{copied ? "Link Copied" : "Share"}</span>
        </button>
      </div>

      <button
        type="button"
        onClick={onReport}
        className="inline-flex items-center gap-1.5 text-subtle transition-colors hover:text-rose-600 cursor-pointer"
      >
        <Flag className="h-3 w-3" strokeWidth={1.5} aria-hidden />
        <span className="text-[11px] tracking-[0.06em]">Report</span>
      </button>
    </div>
  );
}

export function StoryPanel({
  memory,
  saved,
  onToggleSaved,
  onClose,
}: {
  memory: Memory | null;
  saved: boolean;
  onToggleSaved: () => void;
  onClose: () => void;
}) {
  const [showReportModal, setShowReportModal] = useState(false);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <AnimatePresence>
      {memory ? (
        <>
          {/* Desktop Reading Surface (A Book Page Over the Map) */}
          <motion.aside
            key={`desktop-reading-page-${memory.id}`}
            role="dialog"
            aria-modal="false"
            aria-label={`Memory at ${memory.location_name}`}
            initial={{ opacity: 0, x: 28 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="absolute top-0 right-0 z-[500] hidden h-full w-[min(32rem,44vw)] overflow-y-auto border-l border-border bg-surface shadow-panel md:block"
          >
            {/* Top Close Header */}
            <div className="sticky top-0 z-20 flex items-center justify-between border-b border-border/40 bg-surface/95 px-8 py-4 backdrop-blur-[3px] lg:px-12">
              <span className="label-mono text-[10px] text-subtle">
                ENTRY {memory.id.toUpperCase()}
              </span>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close reading page"
                className="flex items-center gap-1 text-xs text-subtle transition-colors hover:text-foreground cursor-pointer"
              >
                <span>Close</span>
                <X className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
              </button>
            </div>

            {/* Reading Content */}
            <div className="px-8 pt-8 pb-20 lg:px-12">
              <StoryBody memory={memory} />
              <ArchivalActions
                memory={memory}
                saved={saved}
                onToggleSaved={onToggleSaved}
                onReport={() => setShowReportModal(true)}
              />
            </div>
          </motion.aside>

          {/* Mobile Reading Surface (Paper Page Rising Naturally) */}
          <motion.aside
            key={`mobile-reading-sheet-${memory.id}`}
            role="dialog"
            aria-modal="false"
            aria-label={`Memory at ${memory.location_name}`}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-x-0 bottom-0 z-[500] max-h-[85svh] overflow-y-auto border-t border-border bg-surface shadow-panel md:hidden"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 6rem)" }}
          >
            {/* Mobile Header Bar */}
            <div className="sticky top-0 z-20 flex items-center justify-between border-b border-border/40 bg-surface/95 px-6 py-3.5 backdrop-blur-[3px]">
              <span className="label-mono text-[10px] text-subtle">
                ENTRY {memory.id.toUpperCase()}
              </span>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close reading page"
                className="text-subtle transition-colors hover:text-foreground cursor-pointer"
              >
                <X className="h-4 w-4" strokeWidth={1.5} aria-hidden />
              </button>
            </div>

            {/* Reading Content */}
            <div className="px-6 pt-6">
              <StoryBody memory={memory} />
              <ArchivalActions
                memory={memory}
                saved={saved}
                onToggleSaved={onToggleSaved}
                onReport={() => setShowReportModal(true)}
              />
            </div>
          </motion.aside>

          {/* Report Story Modal */}
          <ReportStoryModal
            isOpen={showReportModal}
            onClose={() => setShowReportModal(false)}
            memory={memory}
          />
        </>
      ) : null}
    </AnimatePresence>
  );
}

