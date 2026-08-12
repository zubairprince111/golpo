import type { Place } from "../types";

/**
 * Strict Geographical Bounds of Bangladesh
 * Latitudes: ~20.55°N (St. Martin's Island) to ~26.65°N (Tetulia, Panchagarh)
 * Longitudes: ~88.01°E (Shibganj, Chapainawabganj) to ~92.68°E (Thanchi, Bandarban)
 */
export const BANGLADESH_GEO_BOUNDS = {
  minLat: 20.55,
  maxLat: 26.65,
  minLng: 88.01,
  maxLng: 92.68,
};

/**
 * Validates if coordinates are strictly within Bangladesh's geographical boundaries.
 */
export function isWithinBangladesh(lat: number, lng: number): boolean {
  return (
    lat >= BANGLADESH_GEO_BOUNDS.minLat &&
    lat <= BANGLADESH_GEO_BOUNDS.maxLat &&
    lng >= BANGLADESH_GEO_BOUNDS.minLng &&
    lng <= BANGLADESH_GEO_BOUNDS.maxLng
  );
}

/**
 * Curated local gazetteer strictly across Bangladesh.
 */
export const PLACES: Place[] = [
  { name: "Dhaka", latitude: 23.8103, longitude: 90.4125 },
  { name: "Uttara, Dhaka", latitude: 23.8759, longitude: 90.3795 },
  { name: "Dhanmondi, Dhaka", latitude: 23.7461, longitude: 90.376 },
  { name: "Old Dhaka", latitude: 23.7104, longitude: 90.4074 },
  { name: "Gulshan, Dhaka", latitude: 23.7925, longitude: 90.4078 },
  { name: "Banani, Dhaka", latitude: 23.7937, longitude: 90.4066 },
  { name: "Mirpur, Dhaka", latitude: 23.8071, longitude: 90.3686 },
  { name: "Mohakhali, Dhaka", latitude: 23.7783, longitude: 90.4059 },
  { name: "Shahbag, Dhaka", latitude: 23.7389, longitude: 90.3956 },
  { name: "Narayanganj", latitude: 23.6238, longitude: 90.5 },
  { name: "Gazipur", latitude: 23.9999, longitude: 90.4203 },
  { name: "Chattogram", latitude: 22.3569, longitude: 91.7832 },
  { name: "Agrabad, Chattogram", latitude: 22.3255, longitude: 91.8122 },
  { name: "GEC Circle, Chattogram", latitude: 22.3592, longitude: 91.8217 },
  { name: "Cox's Bazar", latitude: 21.4272, longitude: 92.0058 },
  { name: "Laboni Beach, Cox's Bazar", latitude: 21.4272, longitude: 92.0058 },
  { name: "Sylhet", latitude: 24.8949, longitude: 91.8687 },
  { name: "Zindabazar, Sylhet", latitude: 24.8949, longitude: 91.8687 },
  { name: "Shahjalal Dargah, Sylhet", latitude: 24.9015, longitude: 91.8711 },
  { name: "Srimangal, Moulvibazar", latitude: 24.3065, longitude: 91.7296 },
  { name: "Rajshahi", latitude: 24.3745, longitude: 88.6042 },
  { name: "Khulna", latitude: 22.8456, longitude: 89.5403 },
  { name: "Barishal", latitude: 22.701, longitude: 90.3535 },
  { name: "Barishal Launch Terminal", latitude: 22.701, longitude: 90.3535 },
  { name: "Rangpur", latitude: 25.7439, longitude: 89.2752 },
  { name: "Mymensingh", latitude: 24.7471, longitude: 90.4203 },
  { name: "Cumilla", latitude: 23.4607, longitude: 91.1809 },
  { name: "Jashore", latitude: 23.1664, longitude: 89.2081 },
  { name: "Bogura", latitude: 24.8465, longitude: 89.3773 },
  { name: "Sundarbans", latitude: 21.9497, longitude: 89.1833 },
  { name: "Saint Martin's Island", latitude: 20.6273, longitude: 92.3237 },
  { name: "Kuakata, Patuakhali", latitude: 21.8174, longitude: 90.1195 },
  { name: "Brahmanbaria", latitude: 23.9571, longitude: 91.1119 },
  { name: "Tangail", latitude: 24.2513, longitude: 89.9167 },
  { name: "Dinajpur", latitude: 25.6217, longitude: 88.6354 },
];

export function searchPlaces(query: string, limit = 6): Place[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return PLACES.filter((p) => p.name.toLowerCase().includes(q)).slice(0, limit);
}

/**
 * Finds the closest place in our Bangladesh gazetteer.
 */
function findClosestPlace(lat: number, lng: number): Place {
  let closest = PLACES[0];
  let minDistance = Infinity;

  for (const place of PLACES) {
    const d = Math.hypot(place.latitude - lat, place.longitude - lng);
    if (d < minDistance) {
      minDistance = d;
      closest = place;
    }
  }
  return closest;
}

/**
 * Reverse geocodes coordinates with strict Bangladesh validation.
 */
export async function reverseGeocodeLiveLocation(
  lat: number,
  lng: number,
): Promise<{ name: string; latitude: number; longitude: number }> {
  // Strict boundary check: Block foreign locations or ocean coordinates
  if (!isWithinBangladesh(lat, lng)) {
    throw new Error(
      "Location is outside Bangladesh. Golpo is exclusively dedicated to memories within Bangladesh.",
    );
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`;
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "Accept-Language": "en,bn",
      },
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = (await res.json()) as {
        name?: string;
        display_name?: string;
        address?: Record<string, string>;
      };

      const addr = data.address || {};
      const countryCode = addr["country_code"]?.toLowerCase();

      // Ensure reverse geocoding is strictly inside Bangladesh
      if (countryCode && countryCode !== "bd") {
        throw new Error(
          "Location is outside Bangladesh. Golpo is dedicated to Bangladesh.",
        );
      }

      const neighborhood =
        addr["neighbourhood"] ||
        addr["suburb"] ||
        addr["residential"] ||
        addr["quarter"] ||
        addr["hamlet"] ||
        addr["village"];
      const city =
        addr["city"] ||
        addr["town"] ||
        addr["municipality"] ||
        addr["city_district"] ||
        addr["state_district"] ||
        addr["county"];

      if (neighborhood && city && neighborhood !== city) {
        return { name: `${neighborhood}, ${city}`, latitude: lat, longitude: lng };
      }

      if (neighborhood) {
        return { name: neighborhood, latitude: lat, longitude: lng };
      }

      if (city) {
        return { name: city, latitude: lat, longitude: lng };
      }

      if (data.name) {
        return { name: data.name, latitude: lat, longitude: lng };
      }
    }
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes("outside Bangladesh")) {
      throw err;
    }
    // Network or timeout failure, fall back to closest gazetteer location
  }

  const fallback = findClosestPlace(lat, lng);
  return {
    name: `Near ${fallback.name}`,
    latitude: lat,
    longitude: lng,
  };
}
