/**
 * Curated geographic data for Bangladesh cartography.
 * High-fidelity boundary, external suppression mask, major river networks, and atlas place labels.
 */

// Precise Bangladesh national boundary polygon [lat, lng]
export const BANGLADESH_BORDER: [number, number][] = [
  [26.3835, 88.6672],
  [26.6348, 88.5489],
  [26.5492, 88.3967],
  [26.2417, 88.4239],
  [26.0681, 88.3094],
  [25.8683, 88.7844],
  [25.4286, 88.7567],
  [25.1783, 88.8872],
  [24.9667, 88.2256],
  [24.8119, 88.0833],
  [24.5806, 88.1639],
  [24.475, 88.3194],
  [24.2889, 88.3889],
  [24.1611, 88.6028],
  [23.9667, 88.8306],
  [23.8306, 88.6472],
  [23.475, 88.7194],
  [23.2389, 88.6889],
  [22.9528, 88.8694],
  [22.5806, 88.9472],
  [22.1833, 89.0417],
  [21.6444, 89.15],
  [21.7889, 89.5444],
  [21.8444, 89.8667],
  [21.8194, 90.1389],
  [21.9444, 90.4167],
  [22.2167, 90.6944],
  [22.5694, 90.7306],
  [22.75, 91.1389],
  [22.7167, 91.4333],
  [22.3833, 91.7333],
  [21.6889, 91.95],
  [21.4167, 91.9833],
  [20.9167, 92.2667],
  [20.5972, 92.3583], // St Martin's area
  [20.8833, 92.4833],
  [21.2167, 92.1833],
  [21.5833, 92.2167],
  [21.9167, 92.45],
  [22.25, 92.5167],
  [22.6167, 92.3833],
  [23.0167, 92.4167],
  [23.4167, 92.25],
  [23.75, 92.3667],
  [24.0833, 92.15],
  [24.4167, 92.3833],
  [24.7833, 92.5167],
  [25.0167, 92.2167],
  [25.1833, 91.7833],
  [25.15, 91.2833],
  [25.1833, 90.5833],
  [25.15, 89.9833],
  [25.3167, 89.85],
  [25.6833, 89.8167],
  [26.0167, 89.75],
  [26.15, 89.6167],
  [26.25, 89.15],
  [26.3835, 88.6672],
];

// Major Rivers of Bangladesh [lat, lng][]
export const MAJOR_RIVERS: { name: string; path: [number, number][] }[] = [
  {
    name: "Padma River",
    path: [
      [24.45, 88.35],
      [24.3, 88.6],
      [24.15, 88.95],
      [23.95, 89.3],
      [23.75, 89.85],
      [23.55, 90.25],
      [23.3, 90.55],
      [23.15, 90.7],
    ],
  },
  {
    name: "Jamuna / Brahmaputra River",
    path: [
      [26.05, 89.75],
      [25.6, 89.7],
      [25.15, 89.65],
      [24.7, 89.65],
      [24.25, 89.75],
      [23.85, 89.75],
      [23.75, 89.85],
    ],
  },
  {
    name: "Meghna River",
    path: [
      [25.0, 91.5],
      [24.5, 91.2],
      [24.05, 90.95],
      [23.6, 90.65],
      [23.15, 90.7],
      [22.8, 90.75],
      [22.4, 90.8],
      [22.0, 91.0],
    ],
  },
  {
    name: "Karnaphuli River",
    path: [
      [22.65, 92.25],
      [22.5, 92.1],
      [22.35, 91.85],
      [22.22, 91.8],
    ],
  },
  {
    name: "Surma River",
    path: [
      [25.0, 92.45],
      [24.9, 91.87],
      [24.75, 91.45],
      [24.5, 91.2],
    ],
  },
];

// Curated atlas place markers & geographic labels
export interface AtlasLabel {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: "major" | "district" | "water" | "region";
  minZoom: number;
}

export const ATLAS_LABELS: AtlasLabel[] = [
  // Major Divisions
  { id: "lbl-dhaka", name: "DHAKA", lat: 23.8103, lng: 90.4125, type: "major", minZoom: 6 },
  { id: "lbl-ctg", name: "CHATTOGRAM", lat: 22.3569, lng: 91.7832, type: "major", minZoom: 6 },
  { id: "lbl-syl", name: "SYLHET", lat: 24.8949, lng: 91.8687, type: "major", minZoom: 6 },
  { id: "lbl-raj", name: "RAJSHAHI", lat: 24.3745, lng: 88.6042, type: "major", minZoom: 6 },
  { id: "lbl-khu", name: "KHULNA", lat: 22.8456, lng: 89.5403, type: "major", minZoom: 6 },
  { id: "lbl-bar", name: "BARISHAL", lat: 22.701, lng: 90.3535, type: "major", minZoom: 6 },
  { id: "lbl-ran", name: "RANGPUR", lat: 25.7439, lng: 89.2752, type: "major", minZoom: 6 },
  { id: "lbl-mym", name: "MYMENSINGH", lat: 24.7471, lng: 90.4203, type: "major", minZoom: 6 },

  // Key Districts & Regions
  { id: "lbl-cxb", name: "Cox's Bazar", lat: 21.4272, lng: 92.0058, type: "district", minZoom: 8 },
  { id: "lbl-sri", name: "Srimangal", lat: 24.3065, lng: 91.7296, type: "district", minZoom: 9 },
  { id: "lbl-bog", name: "Bogura", lat: 24.8465, lng: 89.3773, type: "district", minZoom: 8 },
  { id: "lbl-cum", name: "Cumilla", lat: 23.4607, lng: 91.1809, type: "district", minZoom: 8 },
  { id: "lbl-jas", name: "Jashore", lat: 23.1664, lng: 89.2081, type: "district", minZoom: 8 },
  { id: "lbl-kua", name: "Kuakata", lat: 21.8174, lng: 90.1195, type: "district", minZoom: 9 },
  { id: "lbl-stm", name: "St. Martin's", lat: 20.6273, lng: 92.3237, type: "district", minZoom: 9 },
  { id: "lbl-sun", name: "Sundarbans", lat: 21.9497, lng: 89.1833, type: "region", minZoom: 7.5 },

  // Water Bodies (Italic Serif)
  { id: "lbl-bob", name: "Bay of Bengal", lat: 21.1, lng: 90.5, type: "water", minZoom: 6 },
  { id: "lbl-pad", name: "Padma", lat: 23.7, lng: 89.9, type: "water", minZoom: 9 },
  { id: "lbl-meg", name: "Meghna", lat: 23.1, lng: 90.7, type: "water", minZoom: 9 },
  { id: "lbl-jam", name: "Jamuna", lat: 24.5, lng: 89.68, type: "water", minZoom: 9 },
];
