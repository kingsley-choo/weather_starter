# Backend

## Key files

- [backend/src/server.ts](../backend/src/server.ts) — entry point; mounts routes and Vite middleware
- [backend/src/routes/locations.ts](../backend/src/routes/locations.ts) — REST API at `/api/locations`
- [backend/src/weather.ts](../backend/src/weather.ts) — Singapore weather client
- [backend/src/db.ts](../backend/src/db.ts) — Drizzle ORM setup
- [backend/src/schema.ts](../backend/src/schema.ts) — table definition

## Database

SQLite file at `backend/weather.db` (override with `DATABASE_PATH` env var). Uses Node's built-in `node:sqlite` (`DatabaseSync`) via the Drizzle `sqlite-proxy` adapter, WAL mode enabled.

One table: `locations`. Weather data is a **snapshot model** — the latest reading overwrites the row; there is no historical time-series.

```bash
npm run db:generate   # Generate Drizzle migration files after schema changes
npm run db:migrate    # Apply pending migrations (also runs automatically at startup)
npm run reset         # Delete backend/weather.db entirely
```

## Other commands

```bash
npm run build    # vite build + tsc -p backend/tsconfig.json
npm run start    # Run compiled production server
npm run doctor   # Smoke-test /health and /api/locations
```

## Validation

Coordinates are validated to Singapore bounds: lat 1.1–1.5, lon 103.6–104.1.
