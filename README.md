# HiFi Music Search & Downloader

A full-stack web application that wraps the `tidal.401658.xyz` proxy to deliver rich music discovery, preview streaming, and high fidelity downloads within a glassmorphic, dark UI inspired by TIDAL and Spotify.

## Features
- 🔍 Unified search across tracks, artists, and albums with smart suggestions.
- 🎧 In-browser lossless previews via a mini player with persistent queue state.
- ⬇️ Secure download routing that streams through the backend with format selection.
- ⭐ Local favorites and recent searches stored with Zustand persistence.
- ⚡ Backend rate limiting, response caching, and sanitised download file names to stay polite to the upstream API.

## Tech Stack
- **Frontend:** Next.js 14, React 18, Tailwind CSS 3, Zustand.
- **Backend:** Node.js 18+, Express 4, native fetch, express-rate-limit.

## Quick Start
1. **Clone / download** this project.
2. **Install dependencies.**
   ```bash
   cd backend
   npm install
   cd ../frontend
   npm install
   ```
3. **Configure environment variables.**
   ```bash
   cp .env.example .env   # Windows: copy .env.example .env
   ```
   Adjust values as needed (especially `NEXT_PUBLIC_API_BASE_URL` if the backend runs on a different host/port).
4. **Run the backend.**
   ```bash
   cd backend
   npm run dev
   ```
5. **Run the frontend.**
   ```bash
   cd ../frontend
   npm run dev
   ```
6. Visit [http://localhost:3000](http://localhost:3000) and start searching.

> The backend defaults to port `4000` and proxies all requests to `https://tidal.401658.xyz`. Ensure that host is reachable from your network.

## API Overview
All routes are prefixed with `/api` on the backend server.

| Method | Route | Description |
| ------ | ----- | ----------- |
| `GET` | `/api/health` | Health probe with uptime metrics. |
| `GET` | `/api/search` | Search tracks, artists, or albums. Query params: `q`, `type`, `limit`, `page`. |
| `GET` | `/api/tracks/:id` | Normalised track detail including lyrics (when available) and detected formats. |
| `GET` | `/api/tracks/:id/formats` | Audio quality list for a given track. |
| `GET` | `/api/stream/:id` | Inline audio stream suitable for HTML5 audio elements. |
| `GET` | `/api/download/:id` | Attachment download tunnel with clean file names. |
| `GET` | `/api/albums/:id` | Album metadata + track listing. |
| `GET` | `/api/artists/:id` | Artist summary payload. |
| `GET` | `/api/playlists/:id` | Playlist information with track items. |

All heavy requests are cached in-memory (configurable TTL and size) and guarded by `express-rate-limit` to minimise load on the upstream proxy.

## Frontend Highlights
- Responsive layout with glassmorphic cards and neon cyan accents.
- Tailwind-powered theming with reusable helper classes (`glass-panel`, `scrollbar-thin`).
- Zustand store coordinates search, playback, and persistence. Preview playback reuses the backend `/stream` endpoint, while downloads call `/download` to stream files through the server.

## Recommended Tooling
- Node.js 18 or newer (uses native Fetch and ReadableStream ↔ Node stream adapters).
- pnpm/yarn/npm according to preference (scripts assume npm but are compatible with others).
- Optional: Redis or another cache layer can replace the in-memory cache for multi-instance deployments.

## Next Steps & Stretch Ideas
1. Build queue management for batch downloads.
2. Add waveform visualisation using the Web Audio API.
3. Integrate authentication (Supabase/Firebase) to sync favorites across devices.
4. Persist downloads history in a lightweight database.

## License & Credits
This project uses the community `tidal.401658.xyz` proxy. Respect the upstream service and local laws when downloading media. This repository is provided without warranty.
