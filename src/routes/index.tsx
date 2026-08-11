import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { BANGLADESH_PATH } from "@/components/map/bangladesh-path";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "A Map of Us — Stories live where they happened" },
      {
        name: "description",
        content:
          "A living map of Bangladesh where people leave memories, thoughts and moments attached to the places that created them.",
      },
      { property: "og:title", content: "A Map of Us — Stories live where they happened" },
      {
        property: "og:description",
        content:
          "A quiet archive of human memories, attached to real places across Bangladesh. Explore the map.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const navigate = useNavigate();
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (!leaving) return;
    const timer = setTimeout(() => {
      void navigate({ to: "/map" });
    }, 1900);
    return () => clearTimeout(timer);
  }, [leaving, navigate]);

  return (
    <main className="paper relative min-h-svh overflow-hidden bg-background">
      {/* Cartographic silhouette: part of the composition, not decoration */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-[-12%] hidden w-[62%] items-center justify-center md:flex"
      >
        <BangladeshOutline className="h-[78%] w-auto opacity-[0.5]" />
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-[-6%] flex justify-center md:hidden"
      >
        <BangladeshOutline className="h-[52svh] w-auto opacity-[0.35]" />
      </div>

      <AnimatePresence>
        {!leaving ? (
          <motion.div
            key="intro"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, filter: "blur(2px)" }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 flex min-h-svh flex-col px-6 py-10 sm:px-10 md:px-16 lg:px-24"
          >
            <header className="flex items-center justify-between">
              <p className="label-xs">Bangladesh · 2026</p>
              <p className="label-xs">An archive of places</p>
            </header>

            <div className="flex flex-1 flex-col justify-center py-16 md:max-w-[34rem]">
              <h1 className="font-serif text-[2.5rem] leading-[1.1] tracking-[-0.02em] text-foreground sm:text-[3.25rem] md:text-[3.75rem]">
                A Map
                <br />
                of Us
              </h1>
              <p className="mt-8 max-w-sm font-serif text-lg leading-[1.75] text-muted-foreground sm:text-xl">
                Stories live where they happened.
              </p>

              <div className="mt-14">
                <button
                  type="button"
                  onClick={() => setLeaving(true)}
                  className="group inline-flex items-center gap-4 border-b border-foreground/25 pb-2 text-[0.8125rem] tracking-[0.1em] text-foreground uppercase transition-colors hover:border-foreground"
                >
                  Explore the Map
                  <span
                    aria-hidden
                    className="inline-block transition-transform duration-500 group-hover:translate-x-1"
                  >
                    →
                  </span>
                </button>
              </div>
            </div>

            <footer className="rule pt-5">
              <p className="max-w-md text-xs leading-relaxed text-subtle">
                Every memory is anonymous. Only the place is known.
              </p>
            </footer>
          </motion.div>
        ) : (
          <motion.div
            key="threshold"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="relative z-10 grid min-h-svh place-items-center px-6 text-center"
          >
            <div>
              <motion.p
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 1 }}
                className="font-serif text-xl leading-relaxed text-foreground/80 sm:text-2xl"
              >
                Somewhere, someone left something behind.
              </motion.p>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.1, duration: 0.9 }}
                className="label-xs mt-8"
              >
                Resolving the map
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

/** The national silhouette, drawn as a thin cartographic line over a faint graticule. */
export function BangladeshOutline({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 300 400" className={className} aria-hidden focusable="false">
      <g stroke="var(--map-line)" strokeWidth="0.5" strokeDasharray="1 7">
        {[40, 90, 140, 190, 240, 290, 340].map((y) => (
          <line key={y} x1="0" y1={y} x2="300" y2={y} />
        ))}
        {[20, 70, 120, 170, 220, 270].map((x) => (
          <line key={x} x1={x} y1="0" x2={x} y2="400" />
        ))}
      </g>
      <path
        d={BANGLADESH_PATH}
        fill="var(--map-bg)"
        fillOpacity="0.9"
        stroke="var(--map-line-deep)"
        strokeWidth="0.9"
        strokeLinejoin="round"
      />
    </svg>
  );
}
