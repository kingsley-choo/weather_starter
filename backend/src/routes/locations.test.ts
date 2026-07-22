import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { WeatherProviderError, type WeatherSnapshot } from '../weather.js';

const weather: WeatherSnapshot = {
  condition: 'Cloudy',
  observed_at: '2026-05-04T00:00:00Z',
  source: 'test',
  area: 'Bishan',
  valid_period_text: 'Now',
  temperature_c: 29,
  humidity_percent: 80,
  rainfall_mm: 0,
  wind_speed_knots: 4,
  wind_direction_degrees: 180,
  forecast_low_c: 25,
  forecast_high_c: 32,
  uv_index: 7,
  psi_twenty_four_hourly: 42,
  pm25_one_hourly: 9,
  air_quality_region: 'central',
  forecast_periods: [{ label: 'Now', forecast: 'Cloudy' }],
  daily_forecast: [
    { date: '2026-05-04', forecast: 'Cloudy', temperature_low_c: 25, temperature_high_c: 32 },
  ],
};

describe('locations API', () => {
  let tempDir: string;
  let app: Awaited<ReturnType<typeof import('../server.js').createApp>>;
  let weatherResult: WeatherSnapshot | Error = weather;

  beforeAll(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'weather-starter-test-'));
    process.env.DATABASE_PATH = join(tempDir, 'weather.db');
    process.env.LOG_LEVEL = 'silent';

    const { createApp } = await import('../server.js');
    app = await createApp({
      serveFrontend: false,
      enableRequestLogging: false,
      weatherClient: {
        async getCurrentWeather() {
          if (weatherResult instanceof Error) throw weatherResult;
          return weatherResult;
        },
      },
    });
  });

  afterAll(async () => {
    try {
      await rm(tempDir, { recursive: true, force: true });
    } catch (error: unknown) {
      if (
        !(
          error &&
          typeof error === 'object' &&
          'code' in error &&
          error.code === 'EBUSY'
        )
      ) {
        throw error;
      }
    }
  });

  it('refreshes weather when a location is created', async () => {
    const response = await request(app)
      .post('/api/locations')
      .send({ latitude: 1.35, longitude: 103.85 })
      .expect(201);

    expect(response.body).toMatchObject({
      id: 1,
      latitude: 1.35,
      longitude: 103.85,
      weather: {
        condition: 'Cloudy',
        area: 'Bishan',
        temperature_c: 29,
      },
    });

    const listResponse = await request(app).get('/api/locations').expect(200);
    expect(listResponse.body.locations).toHaveLength(1);
    expect(listResponse.body.locations[0].weather.condition).toBe('Cloudy');
  });
  it('rejects missing and out-of-bounds coordinates', async () => {
    await request(app)
      .post('/api/locations')
      .send({ latitude: 'not-a-number', longitude: 103.85 })
      .expect(422, { detail: 'latitude and longitude are required' });

    await request(app)
      .post('/api/locations')
      .send({ latitude: 1.1, longitude: 103.6 })
      .expect(201);

    await request(app)
      .post('/api/locations')
      .send({ latitude: 1.09, longitude: 103.85 })
      .expect(422, {
        detail: 'Coordinates must be within Singapore (lat 1.1-1.5, lon 103.6-104.1)',
      });
  });

  it('rejects duplicate coordinates', async () => {
    await request(app)
      .post('/api/locations')
      .send({ latitude: 1.35, longitude: 103.85 })
      .expect(409, { detail: 'Location already exists' });
  });

  it('gets a location and refreshes its weather', async () => {
    const location = await request(app).get('/api/locations/1').expect(200);
    expect(location.body).toMatchObject({ id: 1, latitude: 1.35, longitude: 103.85 });

    weatherResult = { ...weather, condition: 'Heavy Rain', temperature_c: 27 };

    const refreshed = await request(app).post('/api/locations/1/refresh').expect(200);
    expect(refreshed.body.weather).toMatchObject({ condition: 'Heavy Rain', temperature_c: 27 });
  });

  it('returns 502 when refreshing weather fails', async () => {
    weatherResult = new WeatherProviderError('provider unavailable');

    await request(app)
      .post('/api/locations/1/refresh')
      .expect(502, { detail: 'provider unavailable' });

    weatherResult = weather;
  });

  it('returns not found for missing locations and deletes existing ones', async () => {
    await request(app).get('/api/locations/999').expect(404, { detail: 'Location not found' });
    await request(app)
      .post('/api/locations/999/refresh')
      .expect(404, { detail: 'Location not found' });
    await request(app).delete('/api/locations/999').expect(404, { detail: 'Location not found' });

    await request(app).delete('/api/locations/1').expect(204);
    await request(app).get('/api/locations/1').expect(404, { detail: 'Location not found' });
    await request(app).delete('/api/locations/1').expect(404, { detail: 'Location not found' });
  });

  it('returns a healthy status', async () => {
    await request(app).get('/health').expect(200, { status: 'healthy' });
  });

  it('accepts valid frontend interaction logs and rejects invalid events', async () => {
    await request(app)
      .post('/api/logs')
      .send({ event: 'weather.refresh', metadata: { source: 'test' }, page: '/dashboard' })
      .expect(204);

    await request(app).post('/api/logs').send({ event: 'Bad Event' }).expect(422, {
      detail: 'event is required',
    });
  });
});