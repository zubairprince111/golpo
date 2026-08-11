import { Minus, Plus, Search, Shuffle, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { IconButton } from "@/components/ui/quiet";
import { searchPlaces } from "@/lib/data/places";
import type { Place } from "@/lib/types";

export function MapControls({
  onPlace,
  onWander,
  onZoom,
  panelOpen = false,
}: {
  onPlace: (place: Place) => void;
  onWander: () => void;
  onZoom: (delta: number) => void;
  panelOpen?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const results = searchPlaces(query);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  return (
    <>
      <div className={cn(
          "absolute top-0 right-0 z-[550] flex items-start gap-2 p-4 transition-[margin] duration-500 md:p-6",
          panelOpen && "md:mr-[min(30rem,42vw)]",
        )}>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            {open ? (
              <div className="w-[13rem] border border-border bg-surface/95 shadow-float backdrop-blur-[3px] sm:w-[17rem]">
                <div className="flex items-center gap-2 px-3">
                  <Search className="h-3.5 w-3.5 shrink-0 text-subtle" strokeWidth={1.5} aria-hidden />
                  <label className="sr-only" htmlFor="place-search">
                    Search for a place
                  </label>
                  <input
                    id="place-search"
                    ref={inputRef}
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="City, district, place"
                    className="w-full bg-transparent py-2.5 text-[0.8125rem] text-foreground placeholder:text-subtle focus:outline-none"
                  />
                  <button
                    type="button"
                    aria-label="Close search"
                    onClick={() => {
                      setOpen(false);
                      setQuery("");
                    }}
                    className="text-subtle hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
                  </button>
                </div>
                {results.length ? (
                  <ul className="border-t border-border py-1">
                    {results.map((place) => (
                      <li key={place.name}>
                        <button
                          type="button"
                          onClick={() => {
                            onPlace(place);
                            setOpen(false);
                            setQuery("");
                          }}
                          className="block w-full px-3 py-2 text-left text-[0.8125rem] text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground"
                        >
                          {place.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : (
              <IconButton label="Search for a place" onClick={() => setOpen(true)}>
                <Search className="h-4 w-4" strokeWidth={1.5} aria-hidden />
              </IconButton>
            )}
          </div>

          <div className="hidden flex-col border border-border bg-surface/90 backdrop-blur-[2px] md:flex">
            <button
              type="button"
              aria-label="Zoom in"
              onClick={() => onZoom(1)}
              className="grid h-9 w-9 place-items-center text-foreground/70 transition-colors hover:text-foreground"
            >
              <Plus className="h-4 w-4" strokeWidth={1.5} aria-hidden />
            </button>
            <span className="h-px w-full bg-border" aria-hidden />
            <button
              type="button"
              aria-label="Zoom out"
              onClick={() => onZoom(-1)}
              className="grid h-9 w-9 place-items-center text-foreground/70 transition-colors hover:text-foreground"
            >
              <Minus className="h-4 w-4" strokeWidth={1.5} aria-hidden />
            </button>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onWander}
        className={cn(
          "absolute right-4 bottom-0 z-[550] mb-4 inline-flex items-center gap-2 border-b border-transparent text-xs tracking-[0.08em] text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground md:right-6 md:mb-6",
          panelOpen && "hidden md:inline-flex md:mr-[min(30rem,42vw)]",
        )}
        style={{ marginBottom: "calc(env(safe-area-inset-bottom) + 1.25rem)" }}
      >
        <Shuffle className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
        Wander
      </button>
    </>
  );
}
