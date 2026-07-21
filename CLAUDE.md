# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Singapore weather dashboard — React frontend + Express backend in a single Node process, backed by SQLite.

## Essential commands

```bash
npm run dev   # Start everything at http://weather-starter.localhost:1355
npm test      # Run API tests once (Vitest)
```

Run a single test file: `npx vitest run <path-to-test-file>`

## Critical gotcha

There is **no separate frontend dev server**. Express mounts Vite as middleware — both run in the same process. The frontend uses relative `/api` URLs. Do not add proxy config or CORS handling.

## More detail

- [Backend — Express, SQLite, Drizzle, weather client](docs/backend.md)
- [Frontend — React Context state, theming, component tree](docs/frontend.md)
- [Weather API — data flow, nearest-neighbor matching, rate limiting](docs/weather-api.md)
