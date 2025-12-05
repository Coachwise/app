
# Coachwise Frontend (Vite + React)

This is the interactive mock of the Coachwise mobile web app built from the Figma file at https://www.figma.com/design/Vci8RbQFefSRpPVkspC4bc/Coachwise. The code recreates the primary flows (feed, workouts, plan builder, profile, coach marketplace) with local state so designers and PMs can click through the experience without a backend.

## Tech Stack
- Vite + React 18 + TypeScript
- Tailwind CSS v4 utility classes
- shadcn/ui + Radix primitives (see `src/components/ui`)
- Lucide icons, Embla carousel, Recharts (for future data viz)

## Prerequisites
- Node.js 18+ and npm (lockfile uses npm)

## Quick Start
```bash
cd app
npm install          # first time only
npm run dev          # serves on http://localhost:5173
```

### Production Build
```bash
npm run build        # outputs to dist/
npm run preview      # optional: serve the built bundle locally
```

## Project Structure (frontend)
- `src/App.tsx` – view switcher for all demo screens and demo menu shortcuts
- `src/components/` – feature screens (feed, workouts, plan builder, coach flows) and shadcn-based UI primitives under `ui/`
- `src/components/figma/` – helpers for rendering exported Figma assets (`ImageWithFallback`)
- `src/index.css` – Tailwind v4 generated layer
- `src/api/` – typed API clients and shared interfaces for the Go backend
- `src/THEME_GUIDE.md` – color and component usage guide mapped to the Figma tokens
- `src/Attributions.md` – licenses for shadcn/ui and Unsplash assets

## Figma Alignment
- Screens mirror the Figma file; color tokens and component patterns are documented in `src/THEME_GUIDE.md`.
- Static images from Figma exports should be wrapped with `ImageWithFallback` to avoid broken previews when URLs change.
- Iconography uses Lucide to match the Figma icon set.

## Notable Demo Flows
- Feed with post creation entry point and navigation to coach marketplace/tier comparison
- Workouts home, session logging, and plan/exercise builders (local state only)
- Profile with coach/athlete variants, coach application, and dashboard entry
- Coach marketplace, subscription tier builder, and tier comparison

## Environment Variables
No runtime configuration is required today. If you wire the UI to the Go API later, prefer Vite-style vars (e.g., `VITE_API_URL=http://localhost:3000`) and read them via `import.meta.env`.

## Testing
There are no automated frontend tests yet. If you add tests, use Vite + Testing Library/JSDOM so they run headlessly.

## Troubleshooting
- Dev server defaults to port 5173. Use `npm run dev -- --host` if you need LAN/mobile testing.
- If Tailwind styles look missing, ensure `index.css` is imported in `src/main.tsx`.
  
