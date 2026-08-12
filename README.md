# Golpo — A Living Geographic Memory Archive of Bangladesh

Live demo: https://golpoo.vercel.app/

> *“What you felt is still somewhere, always.”*

**Golpo** is an anonymous, location-anchored storytelling platform dedicated to the landscape and collective memory of Bangladesh. It allows individuals to leave quiet reflections, memories, confessions, and moments anchored to the exact geographic coordinates where they occurred.

---

## 🌟 Key Features

- **Interactive Cartographic Canvas**: Full Leaflet-based light cartography of Bangladesh with dynamic clustering, subtle pastel memory markers, and smooth fly-to camera controls.
- **Strict Territorial Integrity**: Strict geographic bounding box (`20.55°N` to `26.65°N`, `88.01°E` to `92.68°E`) preventing pins outside Bangladesh or in international waters.
- **Anonymity by Design**: No public names, vanity photos, social feeds, or follower counts. All memories are signed with cryptographic anonymous badges (`GOLPO-XXXXX`).
- **Community Safety & Anti-Bullying Governance**: Comprehensive, enforceable policies prohibiting targeted harassment, mocking, doxxing, or defamatory content with built-in community reporting.
- **Personal Diary**: A dual-view chronological journal (`Written Entries` & `Saved Bookmarks`) with timeline grouping by year and month, and instant "Fly to Place" navigation.
- **Bilingual & Responsive**: Seamless typography rendering for English, Bangla, and Banglish across desktop, tablet, and mobile devices.

---

## 🏗️ Architecture & Technology Stack

- **Framework**: [TanStack Start](https://tanstack.com/start) + [React 19](https://react.dev)
- **Routing**: [TanStack Router](https://tanstack.com/router) with SSR & Nitro integration
- **Styling**: TailwindCSS & Vanilla CSS with custom editorial design tokens
- **Mapping**: [Leaflet](https://leafletjs.com/) + [React-Leaflet](https://react-leaflet.js.org/)
- **Animations**: [Motion](https://motion.dev/) (Framer Motion)
- **Icons**: [Lucide React](https://lucide.dev/)

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (version 18+ recommended)
- `npm` or `bun`

### Installation & Local Development

```bash
# Clone the repository
git clone https://github.com/your-username/golpo.git
cd golpo

# Install dependencies
npm install

# Start the local development preview server
npm run dev
```

Open [http://localhost:8080](http://localhost:8080) in your browser.

### Production Build

```bash
npm run build
```

---

## 📜 Governance & Community Guidelines

Golpo enforces zero tolerance for:
1. **Targeted Harassment & Mocking**: Writing defamatory remarks, bullying, or attacking specific individuals.
2. **Doxxing & Privacy Invasion**: Posting real full names, phone numbers, addresses, student IDs, or private contact details.
3. **Geographic Vandalism**: Placing malicious pins outside Bangladesh borders.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
