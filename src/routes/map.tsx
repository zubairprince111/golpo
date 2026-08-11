import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ClientOnly } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type LType from "leaflet";
import { BottomNavigation } from "@/components/navigation/BottomNavigation";
import { MapControls } from "@/components/map/MapControls";
import { StoryPanel } from "@/components/stories/StoryPanel";
import type { MapFocus } from "@/components/map/MapCanvas";
import { useAppState } from "@/lib/store";
import type { Memory, Place } from "@/lib/types";

const MapCanvas = lazy(() => import("@/components/map/MapCanvas"));

export const Route = createFileRoute("/map")({
  validateSearch: (search: Record<string, unknown>) => ({
    story: typeof search["story"] === "string" ? (search["story"] as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "The Map — A Map of Us" },
      {
        name: "description",
        content:
          "Explore Bangladesh and read memories left at the exact places where they happened.",
      },
      { property: "og:title", content: "The Map — A Map of Us" },
      {
        property: "og:description",
        content: "Find a marked place, open it, and read a page from a stranger's life.",
      },
    ],
  }),
  component: MapPage,
});

function MapPage() {
  const { memories, saved, toggleSaved } = useAppState();
  const { story } = Route.useSearch();
  const navigate = useNavigate();
  const mapRef = useRef<LType.Map | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [focus, setFocus] = useState<MapFocus | null>(null);
  const [ready, setReady] = useState(false);
  const nonce = useRef(0);

  const selected = useMemo(
    () => memories.find((m) => m.id === selectedId) ?? null,
    [memories, selectedId],
  );

  const focusOn = useCallback((lat: number, lng: number, zoom: number, offset = false) => {
    nonce.current += 1;
    setFocus({ latitude: lat, longitude: lng, zoom, nonce: nonce.current, offsetForPanel: offset });
  }, []);

  const select = useCallback(
    (memory: Memory) => {
      setSelectedId(memory.id);
      focusOn(memory.latitude, memory.longitude, Math.max(11, mapRef.current?.getZoom() ?? 11), true);
    },
    [focusOn],
  );

  // Deep link / return from an archive entry
  useEffect(() => {
    if (!story) return;
    const target = memories.find((m) => m.id === story);
    if (!target) return;
    const timer = setTimeout(() => {
      setSelectedId(target.id);
      focusOn(target.latitude, target.longitude, 12, true);
      void navigate({ to: "/map", search: {}, replace: true });
    }, 700);
    return () => clearTimeout(timer);
  }, [story, memories, focusOn, navigate]);

  const wander = useCallback(() => {
    const pool = memories.filter((m) => m.visibility === "public" && m.id !== selectedId);
    const pick = pool[Math.floor(Math.random() * pool.length)];
    if (!pick) return;
    setSelectedId(null);
    focusOn(pick.latitude, pick.longitude, 12, true);
    setTimeout(() => setSelectedId(pick.id), 1100);
  }, [memories, selectedId, focusOn]);

  return (
    <main className="relative h-svh w-full overflow-hidden bg-map">
      <div className="absolute inset-0">
        <ClientOnly fallback={<MapVeil label="Resolving the map" />}>
          <Suspense fallback={<MapVeil label="Resolving the map" />}>
            <MapCanvas
              memories={memories}
              selectedId={selectedId}
              onSelect={select}
              focus={focus}
              onReady={() => setReady(true)}
              onMapReady={(map) => {
                mapRef.current = map;
              }}
            />
          </Suspense>
        </ClientOnly>
      </div>

      <div className="absolute top-0 left-0 z-[550] p-4 md:p-6">
        <p className="font-serif text-sm tracking-[0.02em] text-foreground/80">A Map of Us</p>
        <p className="label-xs mt-1.5">
          {memories.filter((m) => m.visibility === "public").length} memories · Bangladesh
        </p>
      </div>

      <MapControls
        panelOpen={Boolean(selected)}
        onPlace={(place: Place) => focusOn(place.latitude, place.longitude, 13)}
        onWander={wander}
        onZoom={(delta) => {
          const map = mapRef.current;
          if (map) map.setZoom(map.getZoom() + delta);
        }}
      />

      <StoryPanel
        memory={selected}
        saved={selected ? saved.includes(selected.id) : false}
        onToggleSaved={() => selected && toggleSaved(selected.id)}
        onClose={() => setSelectedId(null)}
      />

      <BottomNavigation />

      <AnimatePresence>
        {!ready ? (
          <motion.div
            key="veil"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            className="absolute inset-0 z-[700]"
          >
            <MapVeil label="Resolving the map" />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </main>
  );
}

function MapVeil({ label }: { label: string }) {
  return (
    <div className="paper grid h-full w-full place-items-center bg-background">
      <p className="label-xs">{label}</p>
    </div>
  );
}
