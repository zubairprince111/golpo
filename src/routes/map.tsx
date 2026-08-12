import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ClientOnly } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type LType from "leaflet";
import { BottomNavigation } from "@/components/navigation/BottomNavigation";
import { MapControls } from "@/components/map/MapControls";
import { WanderFloatingButton } from "@/components/map/WanderFloatingButton";
import { SubmitMemoryModal } from "@/components/stories/SubmitMemoryModal";
import { TermsPolicyModal } from "@/components/modals/TermsPolicyModal";
import type { MapFocus } from "@/components/map/MapCanvas";
import { useAppState } from "@/lib/store";
import type { Memory, Place } from "@/lib/types";
import { X } from "lucide-react";

const MapCanvas = lazy(() => import("@/components/map/MapCanvas"));

export const Route = createFileRoute("/map")({
  validateSearch: (search: Record<string, unknown>) => ({
    story: typeof search["story"] === "string" ? (search["story"] as string) : undefined,
    create: typeof search["create"] === "string" ? (search["create"] as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Public Map — Golpo" },
      {
        name: "description",
        content: "Explore anonymous memories and geographic stories anchored across Bangladesh on Golpo.",
      },
    ],
  }),
  component: MapPage,
});

function MapPage() {
  const { memories, saved, toggleSaved, settings, userLocation } = useAppState();
  const { story, create } = Route.useSearch();
  const navigate = useNavigate();
  const mapRef = useRef<LType.Map | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [focus, setFocus] = useState<MapFocus | null>(null);
  const [ready, setReady] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(Boolean(create));
  const nonce = useRef(0);
  const hasCenteredOnUser = useRef(false);

  const selected = useMemo(
    () => memories.find((m) => m.id === selectedId) ?? null,
    [memories, selectedId],
  );

  const focusOn = useCallback((lat: number, lng: number, zoom: number) => {
    nonce.current += 1;
    setFocus({ latitude: lat, longitude: lng, zoom, nonce: nonce.current });
  }, []);

  // Center on user's current GPS location when map loads if inside Bangladesh
  useEffect(() => {
    if (userLocation && !story && !hasCenteredOnUser.current) {
      hasCenteredOnUser.current = true;
      focusOn(userLocation.latitude, userLocation.longitude, 14);
    }
  }, [userLocation, story, focusOn]);


  const select = useCallback(
    (memory: Memory) => {
      setSelectedId(memory.id);
      focusOn(memory.latitude, memory.longitude, Math.max(14, mapRef.current?.getZoom() ?? 14));
    },
    [focusOn],
  );

  // Deep-link / return from an archive entry
  useEffect(() => {
    if (!story) return;
    const target = memories.find((m) => m.id === story);
    if (!target) return;
    const timer = setTimeout(() => {
      setSelectedId(target.id);
      focusOn(target.latitude, target.longitude, 14);
      void navigate({ to: "/map", search: {}, replace: true });
    }, 500);
    return () => clearTimeout(timer);
  }, [story, memories, focusOn, navigate]);

  // Deep-link to open create form
  useEffect(() => {
    if (create) {
      setCreateOpen(true);
      void navigate({ to: "/map", search: {}, replace: true });
    }
  }, [create, navigate]);

  // Wander / Shuffle action across Bangladesh
  const wander = useCallback(() => {
    const pool = memories.filter((m) => m.visibility === "public" && m.id !== selectedId);
    if (pool.length === 0) return;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    if (!pick) return;

    setSelectedId(null);
    focusOn(pick.latitude, pick.longitude, 14);
    setTimeout(() => {
      setSelectedId(pick.id);
    }, 650);
  }, [memories, selectedId, focusOn]);

  function handleMemoryCreated(id: string, lat: number, lng: number) {
    focusOn(lat, lng, 15);
    setTimeout(() => {
      setSelectedId(id);
    }, 600);
  }

  return (
    <main className="relative h-[100dvh] w-screen overflow-hidden bg-[#EBEAE5]">
      {/* Full-bleed Map Canvas with Anchored Popup */}
      <div className="absolute inset-0">
        <ClientOnly fallback={<MapVeil />}>
          <Suspense fallback={<MapVeil />}>
            <MapCanvas
              memories={memories}
              selectedId={selectedId}
              selectedMemory={selected}
              saved={selected ? saved.includes(selected.id) : false}
              onToggleSaved={() => selected && toggleSaved(selected.id)}
              onSelect={select}
              onCloseStory={() => setSelectedId(null)}
              focus={focus}
              onReady={() => setReady(true)}
              onMapReady={(map) => {
                mapRef.current = map;
              }}
            />
          </Suspense>
        </ClientOnly>
      </div>

      {/* Emergency Admin Broadcast Banner */}
      {settings.emergency_broadcast ? (
        <div className="fixed top-[max(3.75rem,calc(env(safe-area-inset-top)+2.5rem))] inset-x-0 z-[650] flex justify-center px-4 pointer-events-none">
          <div className="pointer-events-auto rounded-full bg-rose-600 px-4 py-1.5 text-xs font-semibold text-white shadow-lg flex items-center gap-2 max-w-lg truncate">
            <span className="h-2 w-2 rounded-full bg-white animate-ping shrink-0" />
            <span className="truncate">{settings.emergency_broadcast}</span>
          </div>
        </div>
      ) : null}

      {/* AMOU Map Controls (Top-left info/settings, top-center Public Map, top-right Search, bottom welcome banner) */}
      <MapControls
        onPlace={(place: Place) => focusOn(place.latitude, place.longitude, 15)}
        onOpenAbout={() => setAboutOpen(true)}
      />

      {/* Floating Bottom-Right Wander Button */}
      <WanderFloatingButton onWander={wander} />

      {/* Floating 4-Icon Frosted Glass Bottom Navigation */}
      <BottomNavigation
        onCreate={() => setCreateOpen(true)}
      />

      {/* Redesigned Submission Form Modal */}
      <SubmitMemoryModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={handleMemoryCreated}
      />

      {/* About Modal */}
      <AnimatePresence>
        {aboutOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/30 backdrop-blur-sm p-4"
            onClick={() => setAboutOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-gray-200 text-[#1D1D1F]"
            >
              {/* Header */}
              <div className="flex items-start justify-between pb-4 border-b border-gray-100">
                <div>
                  <h2 className="font-serif text-2xl font-bold text-[#16223B]">About Golpo</h2>
                  <p className="mt-0.5 text-xs text-[#71717A]">
                    Geographic Memory & Storytelling Archive of Bangladesh
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAboutOpen(false)}
                  aria-label="Close about modal"
                  className="text-gray-400 hover:text-black p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Core Mission Description */}
              <p className="mt-4 text-xs sm:text-[13px] leading-relaxed text-[#3A3A3C]">
                Golpo is a living, location-based archive that attaches human memories, thoughts, and words left unsaid to the exact geography of Bangladesh where they unfolded.
              </p>

              {/* 3 Structured Pillars */}
              <div className="mt-4 space-y-2.5">
                <div className="rounded-xl bg-[#FAF9F6] border border-gray-100 p-3">
                  <h3 className="font-semibold text-xs text-[#1D1D1F]">
                    ✦ Place-Anchored Storytelling
                  </h3>
                  <p className="mt-0.5 text-[11px] text-[#52525B] leading-relaxed">
                    Stories belong to the physical places that gave them life — from quiet tea stalls and launch terminals to university campuses and rain-swept roads.
                  </p>
                </div>

                <div className="rounded-xl bg-[#FAF9F6] border border-gray-100 p-3">
                  <h3 className="font-semibold text-xs text-[#1D1D1F]">
                    ✦ Anonymous & Safe by Design
                  </h3>
                  <p className="mt-0.5 text-[11px] text-[#52525B] leading-relaxed">
                    Every author is assigned a unique anonymous identifier (e.g. <code>GOLPO-XXXXX</code>). No photos, no vanity metrics, and no social algorithms.
                  </p>
                </div>

                <div className="rounded-xl bg-rose-50/60 border border-rose-100 p-3">
                  <h3 className="font-semibold text-xs text-rose-900">
                    ✦ Strict Anti-Harassment Standards
                  </h3>
                  <p className="mt-0.5 text-[11px] text-rose-800 leading-relaxed">
                    Targeting, mocking, bullying, or exposing real personal information (doxxing) is strictly prohibited and subject to immediate deletion.
                  </p>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setAboutOpen(false);
                    setTermsOpen(true);
                  }}
                  className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
                >
                  View Full Terms & Safety Policy →
                </button>

                <button
                  type="button"
                  onClick={() => setAboutOpen(false)}
                  className="rounded-full bg-black px-5 py-2 text-xs font-medium text-white hover:bg-gray-800 transition-all cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Community Safety & Terms Policy Modal */}
      <TermsPolicyModal
        isOpen={termsOpen}
        onClose={() => setTermsOpen(false)}
      />

      {/* Initial Map Resolution Veil */}
      <AnimatePresence>
        {!ready ? (
          <motion.div
            key="map-veil"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 z-[700]"
          >
            <MapVeil />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </main>
  );
}

function MapVeil() {
  return (
    <div className="grid h-full w-full place-items-center bg-[#F6F5F2] select-none">
      <div className="text-center px-4">
        <p className="font-serif text-xs font-bold tracking-[0.28em] text-[#8E8E93] uppercase">
          G O L P O
        </p>
        <p className="mt-2 font-serif italic text-sm text-[#16223B]/80">
          Resolving the landscape of Bangladesh...
        </p>
      </div>
    </div>
  );
}
