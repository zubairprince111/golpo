import L from "leaflet";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import type { Memory } from "@/lib/types";
import { ICON_SVGS } from "@/lib/data/icons";
import { isWithinBangladesh } from "@/lib/data/places";
import { StoryPopupCard } from "@/components/stories/StoryPopupCard";

export interface MapFocus {
  latitude: number;
  longitude: number;
  zoom?: number;
  nonce: number;
}

const BANGLADESH_CENTER: [number, number] = [23.75, 90.35];
const BANGLADESH_MAX_BOUNDS: L.LatLngBoundsExpression = [
  [20.3, 87.5], // Southwest buffer
  [26.9, 93.0], // Northeast buffer
];
const CLUSTER_RADIUS_PX = 52;

// Soft pastel color palette matching AMOU reference screenshots
const MARKER_COLORS = ["color-rose", "color-peach", "color-lavender", "color-indigo"] as const;

function getMarkerColor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash + id.charCodeAt(i)) % MARKER_COLORS.length;
  }
  return MARKER_COLORS[hash];
}

interface MemoryGroup {
  key: string;
  latitude: number;
  longitude: number;
  members: Memory[];
}

function clusterIcon(count: number) {
  return L.divIcon({
    className: "amou-cluster-badge",
    html: `<span>${count}</span>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

function MemoryMarkersLayer({
  memories,
  selectedId,
  onSelect,
}: {
  memories: Memory[];
  selectedId: string | null;
  onSelect: (memory: Memory) => void;
}) {
  const map = useMap();
  const [groups, setGroups] = useState<MemoryGroup[]>([]);

  // Filter memories strictly within Bangladesh bounds
  const validMemories = useMemo(
    () => memories.filter((m) => isWithinBangladesh(m.latitude, m.longitude)),
    [memories],
  );

  const recompute = useCallback(() => {
    const pending = [...validMemories];
    const result: MemoryGroup[] = [];

    while (pending.length) {
      const seed = pending.shift() as Memory;
      const seedPoint = map.latLngToContainerPoint([seed.latitude, seed.longitude]);
      const members = [seed];

      for (let i = pending.length - 1; i >= 0; i -= 1) {
        const candidate = pending[i] as Memory;
        const point = map.latLngToContainerPoint([candidate.latitude, candidate.longitude]);
        if (seedPoint.distanceTo(point) < CLUSTER_RADIUS_PX) {
          members.push(candidate);
          pending.splice(i, 1);
        }
      }

      const latitude = members.reduce((s, m) => s + m.latitude, 0) / members.length;
      const longitude = members.reduce((s, m) => s + m.longitude, 0) / members.length;
      result.push({ key: seed.id, latitude, longitude, members });
    }

    setGroups(result);
  }, [map, validMemories]);

  useMapEvents({
    zoomend: recompute,
    moveend: recompute,
    resize: recompute,
  });

  useEffect(() => {
    recompute();
  }, [recompute]);

  return (
    <>
      {groups.map((group) => {
        // Render Cluster if > 1 memory
        if (group.members.length > 1) {
          return (
            <Marker
              key={`cluster-${group.key}`}
              position={[group.latitude, group.longitude]}
              icon={clusterIcon(group.members.length)}
              keyboard={false}
              eventHandlers={{
                click: () => {
                  map.flyTo([group.latitude, group.longitude], Math.min(map.getZoom() + 2.5, 16), {
                    duration: 0.8,
                  });
                },
              }}
              alt={`${group.members.length} memories`}
            />
          );
        }

        // Single Memory Marker with Clean Vector SVG
        const memory = group.members[0] as Memory;
        const selected = memory.id === selectedId;
        const colorClass = getMarkerColor(memory.id);
        const svgPath = memory.icon ? ICON_SVGS[memory.icon] || "" : "";

        const icon = L.divIcon({
          className: `amou-marker-dot ${colorClass}`,
          html: `<span data-selected="${selected}">${svgPath}</span>`,
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        });

        return (
          <Marker
            key={memory.id}
            position={[memory.latitude, memory.longitude]}
            icon={icon}
            zIndexOffset={selected ? 1000 : 10}
            keyboard
            title={memory.location_name}
            alt={memory.title ?? memory.location_name}
            eventHandlers={{
              click: () => onSelect(memory),
            }}
          />
        );
      })}
    </>
  );
}

function CameraController({ focus }: { focus: MapFocus | null }) {
  const map = useMap();
  const last = useRef<number>(-1);

  useEffect(() => {
    if (!focus || focus.nonce === last.current) return;
    last.current = focus.nonce;
    const zoom = focus.zoom ?? Math.max(13, map.getZoom());
    const target = L.latLng(focus.latitude, focus.longitude);
    map.flyTo(target, zoom, { duration: 1.1, easeLinearity: 0.25 });
  }, [focus, map]);

  return null;
}

// Coordinate overlay for anchored story card popup directly on the map
function AnchoredStoryOverlay({
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
  const map = useMap();
  const [point, setPoint] = useState<{ x: number; y: number } | null>(null);

  const updatePosition = useCallback(() => {
    if (!memory) {
      setPoint(null);
      return;
    }
    const containerPoint = map.latLngToContainerPoint([memory.latitude, memory.longitude]);
    setPoint({ x: containerPoint.x, y: containerPoint.y });
  }, [map, memory]);

  useMapEvents({
    move: updatePosition,
    zoom: updatePosition,
    resize: updatePosition,
  });

  useEffect(() => {
    updatePosition();
  }, [updatePosition]);

  if (!memory || !point) return null;

  return (
    <div
      className="pointer-events-auto absolute z-[900] transition-transform duration-75"
      style={{
        left: `${point.x}px`,
        top: `${point.y}px`,
        transform: "translate(-50%, calc(-100% - 16px))",
      }}
    >
      <StoryPopupCard
        memory={memory}
        saved={saved}
        onToggleSaved={onToggleSaved}
        onClose={onClose}
      />
    </div>
  );
}

export default function MapCanvas({
  memories,
  selectedId,
  selectedMemory,
  saved,
  onToggleSaved,
  onSelect,
  onCloseStory,
  focus,
  onReady,
  onMapReady,
}: {
  memories: Memory[];
  selectedId: string | null;
  selectedMemory: Memory | null;
  saved: boolean;
  onToggleSaved: () => void;
  onSelect: (memory: Memory) => void;
  onCloseStory: () => void;
  focus: MapFocus | null;
  onReady?: () => void;
  onMapReady?: (map: L.Map) => void;
}) {
  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={BANGLADESH_CENTER}
        zoom={8}
        minZoom={6.5}
        maxZoom={18}
        maxBounds={BANGLADESH_MAX_BOUNDS}
        maxBoundsViscosity={1.0}
        zoomControl={false}
        attributionControl={false}
        className="h-full w-full"
        whenReady={() => onReady?.()}
        ref={(instance) => {
          if (instance) onMapReady?.(instance);
        }}
      >
        {/* Soft, light basemap matching Screenshot 2 */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          subdomains={["a", "b", "c", "d"]}
          maxNativeZoom={19}
        />

        {/* Memory Markers Layer (Pastel Dots with Clean Vector SVGs) */}
        <MemoryMarkersLayer
          memories={memories}
          selectedId={selectedId}
          onSelect={onSelect}
        />

        {/* Camera Coordinator */}
        <CameraController focus={focus} />

        {/* Anchored Story Popup directly above selected marker (Screenshot 3) */}
        <AnchoredStoryOverlay
          memory={selectedMemory}
          saved={saved}
          onToggleSaved={onToggleSaved}
          onClose={onCloseStory}
        />
      </MapContainer>
    </div>
  );
}
