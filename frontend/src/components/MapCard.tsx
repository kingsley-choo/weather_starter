import 'leaflet/dist/leaflet.css';
import './map.css';

import L from 'leaflet';
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { MapContainer, Marker, TileLayer, ZoomControl, useMap } from 'react-leaflet';
import { useStore } from '../state/store';
import type { Location } from '../types';
import { CloseIcon, ExpandIcon, LocationIcon } from './icons';

// Patch Leaflet's default icon to avoid Vite asset resolution errors
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl: '', shadowUrl: '', iconRetinaUrl: '' });

const TILE_URL = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

const SINGAPORE_CENTER: [number, number] = [1.3521, 103.8198];

function esc(s: string): string {
  return s.replace(
    /[<>&"]/g,
    (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' })[c]!
  );
}

interface LocationMarkerProps {
  location: Location;
  isSelected: boolean;
}

function LocationMarker({ location, isSelected }: LocationMarkerProps) {
  const { select } = useStore();

  const temp =
    location.weather?.temperature_c != null
      ? `${Math.round(location.weather.temperature_c)}°`
      : '--°';
  const condition = location.weather?.condition ? esc(location.weather.condition) : '';
  const label = condition ? `${temp} · ${condition}` : temp;

  const icon = useMemo(
    () =>
      L.divIcon({
        className: '',
        html: `<div class="map-pin${isSelected ? ' map-pin--active' : ''}">
                 <span class="map-pin__temp">${esc(temp)}</span>
                 ${condition ? `<span class="map-pin__condition">${condition}</span>` : ''}
               </div>`,
        iconAnchor: [0, 0],
        popupAnchor: [0, -10],
      }),
    [temp, condition, isSelected]
  );

  return (
    <Marker
      position={[location.latitude, location.longitude]}
      icon={icon}
      title={label}
      eventHandlers={{ click: () => select(location.id) }}
    />
  );
}

interface MapFitBoundsProps {
  locations: Location[];
}

function MapFitBounds({ locations }: MapFitBoundsProps) {
  const map = useMap();

  useEffect(() => {
    if (locations.length === 0) {
      map.setView(SINGAPORE_CENTER, 11);
      return;
    }
    if (locations.length === 1) {
      map.setView([locations[0].latitude, locations[0].longitude], 13);
      return;
    }
    const bounds = L.latLngBounds(locations.map((l) => [l.latitude, l.longitude]));
    map.fitBounds(bounds, { padding: [48, 48] });
  }, [locations, map]);

  return null;
}

interface MapInvalidateSizeProps {
  trigger: boolean;
}

function MapInvalidateSize({ trigger }: MapInvalidateSizeProps) {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 50);
    return () => clearTimeout(t);
  }, [trigger, map]);
  return null;
}

interface MapInnerProps {
  locations: Location[];
  selectedId: number | null;
  isFullscreen: boolean;
}

function MapInner({ locations, selectedId, isFullscreen }: MapInnerProps) {
  return (
    <MapContainer
      center={SINGAPORE_CENTER}
      zoom={11}
      style={{ height: '100%', width: '100%' }}
      zoomControl={false}
      attributionControl
    >
      <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
      <ZoomControl position="bottomright" />
      {locations.map((loc) => (
        <LocationMarker key={loc.id} location={loc} isSelected={loc.id === selectedId} />
      ))}
      <MapFitBounds locations={locations} />
      <MapInvalidateSize trigger={isFullscreen} />
    </MapContainer>
  );
}

export function MapCard() {
  const { locations, selectedId } = useStore();
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      <section className="flex flex-col gap-3 rounded-2xl border border-white/15 bg-white/[0.08] p-4 backdrop-blur-xl">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/60">
            <LocationIcon className="h-3.5 w-3.5" />
            <span>Locations</span>
          </div>
          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            className="flex items-center gap-1 rounded-full border border-white/15 bg-white/[0.08] px-2.5 py-1 text-[10px] font-medium text-white/70 hover:bg-white/[0.14] transition-colors"
            aria-label="Expand map"
          >
            <ExpandIcon className="h-3 w-3" />
            <span>Expand</span>
          </button>
        </header>

        <div className="h-56 overflow-hidden rounded-xl">
          <MapInner locations={locations} selectedId={selectedId} isFullscreen={false} />
        </div>
      </section>

      {isExpanded &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex flex-col bg-black/90 backdrop-blur-sm">
            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-white/70">
                <LocationIcon className="h-4 w-4" />
                <span>Locations</span>
              </div>
              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/85 hover:bg-white/20 transition-colors"
                aria-label="Close map"
              >
                <CloseIcon className="h-3.5 w-3.5" />
                <span>Close</span>
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <MapInner locations={locations} selectedId={selectedId} isFullscreen />
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
