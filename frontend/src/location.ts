import type { Location } from './types';

export interface Coordinates { latitude: number; longitude: number }
const EARTH_RADIUS_KM = 6371;
function toRadians(degrees: number) { return (degrees * Math.PI) / 180; }

export function haversineDistanceKm(from: Coordinates, to: Coordinates) {
  const latitudeDelta = toRadians(to.latitude - from.latitude);
  const longitudeDelta = toRadians(to.longitude - from.longitude);
  const fromLatitude = toRadians(from.latitude);
  const toLatitude = toRadians(to.latitude);
  const a = Math.sin(latitudeDelta / 2) ** 2 + Math.cos(fromLatitude) * Math.cos(toLatitude) * Math.sin(longitudeDelta / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function findNearestLocation(position: Coordinates, locations: Location[]): Location {
  if (locations.length === 0) throw new Error('No forecast areas are available');
  return locations.reduce((nearest, candidate) =>
    haversineDistanceKm(position, candidate) < haversineDistanceKm(position, nearest) ? candidate : nearest
  );
}