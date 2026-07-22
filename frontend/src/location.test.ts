import { describe, expect, it } from 'vitest';
import { findNearestLocation } from './location';
import type { Location } from './types';

function location(id: number, latitude: number, longitude: number): Location {
  return {
    id, latitude, longitude, created_at: '',
    weather: {
      condition: null, observed_at: null, source: null, area: null, valid_period_text: null,
      temperature_c: null, humidity_percent: null, rainfall_mm: null, wind_speed_knots: null,
      wind_direction_degrees: null, forecast_low_c: null, forecast_high_c: null, uv_index: null,
      psi_twenty_four_hourly: null, pm25_one_hourly: null, air_quality_region: null,
      forecast_periods: [], daily_forecast: [],
    },
  };
}

describe('findNearestLocation', () => {
  it('selects the nearest area using geographic distance', () => {
    expect(findNearestLocation({ latitude: 1.35, longitude: 103.82 }, [location(1, 1.35, 103.9), location(2, 1.35, 103.7)]).id).toBe(1);
  });
  it('supports coordinates outside Singapore', () => {
    expect(findNearestLocation({ latitude: 2, longitude: 103.8 }, [location(1, 1.3, 103.8)]).id).toBe(1);
  });
  it('uses array order as the deterministic tie-breaker', () => {
    expect(findNearestLocation({ latitude: 1.3, longitude: 103.8 }, [location(1, 1.3, 103.8), location(2, 1.3, 103.8)]).id).toBe(1);
  });
  it('rejects an empty area list', () => {
    expect(() => findNearestLocation({ latitude: 1.35, longitude: 103.82 }, [])).toThrow('No forecast areas are available');
  });
});