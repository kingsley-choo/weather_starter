import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { WeatherProviderError, type WeatherSnapshot } from '../weather.js';

const baseSnapshot: WeatherSnapshot = {
  condition: 'Sunny',
  observed_at: '2026-05-04T00:00:00Z',
  source: 'test',
  area: 'Marina Bay',
  valid_period_text: 'Now',
  temperature_c: 31,
  humidity_percent: 70,
  rainfall_mm: 0,
  wind_speed_knots: 5,
  wind_direction_degrees: 90,
  forecast_low_c: 26,
  forecast_high_c: 33,
  uv_index: 9,
  psi_twenty_four_hourly: 38,
  pm25_one_hourly: 11,
  air_quality_region: 'central',
  forecast_periods: [{ label: 'Now', forecast: 'Sunny' }],
  daily_forecast: [
    { date: '2026-05-04', forecast: 'Sunny', temperature_low_c: 26, temperature_high_c: 33 },
  ],
};

describe('weather backend API', () => {
  let tempDir: string;
  let app: Awaited<ReturnType<typeof import('../server.js').createApp>>;
  let nextSnapshot: () => Promise<WeatherSnapshot> = async () => baseSnapshot;

  beforeAll(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'weather-starter-test-'));
    process.env.DATABASE_PATH = join(tempDir, 'weather.db');
    process.env.LOG_LEVEL = 'silent';

    const { createApp } = await import('../server.js');
    app = await createApp({
      serveFrontend: false,
      enableRequestLogging: false,
      weatherClient: {
        getCurrentWeather: () => nextSnapshot(),
      },
    });
  });

  afterAll(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  describe('GET /health', () => {
    it('reports healthy', async () => {
      const response = await request(app).get('/health').expect(200);
      expect(response.body).toEqual({ status: 'healthy' });
    });
  });

  describe('POST /api/logs', () => {
    it('accepts frontend interaction events', async () => {
      await request(app)
        .post('/api/logs')
        .send({
          event: 'location_form_opened',
          page: '/',
          metadata: { source: 'test' },
        })
        .expect(204);
    });

    it('rejects invalid interaction events', async () => {
      const response = await request(app)
        .post('/api/logs')
        .send({ event: 'Invalid Event Name' })
        .expect(422);

      expect(response.body).toEqual({ detail: 'event is required' });
    });
  });

  describe('GET /api/locations/:id', () => {
    it('returns the location when it exists', async () => {
      nextSnapshot = async () => baseSnapshot;
      const created = await request(app)
        .post('/api/locations')
        .send({ latitude: 1.2806, longitude: 103.8503 })
        .expect(201);

      const id = created.body.id as number;
      const response = await request(app).get(`/api/locations/${id}`).expect(200);

      expect(response.body).toMatchObject({
        id,
        latitude: 1.2806,
        longitude: 103.8503,
        weather: { condition: 'Sunny', area: 'Marina Bay' },
      });
    });

    it('returns 404 for an unknown id', async () => {
      const response = await request(app).get('/api/locations/999999').expect(404);
      expect(response.body).toEqual({ detail: 'Location not found' });
    });
  });

  describe('POST /api/locations validation', () => {
    it('rejects non-numeric coordinates with 422', async () => {
      const response = await request(app)
        .post('/api/locations')
        .send({ latitude: 'abc', longitude: 'xyz' })
        .expect(422);
      expect(response.body.detail).toMatch(/latitude and longitude/i);
    });

    it('rejects a missing payload with 422', async () => {
      const response = await request(app).post('/api/locations').send({}).expect(422);
      expect(response.body.detail).toMatch(/latitude and longitude/i);
    });

    it('rejects coordinates outside Singapore with 422', async () => {
      const response = await request(app)
        .post('/api/locations')
        .send({ latitude: 40.7128, longitude: -74.006 })
        .expect(422);
      expect(response.body.detail).toMatch(/Singapore/);
    });

    it('rejects duplicate coordinates with 409', async () => {
      nextSnapshot = async () => baseSnapshot;
      await request(app)
        .post('/api/locations')
        .send({ latitude: 1.4, longitude: 103.95 })
        .expect(201);

      const response = await request(app)
        .post('/api/locations')
        .send({ latitude: 1.4, longitude: 103.95 })
        .expect(409);
      expect(response.body.detail).toMatch(/already exists/i);
    });
  });

  describe('POST /api/locations weather provider failures', () => {
    it('still creates the location with 201 when the provider errors', async () => {
      nextSnapshot = async () => {
        throw new WeatherProviderError('upstream down');
      };

      const response = await request(app)
        .post('/api/locations')
        .send({ latitude: 1.45, longitude: 103.82 })
        .expect(201);

      expect(response.body).toMatchObject({ latitude: 1.45, longitude: 103.82 });
      expect(response.body.weather.condition).toBe('Not refreshed');
    });
  });

  describe('POST /api/locations/:id/refresh', () => {
    it('updates the weather snapshot for an existing location', async () => {
      nextSnapshot = async () => baseSnapshot;
      const created = await request(app)
        .post('/api/locations')
        .send({ latitude: 1.32, longitude: 103.71 })
        .expect(201);
      const id = created.body.id as number;

      nextSnapshot = async () => ({
        ...baseSnapshot,
        condition: 'Thunderstorm',
        area: 'Jurong',
        temperature_c: 26,
      });

      const response = await request(app).post(`/api/locations/${id}/refresh`).expect(200);
      expect(response.body.weather).toMatchObject({
        condition: 'Thunderstorm',
        area: 'Jurong',
        temperature_c: 26,
      });
    });

    it('returns 404 when refreshing an unknown location', async () => {
      const response = await request(app).post('/api/locations/999999/refresh').expect(404);
      expect(response.body).toEqual({ detail: 'Location not found' });
    });

    it('returns 502 when the weather provider fails', async () => {
      nextSnapshot = async () => baseSnapshot;
      const created = await request(app)
        .post('/api/locations')
        .send({ latitude: 1.36, longitude: 103.99 })
        .expect(201);
      const id = created.body.id as number;

      nextSnapshot = async () => {
        throw new WeatherProviderError('rate limited');
      };

      const response = await request(app).post(`/api/locations/${id}/refresh`).expect(502);
      expect(response.body.detail).toBe('rate limited');
    });
  });
});
