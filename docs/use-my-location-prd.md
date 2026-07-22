# PRD: Use My Location

## Context

Users currently need to choose a Singapore forecast area manually. Add a **Use my location** button that uses the browser’s Geolocation API, finds the nearest configured Singapore forecast area in the frontend, and adds it to the user’s forecast list.

Geolocation must work on `localhost` without HTTPS. Browsers treat `localhost` as a secure context for this API; production deployments will still require HTTPS.

## Problem

Manual area selection is inconvenient, especially for users who do not know which forecast area is closest to them.

## Goals

- Let a user add the nearest forecast area with one click.
- Use the browser’s default location accuracy.
- Match against the forecast areas already available to the frontend.
- Add and immediately select the nearest area.
- Avoid duplicate areas.
- Keep precise coordinates transient and client-side only.
- Make loading and failure states clear.

## Non-goals

- Building a map or displaying the user’s precise position.
- Persisting raw latitude/longitude.
- Adding a new backend endpoint for geolocation or nearest-area matching.
- Asking for high-accuracy GPS data.
- Restricting the browser request to users physically located in Singapore. If coordinates are outside Singapore, the nearest configured Singapore area is still added.

## User experience

### Primary flow

1. The user clicks **Use my location**.
2. If forecast areas are still loading, the app waits for that existing load to finish.
3. The button is disabled while location detection and matching are in progress.
4. The browser requests location permission through the standard Geolocation API.
5. The frontend calculates the nearest forecast area from the returned coordinates.
6. If that area is already in the user’s list, no duplicate is created.
7. The area is added if needed and immediately selected as the active area.
8. The button becomes enabled again.

### Failure flow

If geolocation is denied, unavailable, unsupported, or fails, show a toast describing the failure. Do not change the forecast list or active area. Re-enable the button after the failure.

If the forecast-area load fails, show the existing area-loading error behavior or a toast consistent with the application’s error conventions. Do not request location until the area data is available.

## Functional requirements

### Location acquisition

- Use `navigator.geolocation.getCurrentPosition`.
- Use browser-default accuracy; do not request `enableHighAccuracy`.
- Do not persist the returned coordinates or send them to the backend.
- Handle browsers where `navigator.geolocation` is unavailable.
- Handle permission denial and all relevant Geolocation API error callbacks.

### Nearest-area matching

- Match the returned latitude/longitude against the loaded forecast-area coordinates in the frontend.
- Use a distance calculation appropriate for geographic coordinates, such as the Haversine formula.
- Return the closest area deterministically.
- Support coordinates outside Singapore by still selecting the closest configured Singapore area.
- Define behavior for an empty area list as an error; no area should be added.

### Area list behavior

- Reuse the existing area-addition and active-area selection state flow.
- Compare areas using the application’s stable area identifier, not display-name text.
- Do not add an area that already exists in the user’s list.
- Select the existing area when the nearest area is already present.

### Button state

- Disable the button only while the operation is active.
- Prevent duplicate clicks while disabled.
- Re-enable the button after success, denial, unsupported geolocation, timeout/error, or area-load failure.
- Provide an accessible label and a loading indication while the operation is active.

### Toasts

- Use the application’s existing toast mechanism.
- Provide distinct, actionable messages for permission denial, unavailable position, unsupported geolocation, and general failure where the browser exposes that distinction.
- Do not expose raw coordinates in toast content.

## Technical approach

- Keep nearest-area calculation as a pure frontend utility so it can be unit tested independently.
- Keep geolocation API interaction behind a small function or hook that converts browser callbacks into the application’s async state flow.
- Wait for the existing forecast-area data promise/state before invoking geolocation if the list is not ready.
- Do not add Vite proxy configuration, CORS handling, or a separate frontend server.
- Use relative `/api` URLs for existing weather data flows.

## Acceptance criteria

- [ ] Clicking **Use my location** requests browser location permission.
- [ ] The feature works on `http://localhost` without requiring HTTPS.
- [ ] The button is disabled during detection and cannot be clicked twice concurrently.
- [ ] The button waits for forecast areas to finish loading when necessary.
- [ ] The nearest area is calculated in the frontend from the loaded area coordinates.
- [ ] An area outside Singapore still resolves to the nearest configured Singapore area.
- [ ] A new nearest area is added and immediately selected.
- [ ] An existing nearest area is selected without creating a duplicate.
- [ ] Raw coordinates are not persisted or sent to the backend.
- [ ] Denied, unavailable, unsupported, and failed geolocation states show a toast and leave the list unchanged.
- [ ] The button is re-enabled after every terminal outcome.
- [ ] Unit tests cover nearest-area selection, duplicate handling, successful geolocation, loading, and geolocation failures.

## Testing requirements

Add unit tests for:

- Haversine/nearest-area calculation with multiple known coordinates.
- Deterministic selection when areas are equidistant or nearly equidistant.
- Empty forecast-area input.
- Successful location resolution.
- Waiting for areas to load before resolving the location.
- Permission denied, unsupported API, unavailable position, and other geolocation errors.
- Button disabled/enabled transitions.
- Existing-area selection without duplicate insertion.
- Successful new-area insertion and immediate activation.

Mock `navigator.geolocation` rather than using a real browser permission prompt in unit tests.

## Open questions

- Should the app impose its own timeout if the browser never invokes a geolocation callback?
- What exact toast wording and duration match the existing UI conventions?
- What loading indicator is consistent with the current button design?
