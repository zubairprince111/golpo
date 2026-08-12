import { useState, useRef, useEffect } from "react";
import { Search, X, MapPin } from "lucide-react";
import type { Place } from "@/lib/types";
import { searchPlaces } from "@/lib/data/places";

export function MapControls({
  onPlace,
  onOpenAbout,
}: {
  onPlace: (place: Place) => void;
  onOpenAbout?: () => void;
}) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [showBanner, setShowBanner] = useState(true);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const results = searchPlaces(query);

  useEffect(() => {
    if (searchOpen) {
      searchInputRef.current?.focus();
    }
  }, [searchOpen]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      {/* Top Controls: Left-aligned About Trigger + Right-aligned Search Pill */}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-[600] flex items-center justify-between px-4 sm:px-6">
        {/* Left: Aesthetic "About" Badge Pill */}
        <div className="pointer-events-auto">
          <button
            type="button"
            aria-label="About Golpo"
            onClick={onOpenAbout}
            className="flex items-center gap-1.5 rounded-full amou-glass-pill px-3.5 py-1.5 text-xs font-medium text-[#1D1D1F] shadow-sm transition-all hover:bg-white active:scale-95"
          >
            <span className="font-serif italic font-semibold">About</span>
            <span className="text-[10px] text-[#8E8E93]">Golpo</span>
          </button>
        </div>

        {/* Right: Search Pill */}
        {!searchOpen ? (
          <div className="pointer-events-auto">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="Search places across Bangladesh"
              className="flex h-10 w-10 items-center justify-center rounded-full amou-glass-pill shadow-sm transition-transform hover:scale-105 active:scale-95"
            >
              <Search className="h-4 w-4 text-[#48484A]" />
            </button>
          </div>
        ) : (
          <div ref={containerRef} className="pointer-events-auto relative w-72 sm:w-80">
            <div className="flex items-center gap-2 rounded-full amou-glass-pill px-3.5 py-2 shadow-lg">
              <Search className="h-4 w-4 text-[#8E8E93] shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search city, area in Bangladesh..."
                className="w-full bg-transparent text-xs text-[#1D1D1F] placeholder:text-[#8E8E93] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  setSearchOpen(false);
                  setQuery("");
                }}
                className="text-[#8E8E93] hover:text-black p-1"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {results.length > 0 ? (
              <ul className="absolute top-full right-0 mt-2 w-full rounded-2xl amou-glass-card py-1.5 shadow-xl max-h-48 overflow-y-auto">
                {results.map((place) => (
                  <li key={place.name}>
                    <button
                      type="button"
                      onClick={() => {
                        onPlace(place);
                        setSearchOpen(false);
                        setQuery("");
                      }}
                      className="w-full px-3.5 py-2 text-left text-xs text-[#48484A] hover:bg-black/5 hover:text-[#1D1D1F] flex items-center justify-between"
                    >
                      <span className="font-medium">{place.name}</span>
                      <span className="text-[10px] text-[#8E8E93]">Bangladesh</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        )}
      </div>

      {/* Floating Welcome Disclaimer Banner positioned safely above navbar & shuffle button */}
      {showBanner ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-28 sm:bottom-24 z-[580] flex justify-center px-4 sm:px-6 pb-[env(safe-area-inset-bottom)]">
          <div className="pointer-events-auto flex items-center justify-between gap-3 rounded-full amou-glass-pill pl-4 pr-2.5 py-2 text-xs text-[#2C2C2E] shadow-md max-w-[340px] sm:max-w-md border border-black/5 backdrop-blur-md">
            <p className="text-[11px] sm:text-xs leading-normal text-left">
              Welcome to Golpo — a map of memories. Before leaving one, please read the{" "}
              <button
                type="button"
                onClick={onOpenAbout}
                className="underline hover:text-black font-semibold inline cursor-pointer"
              >
                About
              </button>{" "}
              section.
            </p>
            <button
              type="button"
              onClick={() => setShowBanner(false)}
              aria-label="Dismiss banner"
              className="flex h-6 w-6 items-center justify-center rounded-full bg-black/5 hover:bg-black/15 text-[#48484A] hover:text-black transition-colors shrink-0"
            >
              <X className="h-3.5 w-3.5" strokeWidth={2} />
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
