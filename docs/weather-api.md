# Weather API

Source: [backend/src/weather.ts](../backend/src/weather.ts)  
Provider: `api-open.data.gov.sg`

## Data flow

1. POST `/api/locations` with `{ latitude, longitude }`
2. Row inserted with `condition: 'Not refreshed'`
3. 11 parallel API calls fire immediately — all wrapped in `safe()` so none can crash the response:
   - `two-hr-forecast` — nearest named area forecast
   - `air-temperature`, `relative-humidity`, `rainfall`, `wind-speed`, `wind-direction` — nearest weather station readings
   - `uv` — UV index
   - `psi`, `pm25` — air quality by region
   - `twenty-four-hr-forecast` — produces `forecast_periods[]`
   - `4-day-weather-forecast` (v1 legacy API) — produces `daily_forecast[]`
4. Results merged into a `WeatherSnapshot` using **nearest-neighbor matching** (squared Euclidean distance to find closest station/area/region)
5. Row updated; updated location returned in 201 response

POST `/api/locations/:id/refresh` repeats steps 3–5 for an existing row (returns 502 on provider failure).

## Rate limiting

`fetchJson` auto-retries up to 3× on HTTP 429 with exponential backoff (500ms base + jitter).

Optional `WEATHER_API_KEY` env var is sent as the `x-api-key` header on every request.
