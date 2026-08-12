import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Search,
  MapPin,
  Check,
  AlertCircle,
  PenLine,
  Navigation,
  Loader2,
  ChevronDown,
  Globe,
  Lock,
  ShieldAlert,
  Feather,
} from "lucide-react";
import { searchPlaces, reverseGeocodeLiveLocation, isWithinBangladesh } from "@/lib/data/places";
import { TermsPolicyModal } from "@/components/modals/TermsPolicyModal";
import { useAppState } from "@/lib/store";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import type { Place, Visibility, StoryIconType } from "@/lib/types";
import { STORY_THEMES } from "@/lib/data/icons";
import { cn } from "@/lib/utils";
import { FullMapLocationPickerModal } from "@/components/map/FullMapLocationPickerModal";

export function SubmitMemoryModal({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (memoryId: string, lat: number, lng: number) => void;
}) {
  const { user, profile, addMemory } = useAppState();
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [query, setQuery] = useState("");
  const [place, setPlace] = useState<Place | null>(null);
  const [isLiveLocation, setIsLiveLocation] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [selectedIcon, setSelectedIcon] = useState<StoryIconType>("family");
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);
  const [visibility, setVisibility] = useState<Visibility>("public");
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showFullMapPicker, setShowFullMapPicker] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const results = place ? [] : searchPlaces(query);
  const currentTheme = STORY_THEMES.find((t) => t.id === selectedIcon) ?? STORY_THEMES[0];
  const CurrentIconComponent = currentTheme.icon;

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setThemeDropdownOpen(false);
      }
    }
    if (themeDropdownOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [themeDropdownOpen]);

  function handleShareLiveLocation() {
    if (!navigator.geolocation) {
      setLocationError("Location services unavailable in this browser.");
      return;
    }

    setDetectingLocation(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;

        if (!isWithinBangladesh(latitude, longitude)) {
          setDetectingLocation(false);
          setLocationError(
            "📍 Location is outside Bangladesh or in international waters. A Map of Us is dedicated exclusively to Bangladesh. Please select a location within Bangladesh.",
          );
          return;
        }

        try {
          const resolved = await reverseGeocodeLiveLocation(latitude, longitude);
          setPlace(resolved);
          setIsLiveLocation(true);
        } catch (err: unknown) {
          if (err instanceof Error && err.message.includes("outside Bangladesh")) {
            setLocationError(err.message);
          } else {
            setPlace({
              name: `Live Location (${latitude.toFixed(3)}°N, ${longitude.toFixed(3)}°E)`,
              latitude,
              longitude,
            });
            setIsLiveLocation(true);
          }
        } finally {
          setDetectingLocation(false);
        }
      },
      (err) => {
        setDetectingLocation(false);
        setLocationError(
          err.code === err.PERMISSION_DENIED
            ? "Location permission was denied."
            : "Could not detect GPS location.",
        );
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!user) {
      setShowAuthPrompt(true);
      return;
    }

    if (!content.trim() || !place) return;

    if (!isWithinBangladesh(place.latitude, place.longitude)) {
      setLocationError("Location must be within Bangladesh boundaries.");
      return;
    }

    const memory = await addMemory({
      content,
      title: title.trim() || undefined,
      latitude: place.latitude,
      longitude: place.longitude,
      location_name: place.name,
      visibility,
      icon: selectedIcon,
    });

    if (memory) {
      onSuccess(memory.id, memory.latitude, memory.longitude);
      onClose();
      setContent("");
      setTitle("");
      setPlace(null);
      setIsLiveLocation(false);
      setQuery("");
    }
  }

  if (!isOpen || typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6 select-text overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ scale: 0.96, opacity: 0, y: 8 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.96, opacity: 0, y: 8 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-[#E2E0D8]"
        >
          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute top-5 right-5 text-[#8E8E93] hover:text-[#1D1D1F] p-1.5 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>

          {/* ── Separate Screen: Not logged in ──────────────────── */}
          {!user ? (
            <div className="text-center py-2 px-1">
              {/* Masthead Feather Badge */}
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EFECE6] text-[#16223B] mb-4 border border-[#E2E0D8] shadow-2xs">
                <Feather className="h-6 w-6 text-[#16223B]" strokeWidth={1.5} />
              </div>

              {/* Quiet Category Tag */}
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white border border-[#E2E0D8] px-3.5 py-1 text-[11px] font-medium tracking-wider uppercase text-[#71717A] mb-3 shadow-2xs">
                <Lock className="h-3 w-3 text-[#16223B]" strokeWidth={1.75} />
                <span>Quiet Sanctuary</span>
              </span>

              <h2 className="font-serif text-2xl font-bold text-[#16223B] tracking-tight leading-snug">
                We understand you have so much to say
              </h2>

              <p className="mt-2.5 text-xs sm:text-[13px] text-[#5C5C60] leading-relaxed max-w-md mx-auto">
                Every whispered memory, confession, and silent moment belongs on this map. To keep your words safe and protect this shared space from automated bots and spam, we kindly ask you to sign in before leaving a note.
              </p>

              {/* Full Anonymity Guarantee Callout */}
              <div className="mt-5 rounded-2xl bg-[#FAF9F6] border border-[#E2E0D8] p-4 text-xs sm:text-[12px] text-[#4A4A4F] max-w-md mx-auto text-left shadow-2xs">
                <div className="flex items-center gap-2 mb-1.5 text-gray-900 font-semibold text-xs">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#EFECE6] text-[11px]">🔒</span>
                  <span>Uncompromised Anonymity</span>
                </div>
                <p className="leading-relaxed text-[#71717A] pl-7">
                  <strong className="text-gray-900">Don't worry:</strong> Your Google email, account details, and private profile are never recorded publicly or shared. On the map, you will always remain a quiet stranger: <span className="font-semibold text-gray-900 font-mono text-[11px] bg-white px-1.5 py-0.5 rounded border border-gray-200">GOLPO-XXXXX</span>.
                </p>
              </div>

              {/* Google Sign-in Action */}
              <div className="mt-6 max-w-xs mx-auto">
                <GoogleSignInButton redirectTo="/map" label="Sign in with Google" />
              </div>

              <div className="mt-4 pt-3 border-t border-black/5">
                <button
                  type="button"
                  onClick={onClose}
                  className="text-xs text-[#71717A] hover:text-[#16223B] transition-colors cursor-pointer"
                >
                  ← Cancel and return to map
                </button>
              </div>
            </div>
          ) : (
            /* ── Clean Submission Form: When Logged In ─────────── */
            <>
              {/* Header */}
              <div className="flex items-start justify-between pb-3.5 border-b border-gray-100 pr-6">
                <div>
                  <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#16223B]">
                    What did this place hold for you?
                  </h2>
                  <p className="mt-1 text-xs text-[#71717A] leading-relaxed">
                    A memory, a confession, or words left unsaid — anchored to this place.
                  </p>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {/* 1. The Memory */}
            <div>
              <div className="flex justify-between items-baseline mb-1.5">
                <label className="text-xs font-medium text-[#1E1E1E]">The Memory</label>
                <span className="text-[11px] text-[#8E8E93]">Bangla, English, or Banglish</span>
              </div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
                placeholder="Write what you felt, what was spoken, or what was left behind..."
                className="w-full rounded-xl border border-[#E2E0D8] bg-[#FAF9F6] p-3 text-xs sm:text-sm leading-relaxed text-[#1D1D1F] placeholder:text-[#8E8E93] focus:bg-white focus:outline-none focus:border-black focus:ring-1 focus:ring-black shadow-xs resize-y min-h-[96px]"
              />
            </div>

            {/* 2. Quiet Title or Opening Line */}
            <div>
              <label className="block text-xs font-medium text-[#1E1E1E] mb-1">
                A quiet title or first line <span className="text-[10px] text-[#8E8E93] font-normal">(optional)</span>
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. The rain by the terminal, or A bench in Dhanmondi..."
                className="w-full rounded-xl border border-[#E2E0D8] bg-white px-3.5 py-2 text-xs sm:text-sm text-[#1D1D1F] placeholder:text-[#8E8E93] focus:outline-none focus:border-black focus:ring-1 focus:ring-black shadow-xs"
              />
            </div>

            {/* 3. The Place */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-[#1E1E1E]">Where does this belong?</label>

                {/* Pick on Map */}
                <button
                  type="button"
                  onClick={() => setShowFullMapPicker(true)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white px-3 py-1 text-[11px] font-semibold text-[#16223B] shadow-2xs transition-all hover:bg-black hover:text-white cursor-pointer"
                >
                  <MapPin className="h-3 w-3" />
                  <span>Pick on Map</span>
                </button>
              </div>


              {place ? (
                <div className="flex items-center justify-between rounded-2xl border border-[#E2E0D8] bg-[#F8F8F6] p-3.5 shadow-2xs">
                  <div className="flex items-center gap-3 truncate">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-black text-white shadow-xs">
                      <MapPin className="h-4 w-4" />
                    </span>
                    <div className="truncate">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-semibold text-[#1D1D1F] truncate">{place.name}</span>
                        {isLiveLocation && (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-medium text-emerald-800 shrink-0">
                            Live GPS
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] font-mono text-[#8E8E93] mt-0.5">
                        {place.latitude.toFixed(5)}°N, {place.longitude.toFixed(5)}°E
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <button
                      type="button"
                      onClick={() => setShowFullMapPicker(true)}
                      className="inline-flex items-center gap-1 rounded-full bg-white border border-[#E2E0D8] px-3 py-1.5 text-xs font-semibold text-[#16223B] shadow-2xs hover:bg-gray-50 hover:border-black transition-all cursor-pointer"
                    >
                      <MapPin className="h-3 w-3 text-[#16223B]" />
                      <span>Change on Map</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPlace(null);
                        setIsLiveLocation(false);
                        setQuery("");
                      }}
                      className="text-xs text-[#71717A] hover:text-rose-600 font-medium px-1 cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="relative">
                    <div className="flex items-center gap-2 rounded-xl border border-[#E2E0D8] bg-white px-3.5 py-2 shadow-xs focus-within:border-black focus-within:ring-1 focus-within:ring-black">
                      <Search className="h-4 w-4 text-[#8E8E93] shrink-0" />
                      <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search a street, district, landmark, or village in Bangladesh..."
                        className="w-full bg-transparent text-xs sm:text-sm text-[#1D1D1F] placeholder:text-[#8E8E93] focus:outline-none"
                      />
                    </div>

                    {/* Dropdown search results */}
                    {results.length > 0 ? (
                      <ul className="absolute top-full left-0 right-0 z-50 mt-1 max-h-40 overflow-y-auto rounded-xl border border-[#E2E0D8] bg-white py-1 shadow-lg">
                        {results.map((opt) => (
                          <li key={opt.name}>
                            <button
                              type="button"
                              onClick={() => {
                                setPlace(opt);
                                setIsLiveLocation(false);
                              }}
                              className="w-full px-3.5 py-2 text-left text-xs text-[#48484A] hover:bg-gray-50 hover:text-black flex justify-between cursor-pointer"
                            >
                              <span>{opt.name}</span>
                              <span className="text-[10px] text-[#8E8E93]">Bangladesh</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </div>
              )}
            </div>

            {/* 4 & 5: The Feeling & Who Can Find This */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Left: The Feeling */}
              <div className="relative" ref={dropdownRef}>
                <label className="block text-xs font-medium text-[#1E1E1E] mb-1">
                  The Feeling
                </label>
                <button
                  type="button"
                  onClick={() => setThemeDropdownOpen(!themeDropdownOpen)}
                  className="flex w-full items-center justify-between rounded-xl border border-[#E2E0D8] bg-white px-3 py-2 text-xs text-[#1D1D1F] shadow-xs hover:border-gray-400 focus:outline-none"
                >
                  <div className="flex items-center gap-2 truncate">
                    <CurrentIconComponent className="h-4 w-4 text-gray-800 shrink-0" />
                    <span className="truncate font-medium text-xs sm:text-sm">{currentTheme.label}</span>
                  </div>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 text-[#8E8E93] shrink-0 transition-transform",
                      themeDropdownOpen && "rotate-180",
                    )}
                  />
                </button>

                {/* List Dropdown Menu */}
                <AnimatePresence>
                  {themeDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      className="absolute bottom-full left-0 right-0 z-50 mb-1 max-h-52 overflow-y-auto rounded-xl border border-[#E2E0D8] bg-white py-1 shadow-xl"
                    >
                      {STORY_THEMES.map((theme) => {
                        const ThemeIcon = theme.icon;
                        const isSelected = selectedIcon === theme.id;
                        return (
                          <button
                            key={theme.id}
                            type="button"
                            onClick={() => {
                              setSelectedIcon(theme.id);
                              setThemeDropdownOpen(false);
                            }}
                            className={cn(
                              "flex w-full items-center justify-between px-3 py-2 text-left text-xs transition-colors",
                              isSelected
                                ? "bg-gray-100 font-medium text-black"
                                : "text-[#48484A] hover:bg-gray-50 hover:text-black",
                            )}
                          >
                            <div className="flex items-center gap-2.5">
                              <ThemeIcon className="h-4 w-4 text-gray-800 shrink-0" />
                              <div>
                                <p className="text-xs font-medium">{theme.label}</p>
                                <p className="text-[10px] text-[#8E8E93]">{theme.description}</p>
                              </div>
                            </div>
                            {isSelected && <Check className="h-4 w-4 text-black shrink-0" />}
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Right: Who Can Find This */}
              <div>
                <label className="block text-xs font-medium text-[#1E1E1E] mb-1">
                  Who can find this?
                </label>
                <div className="flex rounded-xl border border-[#E2E0D8] bg-gray-100 p-1 shadow-xs">
                  <button
                    type="button"
                    onClick={() => setVisibility("public")}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium transition-all",
                      visibility === "public"
                        ? "bg-white text-black shadow-xs font-semibold"
                        : "text-gray-500 hover:text-black",
                    )}
                  >
                    <Globe className="h-3.5 w-3.5" />
                    <span>Public Map</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setVisibility("private")}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium transition-all",
                      visibility === "private"
                        ? "bg-white text-black shadow-xs font-semibold"
                        : "text-gray-500 hover:text-black",
                    )}
                  >
                    <Lock className="h-3.5 w-3.5" />
                    <span>Private Only</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Inline Auth Prompt if triggered */}
            {showAuthPrompt && !user ? (
              <div className="rounded-2xl border border-amber-200/90 bg-amber-50/80 p-4 text-center">
                <p className="font-serif text-sm font-bold text-[#16223B]">Sign in to anchor your memory</p>
                <p className="mt-1 text-xs text-[#5C5C60] leading-relaxed">
                  We understand you have so much to say. To keep memories safe and prevent bots, please sign in with Google. Your details remain 100% anonymous.
                </p>
                <div className="mt-3 max-w-xs mx-auto">
                  <GoogleSignInButton redirectTo="/map" label="Sign in with Google" />
                </div>
              </div>
            ) : null}

            {/* Community Safety & Anti-Bullying Pledge */}
            <div className="rounded-xl bg-gray-50 border border-gray-200/80 p-2.5 text-[11px] text-[#5C5C60] flex items-start gap-2">
              <ShieldAlert className="h-3.5 w-3.5 text-rose-600 shrink-0 mt-0.5" />
              <p>
                Targeting, mocking, bullying, or disclosing real personal identities is strictly forbidden.{" "}
                <button
                  type="button"
                  onClick={() => setShowTerms(true)}
                  className="text-black font-semibold underline hover:text-blue-600 cursor-pointer"
                >
                  Community Safety Policy & Terms
                </button>
              </p>
            </div>

            {/* Submit Action Row */}
            <div className="pt-3 flex items-center justify-between border-t border-gray-100">
              <button
                type="submit"
                disabled={!place || !content.trim()}
                className="inline-flex items-center gap-2 rounded-full bg-black px-6 py-2.5 text-xs font-medium text-white shadow-sm hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                <PenLine className="h-3.5 w-3.5" />
                <span>Anchor to Map</span>
              </button>

              <div className="text-right">
                <span className="text-[11px] text-[#8E8E93]">
                  As <strong className="text-gray-800">GOLPO-{profile?.anonymous_id ?? "…"}</strong>
                </span>
              </div>
            </div>
          </form>
        </>
      )}
    </motion.div>
  </div>

    {/* Full Screen Map Location Picker Modal */}
    <FullMapLocationPickerModal
      isOpen={showFullMapPicker}
      onClose={() => setShowFullMapPicker(false)}
      initialLatitude={place?.latitude ?? 23.75}
      initialLongitude={place?.longitude ?? 90.38}
      initialPlaceName={place?.name ?? "Dhaka, Bangladesh"}
      onConfirm={(loc) => {
        setPlace(loc);
        setIsLiveLocation(false);
        setQuery("");
      }}
    />

    {/* Safety Policy & Terms Modal */}
    <TermsPolicyModal
      isOpen={showTerms}
      onClose={() => setShowTerms(false)}
    />
  </AnimatePresence>,
  document.body
  );
}


