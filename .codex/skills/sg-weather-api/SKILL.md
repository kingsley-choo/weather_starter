---
name: sg-weather-api
description: Integrate Singapore weather data from api-open.data.gov.sg into applications, including endpoint selection, nearest-neighbor station matching, snapshot persistence, retries, API-key handling, and Singapore coordinate validation. Use when building, debugging, or extending Singapore weather API clients or the Weather Starter backend.
---

# Singapore Weather API

Use this skill to implement or review Singapore weather integrations backed by api-open.data.gov.sg. Keep provider-specific logic isolated from route handlers and UI code.

## Core workflow

1. Validate coordinates before calling the provider: latitude 1.1–1.5 and longitude 103.6–104.1. Reject invalid locations with a client error.
2. Fetch relevant endpoints in parallel: two-hr-forecast, air-temperature, relative-humidity, rainfall, wind-speed, wind-direction, uv, psi, pm25, twenty-four-hr-forecast, and legacy 4-day-weather-forecast.
3. Treat each provider request as fallible. Wrap independent calls so one unavailable feed does not crash the whole response; surface provider failure clearly on refresh operations.
4. Match each requested coordinate to the nearest station, named area, or air-quality region using squared Euclidean distance. Do not assume the API returns rows in coordinate order.
5. Merge normalized results into a weather snapshot. Preserve provider timestamps and valid-period text; keep forecast arrays JSON-compatible.
6. Persist the latest snapshot only for a snapshot model; do not imply historical time-series semantics.

## Reliability and security

- Retry HTTP 429 responses up to three times with exponential backoff and jitter.
- Send WEATHER_API_KEY, when configured, as the x-api-key request header. Never expose the key in browser code, logs, or error payloads.
- Keep frontend requests relative (for example, /api/locations) when Express and Vite share one process; do not add a frontend proxy or CORS workaround unless the deployment architecture changes.
- Parse and validate provider payloads defensively. Nullable measurements are expected.

## Weather Starter conventions

For this repository, POST /api/locations accepts { latitude, longitude }, inserts a placeholder row, fetches feeds, updates the row, and returns the location. POST /api/locations/:id/refresh repeats the fetch-and-merge flow and returns 502 when the provider cannot supply the refresh. SQLite locations stores the latest snapshot, including current conditions, measurements, air quality, and forecast JSON.

## Testing checklist

- Test Singapore-boundary and out-of-bounds coordinates.
- Mock each provider endpoint, including partial failures and 429 retries.
- Verify nearest-neighbor selection with deliberately shuffled station/area arrays.
- Verify API-key headers are present server-side and absent from client responses.
- Verify snapshot updates do not accidentally create duplicate location rows.
