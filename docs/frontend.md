# Frontend

## State management

[frontend/src/state/store.tsx](../frontend/src/state/store.tsx) — React Context + useState. No external state library.

`StoreContext` holds: `locations[]`, `selectedId`, `isAdding`, `isLoading`, `refreshingId`, `error`, and action callbacks (`select`, `setAdding`, `create`, `refresh`, `remove`).

**Sync pattern:** every mutating action calls `load()` afterward to re-fetch the full list from the backend. The only exception is `remove`, which filters local state immediately before the API call confirms (optimistic delete).

Consumers use two hooks: `useStore()` and `useSelectedLocation()`.

## Theming

[frontend/src/state/themeContext.tsx](../frontend/src/state/themeContext.tsx) — separate context from the store. Applies CSS custom properties (`--bg`, etc.) via inline `style` on the root `div` in `App.tsx`. Theme definitions live in [frontend/src/themes.ts](../frontend/src/themes.ts).

## API layer

[frontend/src/api.ts](../frontend/src/api.ts) — thin fetch wrappers against relative `/api` URLs. Every action also fires a fire-and-forget POST to `/api/logs` via `logInteraction()`.

## Types

[frontend/src/types.ts](../frontend/src/types.ts) — shared `Location` and `WeatherSnapshot` shapes used by both the API layer and components.

## Component tree

```
App
  ThemeProvider
    ThemedApp
      StoreProvider
        Layout
          Sidebar / Hero / MapCard / Tiles
```
