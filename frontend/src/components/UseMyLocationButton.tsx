import { useState } from 'react';
import { findNearestLocation } from '../location';
import { useStore } from '../state/store';
import { LocationIcon } from './icons';

function geolocationErrorMessage(error: GeolocationPositionError) {
  if (error.code === error.PERMISSION_DENIED) return 'Location permission was denied.';
  if (error.code === error.POSITION_UNAVAILABLE) return 'Your position is currently unavailable.';
  if (error.code === error.TIMEOUT) return 'Location detection timed out. Please try again.';
  return 'Could not determine your location. Please try again.';
}

function getPosition(): Promise<GeolocationPosition> {
  if (!('geolocation' in navigator)) return Promise.reject(new Error('Location detection is not supported by this browser.'));
  return new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject));
}

export function UseMyLocationButton() {
  const { locations, isLoading, select, loadLocations } = useStore();
  const [active, setActive] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const detect = async () => {
    if (active) return;
    setActive(true);
    setMessage(null);
    try {
      const availableLocations = isLoading ? await loadLocations() : locations;
      const position = await getPosition();
      const nearest = findNearestLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude }, availableLocations);
      select(nearest.id);
      setMessage(`Showing ${nearest.weather.area ?? 'your nearest area'}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not determine your location.');
      if (typeof error === 'object' && error !== null && 'code' in error) setMessage(geolocationErrorMessage(error as GeolocationPositionError));
    } finally { setActive(false); }
  };

  return <div className="grid gap-2">
    <button type="button" onClick={() => void detect()} disabled={active} aria-label="Use my location to select the nearest forecast area" className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/[0.07] px-3 py-2.5 text-sm font-medium text-white/85 backdrop-blur-xl hover:bg-white/[0.12] disabled:cursor-wait disabled:opacity-60">
      <LocationIcon className="h-4 w-4" /><span>{active ? 'Finding your location…' : 'Use my location'}</span>
    </button>
    {message && <p role="status" className="rounded-md border border-white/10 bg-white/[0.06] px-2.5 py-1.5 text-xs text-white/70">{message}</p>}
  </div>;
}