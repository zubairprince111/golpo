import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { useState, useEffect } from "react";
import { useAppState } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Golpo — For the moments that matter." },
      {
        name: "description",
        content: "Golpo — an anonymous geographic storytelling platform for Bangladesh.",
      },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  const { user, hydrated } = useAppState();
  const navigate = useNavigate();
  const [entering, setEntering] = useState(false);

  useEffect(() => {
    // Auto-forward logged in users directly to the map
    if (hydrated && user) {
      void navigate({ to: "/map", replace: true });
    }
  }, [hydrated, user, navigate]);

  function enterApp() {
    setEntering(true);
    setTimeout(() => {
      void navigate({ to: "/map" });
    }, 2800);
  }

  return (
    <main className="relative flex min-h-[100dvh] w-full flex-col justify-between overflow-hidden bg-[#F6F5F2] text-[#1E1E1E] select-none">
      {/* Responsive Background Artwork */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden z-0">
        {/* Mobile Background Image (< 768px) */}
        <img
          src="/mobile.png"
          alt=""
          className="block md:hidden h-full w-full object-cover object-center"
        />

        {/* Desktop Background Image (>= 768px) */}
        <img
          src="/desktop.png"
          alt=""
          className="hidden md:block h-full w-full object-cover object-center"
        />

        {/* Subtle Ambient Vignette & Contrast Overlay */}
        <div className="absolute inset-0 bg-[#F6F5F2]/15" />
      </div>

      {/* Center Hero — flex-1 ensures centering regardless of footer height */}
      <div className="relative z-20 flex flex-1 items-center justify-center">
        <AnimatePresence mode="wait">
          {!entering ? (
            <motion.div
              key="hero-content"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center px-6 text-center"
            >
              {/* Main Tracked Serif Title */}
              <h1 className="font-serif text-[1.875rem] font-bold tracking-[0.34em] text-[#16223B] sm:text-[2.25rem] md:text-[2.6rem] drop-shadow-xs">
                G O L P O
              </h1>

              {/* Subtitle */}
              <p className="font-serif mt-3 text-sm text-[#3A3A3C] sm:text-base">
                For the moments that matter.
              </p>

              {/* Enter Button */}
              <div className="mt-8 sm:mt-10">
                <button
                  type="button"
                  onClick={enterApp}
                  className="group relative inline-flex items-center justify-center rounded-full border border-black/15 bg-white/95 px-8 py-2.5 text-[0.8125rem] font-medium tracking-[0.14em] text-[#1E1E1E] uppercase shadow-md backdrop-blur-xs transition-all duration-200 hover:bg-white hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                >
                  ENTER GOLPO
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="entering-veil"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center text-center px-6 max-w-lg"
            >
              <span className="font-serif text-[11px] font-bold tracking-[0.32em] text-[#8E8E93] uppercase mb-3">
                G O L P O
              </span>

              <p className="font-serif italic text-base sm:text-xl text-[#16223B] leading-relaxed">
                "Every place holds a memory someone left behind."
              </p>

              <p className="mt-3 font-serif text-xs text-[#71717A] max-w-sm leading-relaxed">
                Opening the living map of Bangladesh...
              </p>

              {/* Subtle animated breathing progress indicator */}
              <div className="mt-6 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#16223B] animate-ping" />
                <span className="h-1.5 w-1.5 rounded-full bg-[#16223B]/60" />
                <span className="h-1.5 w-1.5 rounded-full bg-[#16223B]/30" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Left Author Credit */}
      <footer className="relative z-20 p-5 sm:p-6 md:p-8 pb-[max(1.25rem,env(safe-area-inset-bottom))] pl-[max(1.25rem,env(safe-area-inset-left))] flex justify-start items-end">
        <p className="font-sans text-[11px] text-gray-500 font-normal tracking-normal">
          Made by{" "}
          <a
            href="https://www.aajubair.me/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-gray-700 underline underline-offset-2 hover:text-black transition-colors"
          >
            aajp
          </a>
        </p>
      </footer>
    </main>
  );
}
