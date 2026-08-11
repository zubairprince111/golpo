import type { Place } from "../types";

/**
 * Small local gazetteer used by the map search field.
 * Replace with a Supabase table or geocoding call later — the shape stays the same.
 */
export const PLACES: Place[] = [
  { name: "Dhaka", latitude: 23.8103, longitude: 90.4125 },
  { name: "Uttara, Dhaka", latitude: 23.8759, longitude: 90.3795 },
  { name: "Dhanmondi, Dhaka", latitude: 23.7461, longitude: 90.376 },
  { name: "Old Dhaka", latitude: 23.7104, longitude: 90.4074 },
  { name: "Gulshan, Dhaka", latitude: 23.7925, longitude: 90.4078 },
  { name: "Mohakhali, Dhaka", latitude: 23.7783, longitude: 90.4059 },
  { name: "Narayanganj", latitude: 23.6238, longitude: 90.5 },
  { name: "Chattogram", latitude: 22.3569, longitude: 91.7832 },
  { name: "Cox's Bazar", latitude: 21.4272, longitude: 92.0058 },
  { name: "Sylhet", latitude: 24.8949, longitude: 91.8687 },
  { name: "Srimangal, Moulvibazar", latitude: 24.3065, longitude: 91.7296 },
  { name: "Rajshahi", latitude: 24.3745, longitude: 88.6042 },
  { name: "Khulna", latitude: 22.8456, longitude: 89.5403 },
  { name: "Barishal", latitude: 22.701, longitude: 90.3535 },
  { name: "Rangpur", latitude: 25.7439, longitude: 89.2752 },
  { name: "Mymensingh", latitude: 24.7471, longitude: 90.4203 },
  { name: "Cumilla", latitude: 23.4607, longitude: 91.1809 },
  { name: "Jashore", latitude: 23.1664, longitude: 89.2081 },
  { name: "Bogura", latitude: 24.8465, longitude: 89.3773 },
  { name: "Sundarbans", latitude: 21.9497, longitude: 89.1833 },
  { name: "Saint Martin's Island", latitude: 20.6273, longitude: 92.3237 },
  { name: "Kuakata, Patuakhali", latitude: 21.8174, longitude: 90.1195 },
];

export function searchPlaces(query: string, limit = 6): Place[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return PLACES.filter((p) => p.name.toLowerCase().includes(q)).slice(0, limit);
}
