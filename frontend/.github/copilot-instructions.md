# Copilot Instructions for ITAM Frontend

This file gives concise, actionable guidance for AI coding agents working in this repository.

## Quick start (dev)
- Run the dev server: `npm run dev` (uses Vite with `--host`, listens on port 3000 by default).
- Entry point: `src/main.jsx` -> renders `<App />` inside `ThemeProvider` and `EntityProvider`.

## Big-picture architecture
- React + Vite single-page app. Routing is defined in `src/App.jsx` (React Router v6).
- UI is split into `components/` (reusable parts) and `pages/` (route views).
- Layout providers: `src/context/ThemeContext.jsx` and `src/context/EntityContext.jsx` control theme and selected entity for the app.
- Data/services: `src/services/*` contains simple, synchronous mock services (e.g. `dashboardService.js` uses `mockDashboardData`).

## Important patterns & conventions
- Routing: Add routes in `src/App.jsx`. Protected layout uses the `Layout` component from `src/components/Layout.jsx` which composes `Sidebar` + `Topbar` and renders page content via `<Outlet />`.
- Context: Use the provided hooks `useTheme()` and `useEntity()` exported from their context files; both throw when used outside their providers. Providers are applied in `src/main.jsx`.
- Services are currently mocked and synchronous to be Docker/Vite-safe. Example: `getDashboardData(entityId)` in `src/services/dashboardService.js` returns `getMockDashboardData(entityId)`.
- Styling: Tailwind + custom CSS under `src/styles/` (global.css, dashboard.css, theme.css, etc.). Icons via `@fortawesome/fontawesome-free` imported in `src/main.jsx`.
- Charts: Chart components live under `src/components/charts` and use `chart.js` + `react-chartjs-2`.

## File locations to check for common tasks
- Add a new page: `src/pages/<Page>.jsx` and add route in `src/App.jsx`.
- Shared UI components: `src/components/` and `src/components/ui/`.
- Services and mocks: `src/services/` (look for `mockDashboardData.js`).
- Context and providers: `src/context/ThemeContext.jsx`, `src/context/EntityContext.jsx`.

## Developer commands and environment notes
- Start dev server: `npm run dev` (Vite server configured in `vite.config.js` with host 0.0.0.0 and port 3000).
- No `build` or `test` scripts are present in `package.json`; do not assume build hooks — run `vite build` manually if needed.
- `node_modules/` is present; use the project's package manager (npm recommended) to install dependencies.

## Integration points and external assumptions
- Back-end/API: currently there is no live API integration in `src/services`; data is mocked. When replacing with a real API, follow the existing synchronous service pattern or migrate services to async fetch wrappers.
- Docker: project contains a `Dockerfile` and a `dist/` folder—CI may expect a built SPA output under `dist/`.

## Gotchas and repo-specific notes
- There are two layout implementations: `src/components/Layout.jsx` (used by `App.jsx`) and `src/layout/MainLayout.jsx` (used in `src/routes/AppRoutes.jsx`). `src/main.jsx` imports `App.jsx`, so prefer `App.jsx` as the current routing source of truth.
- Theme persistence: `ThemeContext` stores theme in `localStorage` and sets `data-theme` on `document.documentElement`. Modify theme carefully to keep this behavior.
- Services are intentionally synchronous (see comment in `src/services/dashboardService.js`) to avoid CORS/docker dev issues.

## Example tasks
- To add a new dashboard widget: create `src/components/charts/MyChart.jsx`, register it in `src/pages/Dashboard.jsx`, and import required CSS in `src/styles/` if needed.
- To swap mocks for an API: replace `src/services/dashboardService.js` implementation with an async `fetch` call and update consumers to handle promises.

If any section is unclear or you want me to include extra examples (route additions, provider usage, or a small API integration example), tell me which area to expand.
