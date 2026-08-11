import L from "leaflet";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import type { Memory } from "@/lib/types";

export interface MapFocus {
  latitude: number;
  longitude: number;
  zoom?: number;
  /** Changing this value re-triggers the camera move. */
  nonce: number;
  /** Shift the target left on wide screens so the reading panel does not cover it. */
  offsetForPanel?: boolean;
}

const BANGLADESH_CENTER: [number, number] = [23.75, 90.35];
const BANGLADESH_BOUNDS = L.latLngBounds([19.9, 87.4], [26.9, 93.2]);
const CLUSTER_RADIUS_PX = 54;

interface Group {
  key: string;
  latitude: number;
  longitude: number;
  members: Memory[];
}

function clusterIcon(count: number) {
  return L.divIcon({
    className: "amou-cluster",
    html: `<span>${count}</span>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
}

function MemoryLayer({
  memories,
  selectedId,
  onSelect,
}: {
  memories: Memory[];
  selectedId: string | null;
  onSelect: (memory: Memory) => void;
}) {
  const map = useMap();
  const [groups, setGroups] = useState<Group[]>([]);

  const recompute = useCallback(() => {
    const pending = [...memories];
    const result: Group[] = [];
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
  }, [map, memories]);

  useMapEvents({ zoomend: recompute, moveend: recompute, resize: recompute });
  useEffect(() => {
    recompute();
  }, [recompute]);

  return (
    <>
      {groups.map((group) => {
        if (group.members.length > 1) {
          return (
            <Marker
              key={`c-${group.key}`}
              position={[group.latitude, group.longitude]}
              icon={clusterIcon(group.members.length)}
              keyboard={false}
              eventHandlers={{
                click: () => {
                  map.flyTo([group.latitude, group.longitude], Math.min(map.getZoom() + 2.5, 15), {
                    duration: 1,
                  });
                },
              }}
              alt={`${group.members.length} memories near here`}
            />
          );
        }
        const memory = group.members[0] as Memory;
        const selected = memory.id === selectedId;
        const icon = L.divIcon({
          className: "amou-dot",
          html: `<span></span>`,
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        });
        return (
          <Marker
            key={memory.id}
            position={[memory.latitude, memory.longitude]}
            icon={icon}
            zIndexOffset={selected ? 1000 : 0}
            keyboard
            title={memory.location_name}
            alt={`Memory at ${memory.location_name}`}
            eventHandlers={{
              add: (event) => {
                const el = (event.target as L.Marker).getElement();
                if (!el) return;
                el.dataset["selected"] = String(selected);
                el.dataset["private"] = String(memory.visibility === "private");
                el.setAttribute("role", "button");
                el.setAttribute("tabindex", "0");
              },
              click: () => onSelect(memory),
              keydown: (event) => {
                const key = (event as unknown as { originalEvent: KeyboardEvent }).originalEvent.key;
                if (key === "Enter" || key === " ") onSelect(memory);
              },
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
    const zoom = focus.zoom ?? 12;
    let target = L.latLng(focus.latitude, focus.longitude);
    if (focus.offsetForPanel && map.getContainer().clientWidth >= 1024) {
      const point = map.project(target, zoom);
      target = map.unproject(point.add([-Math.min(280, map.getContainer().clientWidth * 0.16), 0]), zoom);
    }
    map.flyTo(target, zoom, { duration: 1.5, easeLinearity: 0.22 });
  }, [focus, map]);

  return null;
}

export default function MapCanvas({
  memories,
  selectedId,
  onSelect,
  focus,
  onReady,
  onMapReady,
}: {
  memories: Memory[];
  selectedId: string | null;
  onSelect: (memory: Memory) => void;
  focus: MapFocus | null;
  onReady?: () => void;
  onMapReady?: (map: L.Map) => void;
}) {
  const attribution = useMemo(
    () => '&copy; OpenStreetMap &middot; CARTO',
    [],
  );

  return (
    <MapContainer
      center={BANGLADESH_CENTER}
      zoom={7}
      minZoom={6}
      maxZoom={17}
      zoomControl={false}
      attributionControl
      maxBounds={BANGLADESH_BOUNDS.pad(0.6)}
      maxBoundsViscosity={0.7}
      zoomSnap={0.25}
      className="h-full w-full"
      whenReady={() => onReady?.()}
      ref={(instance) => {
        if (instance) onMapReady?.(instance);
      }}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
        subdomains={["a", "b", "c", "d"]}
        attribution={attribution}
        maxNativeZoom={19}
      />
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png"
        subdomains={["a", "b", "c", "d"]}
        opacity={0.75}
        maxNativeZoom={19}
      />
      <MemoryLayer memories={memories} selectedId={selectedId} onSelect={onSelect} />
      <CameraController focus={focus} />
    </MapContainer>
  );
}
