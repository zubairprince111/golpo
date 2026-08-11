import { AnimatePresence, motion } from "motion/react";
import { Bookmark, Flag, Share2, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { Memory } from "@/lib/types";
import { formatMemoryDate, isBangla } from "@/lib/format";
import { Eyebrow } from "@/components/ui/quiet";
import { cn } from "@/lib/utils";

function StoryBody({ memory }: { memory: Memory }) {
  const bangla = isBangla(memory.content) || isBangla(memory.title ?? "");
  return (
    <>
      <div className="grid grid-cols-2 gap-6">
        <div>
          <Eyebrow>Location</Eyebrow>
          <p className={cn("mt-2 text-[0.9375rem] text-foreground", bangla && "bn")}>
            {memory.location_name}
          </p>
        </div>
        <div>
          <Eyebrow>Date</Eyebrow>
          <p className="mt-2 text-[0.9375rem] text-foreground">
            {formatMemoryDate(memory.created_at)}
          </p>
        </div>
      </div>

      <hr className="mt-8 border-border" />

      {memory.title ? (
        <h2
          className={cn(
            "mt-8 font-serif text-[1.75rem] leading-[1.28] tracking-[-0.015em] text-foreground sm:text-[2.125rem]",
            bangla && "bn leading-[1.5]",
          )}
        >
          {memory.title}
        </h2>
      ) : null}

      <div className={cn("prose-story mt-6", bangla && "bn")} lang={bangla ? "bn" : "en"}>
        {memory.content.split("\n\n").map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>

      <div className="mt-12 flex items-end justify-between gap-6">
        <div>
          <p className="font-serif text-lg tracking-[0.06em] text-foreground">
            {memory.anonymous_id}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Anonymous</p>
        </div>
        {memory.visibility === "private" ? (
          <p className="label-xs pb-1">Private · only you</p>
        ) : null}
      </div>
    </>
  );
}

function Actions({
  memory,
  saved,
  onToggleSaved,
}: {
  memory: Memory;
  saved: boolean;
  onToggleSaved: () => void;
}) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = `${window.location.origin}/map?story=${memory.id}`;
    try {
      if (navigator.share) await navigator.share({ title: memory.location_name, url });
      else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      }
    } catch {
      /* cancelled */
    }
  }

  return (
    <div className="mt-10 flex items-center gap-6 border-t border-border pt-5">
      <button
        type="button"
        onClick={onToggleSaved}
        aria-pressed={saved}
        className="inline-flex items-center gap-2 text-xs tracking-[0.06em] text-muted-foreground transition-colors hover:text-foreground"
      >
        <Bookmark className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
        {saved ? "saved" : "save"}
      </button>
      <button
        type="button"
        onClick={share}
        className="inline-flex items-center gap-2 text-xs tracking-[0.06em] text-muted-foreground transition-colors hover:text-foreground"
      >
        <Share2 className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
        {copied ? "link copied" : "share"}
      </button>
      <button
        type="button"
        className="ml-auto inline-flex items-center gap-2 text-xs tracking-[0.06em] text-subtle transition-colors hover:text-foreground"
      >
        <Flag className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
        report
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
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <AnimatePresence>
      {memory ? (
        <>
          {/* Desktop / tablet: editorial panel beside the map */}
          <motion.aside
            key={`panel-${memory.id}`}
            role="dialog"
            aria-modal="false"
            aria-label="Memory"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="absolute top-0 right-0 z-[500] hidden h-full w-[min(30rem,42vw)] overflow-y-auto border-l border-border bg-surface shadow-panel md:block"
          >
            <div className="sticky top-0 flex justify-end bg-surface/95 px-6 pt-6 backdrop-blur-[2px]">
              <button
                type="button"
                onClick={onClose}
                aria-label="Close memory"
                className="text-subtle transition-colors hover:text-foreground"
              >
                <X className="h-4 w-4" strokeWidth={1.5} aria-hidden />
              </button>
            </div>
            <div className="px-10 pt-4 pb-16 lg:px-14">
              <StoryBody memory={memory} />
              <Actions memory={memory} saved={saved} onToggleSaved={onToggleSaved} />
            </div>
          </motion.aside>

          {/* Mobile: a page that rises from the selected place */}
          <motion.aside
            key={`sheet-${memory.id}`}
            role="dialog"
            aria-modal="false"
            aria-label="Memory"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-x-0 bottom-0 z-[500] h-[82svh] overflow-y-auto border-t border-border bg-surface shadow-panel md:hidden"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 7rem)" }}
          >
            <div className="sticky top-0 flex items-center justify-between bg-surface/95 px-6 py-4 backdrop-blur-[2px]">
              <span className="label-xs">Memory</span>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close memory"
                className="text-subtle transition-colors hover:text-foreground"
              >
                <X className="h-4 w-4" strokeWidth={1.5} aria-hidden />
              </button>
            </div>
            <div className="px-6 pt-2">
              <StoryBody memory={memory} />
              <Actions memory={memory} saved={saved} onToggleSaved={onToggleSaved} />
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
