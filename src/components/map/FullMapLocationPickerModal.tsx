import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import {
  X,
  Search,
  MapPin,
  Check,
  Navigation,
  Loader2,
  Move,
  ArrowLeft,
  Plus,
  Minus,
} from "lucide-react";
import {
  isWithinBangladesh,
  reverseGeocodeLiveLocation,
  searchPlaces,
  BANGLADESH_GEO_BOUNDS,
  type Place,
} from "@/lib/data/places";
import { useAppState } from "@/lib/store";
import { cn } from "@/lib/utils";

interface FullMapLocationPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialLatitude?: number;
  initialLongitude?: number;
  initialPlaceName?: string;
  onConfirm: (location: { name: string; latitude: number; longitude: number }) => void;
}

// Custom prominent ink pin for the full map picker
function createPickerPinIcon() {
  return L.divIcon({
    className: "golpo-fullmap-picker-pin",
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: grab; touch-action: none; user-select: none;">
        <div style="
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: #16223B;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 6px 20px rgba(22, 34, 59, 0.55);
          border: 3px solid #FFFFFF;
        ">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
        </div>
        <div style="width: 3px; height: 10px; background: #16223B; margin-top: -1px;"></div>
        <div style="width: 14px; height: 5px; border-radius: 50%; background: rgba(0,0,0,0.35); filter: blur(1.5px);"></div>
      </div>
    `,
    iconSize: [38, 52],
    iconAnchor: [19, 52],
  });
}

function MapController({
  lat,
  lng,
  onMapClick,
  onMapReady,
}: {
  lat: number;
  lng: number;
  onMapClick: (lat: number, lng: number) => void;
  onMapReady?: (map: L.Map) => void;
}) {
  const map = useMap();

  useEffect(() => {
    if (onMapReady) onMapReady(map);

    // Multiple invalidateSize passes to guarantee layout calculation on all mobile devices
    map.invalidateSize();
    const t1 = setTimeout(() => map.invalidateSize(), 100);
    const t2 = setTimeout(() => map.invalidateSize(), 350);
    const t3 = setTimeout(() => map.invalidateSize(), 700);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [map, onMapReady]);

  useEffect(() => {
    map.setView([lat, lng], map.getZoom(), { animate: true });
  }, [lat, lng, map]);

  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });

  return null;
}

export function FullMapLocationPickerModal({
  isOpen,
  onClose,
  initialLatitude,
  initialLongitude,
  initialPlaceName,
  onConfirm,
}: FullMapLocationPickerModalProps) {
  const { userLocation, requestUserLocation } = useAppState();

  const defaultLat = initialLatitude ?? userLocation?.latitude ?? 23.8103;
  const defaultLng = initialLongitude ?? userLocation?.longitude ?? 90.4125;
  const defaultName = initialPlaceName ?? userLocation?.name ?? "Dhaka, Bangladesh";

  const [pos, setPos] = useState<[number, number]>([defaultLat, defaultLng]);
  const [placeName, setPlaceName] = useState(defaultName);
  const [searchQuery, setSearchQuery] = useState("");
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [detectingGps, setDetectingGps] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const markerRef = useRef<L.Marker | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const pinIcon = useMemo(() => createPickerPinIcon(), []);
  const searchResults = useMemo(() => searchPlaces(searchQuery, 5), [searchQuery]);

  const handleZoomIn = useCallback(() => {
    mapInstanceRef.current?.zoomIn();
  }, []);

  const handleZoomOut = useCallback(() => {
    mapInstanceRef.current?.zoomOut();
  }, []);



  // Reset to initial location or user's current GPS location when modal opens
  useEffect(() => {
    if (isOpen) {
      const lat = initialLatitude ?? userLocation?.latitude ?? 23.8103;
      const lng = initialLongitude ?? userLocation?.longitude ?? 90.4125;
      const name = initialPlaceName ?? userLocation?.name ?? "Current Location";
      setPos([lat, lng]);
      setPlaceName(name);
      setSearchQuery("");
      setErrorMsg(null);

      // If user hasn't granted location yet, try requesting it
      if (!initialLatitude && !userLocation) {
        void requestUserLocation().then((loc) => {
          if (loc && isWithinBangladesh(loc.latitude, loc.longitude)) {
            setPos([loc.latitude, loc.longitude]);
            if (loc.name) setPlaceName(loc.name);
          }
        });
      }
    }
  }, [isOpen, initialLatitude, initialLongitude, initialPlaceName, userLocation, requestUserLocation]);


  const updateCoordinates = useCallback(async (newLat: number, newLng: number, overrideName?: string) => {
    if (!isWithinBangladesh(newLat, newLng)) {
      setErrorMsg("Please keep the location within the borders of Bangladesh.");
      return;
    }

    setErrorMsg(null);
    setPos([newLat, newLng]);

    if (overrideName) {
      setPlaceName(overrideName);
      return;
    }

    // Auto reverse geocode
    setIsGeocoding(true);
    try {
      const resolved = await reverseGeocodeLiveLocation(newLat, newLng);
      if (resolved?.name) {
        setPlaceName(resolved.name);
      }
    } catch {
      // Retain previous or fallback
    } finally {
      setIsGeocoding(false);
    }
  }, []);

  const markerHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker) {
          const latLng = marker.getLatLng();
          void updateCoordinates(latLng.lat, latLng.lng);
        }
      },
    }),
    [updateCoordinates]
  );

  function handleGpsLocate() {
    if (!navigator.geolocation) {
      setErrorMsg("Location services are not supported by your browser.");
      return;
    }

    setDetectingGps(true);
    setErrorMsg(null);

    navigator.geolocation.getCurrentPosition(
      async (p) => {
        setDetectingGps(false);
        const { latitude, longitude } = p.coords;
        if (!isWithinBangladesh(latitude, longitude)) {
          setErrorMsg("Your GPS location is outside Bangladesh.");
          return;
        }
        await updateCoordinates(latitude, longitude);
      },
      (err) => {
        setDetectingGps(false);
        setErrorMsg(
          err.code === err.PERMISSION_DENIED
            ? "Location permission was denied."
            : "Could not retrieve GPS coordinates."
        );
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  function handleSelectSearchResult(place: Place) {
    setSearchQuery("");
    void updateCoordinates(place.latitude, place.longitude, place.name);
  }

  function handleSave() {
    onConfirm({
      name: placeName || "Pinned Location",
      latitude: pos[0],
      longitude: pos[1],
    });
    onClose();
  }

  if (!isOpen || typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[1300] flex flex-col h-[100dvh] w-screen overflow-hidden bg-[#FAF9F6] select-text">
        {/* Top Floating Action Bar */}
        <header
          onPointerDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          className="absolute top-3 left-3 right-3 sm:top-4 sm:left-6 sm:right-6 z-[1000] flex flex-col sm:flex-row items-center gap-2 sm:gap-3 pointer-events-none"
        >
          {/* Back Button & Search Bar (pointer events active) */}
          <div className="flex w-full items-center gap-2 pointer-events-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white shadow-md border border-[#E2E0D8] text-[#16223B] hover:bg-gray-50 transition-colors cursor-pointer"
              title="Close map"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>

            {/* In-Map Search Input */}
            <div className="relative flex-1">
              <div className="flex h-11 items-center gap-2 rounded-2xl bg-white px-3.5 shadow-md border border-[#E2E0D8]">
                <Search className="h-4 w-4 text-[#8E8E93] shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search a place, district, or landmark in Bangladesh..."
                  className="w-full bg-transparent text-xs sm:text-sm text-[#1D1D1F] placeholder:text-[#8E8E93] focus:outline-none"
                />
                {searchQuery ? (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="text-gray-400 hover:text-black p-1"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                ) : null}
              </div>

              {/* Search Suggestions Dropdown */}
              {searchResults.length > 0 ? (
                <ul className="absolute top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-2xl border border-[#E2E0D8] bg-white p-1 shadow-xl z-50">
                  {searchResults.map((opt) => (
                    <li key={opt.name}>
                      <button
                        type="button"
                        onClick={() => handleSelectSearchResult(opt)}
                        className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs text-[#1D1D1F] hover:bg-gray-100 transition-colors cursor-pointer"
                      >
                        <span className="font-medium">{opt.name}</span>
                        <span className="text-[10px] text-[#8E8E93]">Fly to place</span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>

            {/* GPS Pin Button */}
            <button
              type="button"
              onClick={handleGpsLocate}
              disabled={detectingGps}
              className="flex h-11 shrink-0 items-center gap-1.5 rounded-2xl bg-white px-3.5 shadow-md border border-[#E2E0D8] text-xs font-medium text-[#16223B] hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-60"
              title="Pin Current GPS Location"
            >
              {detectingGps ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Navigation className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">My Location</span>
            </button>
          </div>

          {/* Error notification */}
          {errorMsg && (
            <div className="pointer-events-auto rounded-xl bg-rose-600 px-3.5 py-1.5 text-xs text-white shadow-lg">
              {errorMsg}
            </div>
          )}
        </header>

        {/* Full-Screen Interactive Leaflet Map */}
        <div className="relative w-full flex-1 min-h-0">
          <MapContainer
            center={pos}
            zoom={15}
            minZoom={7}
            maxZoom={19}
            zoomControl={false}
            attributionControl={false}
            className="h-full w-full cursor-crosshair z-0"
          >
            {/* Soft, beautiful carto tiles */}
            <TileLayer
              attribution='&copy; <a href="https://carto.com/">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              subdomains="abcd"
              maxZoom={20}
            />

            <MapController
              lat={pos[0]}
              lng={pos[1]}
              onMapClick={(lat, lng) => void updateCoordinates(lat, lng)}
              onMapReady={(map) => {
                mapInstanceRef.current = map;
              }}
            />

            <Marker
              draggable={true}
              eventHandlers={markerHandlers}
              position={pos}
              ref={markerRef}
              icon={pinIcon}
            />
          </MapContainer>

          {/* Floating Zoom Controls (+ and -) */}
          <div
            onPointerDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            className="absolute right-3 sm:right-6 top-20 sm:top-24 z-[900] pointer-events-auto"
          >
            <div className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-md border border-[#E2E0D8]">
              <button
                type="button"
                onClick={handleZoomIn}
                title="Zoom In"
                aria-label="Zoom in on map"
                className="flex h-10 w-10 items-center justify-center text-[#16223B] hover:bg-gray-100 active:bg-gray-200 transition-colors border-b border-gray-100 cursor-pointer"
              >
                <Plus className="h-4 w-4 stroke-[2.5]" />
              </button>
              <button
                type="button"
                onClick={handleZoomOut}
                title="Zoom Out"
                aria-label="Zoom out on map"
                className="flex h-10 w-10 items-center justify-center text-[#16223B] hover:bg-gray-100 active:bg-gray-200 transition-colors cursor-pointer"
              >
                <Minus className="h-4 w-4 stroke-[2.5]" />
              </button>
            </div>
          </div>

          {/* Instruction Bubble over map */}
          <div className="absolute top-20 left-1/2 -translate-x-1/2 pointer-events-none z-[400] rounded-full bg-[#16223B]/80 backdrop-blur-xs px-4 py-1 text-xs font-medium text-white shadow-md">
            📍 Drag the pin or tap anywhere on the map to pinpoint
          </div>
        </div>

        {/* Bottom Location Confirmation Card */}
        <footer
          onPointerDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          className="absolute bottom-4 left-3 right-3 sm:bottom-6 sm:left-auto sm:right-6 sm:w-[380px] z-[1000] rounded-3xl bg-white/95 backdrop-blur-md p-4 sm:p-5 shadow-2xl border border-[#E2E0D8] pointer-events-auto"
        >
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[#16223B] text-white shadow-sm mt-0.5">
              <MapPin className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-[#8E8E93]">
                Selected Location
              </p>
              <h4 className="text-sm font-bold text-[#16223B] truncate mt-0.5">
                {isGeocoding ? (
                  <span className="inline-flex items-center gap-1.5 text-gray-500 font-normal">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Resolving exact address…</span>
                  </span>
                ) : (
                  placeName || "Pinned Location"
                )}
              </h4>
              <p className="text-[11px] font-mono text-[#71717A] mt-0.5">
                {pos[0].toFixed(5)}°N, {pos[1].toFixed(5)}°E
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-full border border-gray-200 py-2.5 text-xs font-medium text-[#71717A] hover:bg-gray-50 hover:text-black transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full bg-black py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-gray-800 active:scale-98 transition-all cursor-pointer"
            >
              <Check className="h-3.5 w-3.5" />
              <span>Confirm Location</span>
            </button>
          </div>
        </footer>
      </div>
    </AnimatePresence>,
    document.body
  );
}
