export class WeatherProviderError extends Error {}

interface ForecastPayload {
  code?: number;
  errorMsg?: string;
  data?: ForecastRoot;
  area_metadata?: AreaMetadata[];
  items?: ForecastItem[];
}

interface ForecastRoot {
  area_metadata?: AreaMetadata[];
  items?: ForecastItem[];
}

interface AreaMetadata {
  name?: string;
  label_location?: {
    latitude?: number | string;
    longitude?: number | string;
  };
}

interface ForecastItem {
  update_timestamp?: string;
  timestamp?: string;
  valid_period?: {
    text?: string;
  };
  forecasts?: Array<{
    area?: string;
    forecast?: string;
  }>;
}

interface ReadingPayload {
  code?: number;
  errorMsg?: string;
  data?: {
    stations?: WeatherStation[];
    readings?: WeatherReading[];
    readingType?: string;
    readingUnit?: string;
  };
}

interface WeatherStation {
  id?: string;
  name?: string;
  location?: {
    latitude?: number | string;
    longitude?: number | string;
  };
}

interface WeatherReading {
  timestamp?: string;
  data?: Array<{
    stationId?: string;
    value?: number | string;
  }>;
}

interface RegionMetadata {
  name?: string;
  labelLocation?: {
    latitude?: number | string;
    longitude?: number | string;
  };
}

interface UvPayload {
  code?: number;
  errorMsg?: string;
  data?: {
    records?: Array<{
      timestamp?: string;
      updatedTimestamp?: string;
      index?: Array<{
        hour?: string;
        value?: number | string;
      }>;
    }>;
  };
}

interface PsiPayload {
  code?: number;
  errorMsg?: string;
  data?: {
    regionMetadata?: RegionMetadata[];
    items?: Array<{
      timestamp?: string;
      updatedTimestamp?: string;
      readings?: Record<string, Record<string, number | string>>;
    }>;
  };
}

interface TwentyFourHourPayload {
  code?: number;
  errorMsg?: string;
  data?: {
    records?: Array<{
      timestamp?: string;
      updatedTimestamp?: string;
      general?: {
        temperature?: {
          low?: number | string;
          high?: number | string;
        };
      };
      periods?: Array<{
        timePeriod?: {
          start?: string;
          text?: string;
        };
        regions?: Record<string, { text?: string; code?: string }>;
      }>;
    }>;
  };
}

interface FourDayPayload {
  items?: Array<{
    update_timestamp?: string;
    timestamp?: string;
    forecasts?: Array<{
      date?: string;
      timestamp?: string;
      forecast?: string;
      temperature?: {
        low?: number | string;
        high?: number | string;
      };
    }>;
  }>;
}

export interface ForecastPeriod {
  label: string;
  forecast: string;
}

export interface DailyForecast {
  date: string;
  forecast: string;
  temperature_low_c: number | null;
  temperature_high_c: number | null;
}

export interface WeatherSnapshot {
  condition: string;
  observed_at: string;
  source: string;
  area: string | null;
  valid_period_text: string | null;
  temperature_c: number | null;
  humidity_percent: number | null;
  rainfall_mm: number | null;
  wind_speed_knots: number | null;
  wind_direction_degrees: number | null;
  forecast_low_c: number | null;
  forecast_high_c: number | null;
  uv_index: number | null;
  psi_twenty_four_hourly: number | null;
  pm25_one_hourly: number | null;
  air_quality_region: string | null;
  forecast_periods: ForecastPeriod[];
  daily_forecast: DailyForecast[];
}

export class SingaporeWeatherClient {
  constructor(
    private readonly options: {
      baseUrl?: string;
      apiKey?: string;
      timeoutMs?: number;
      userAgent?: string;
    } = {}
  ) {}

  async getCurrentWeather(latitude: number, longitude: number): Promise<WeatherSnapshot> {
    const safe = async <T>(fn: () => Promise<T>): Promise<T | null> => {
      try {
        return await fn();
      } catch {
        return null;
      }
    };

    const forecast = await safe(() => this.fetchLatestForecastPayload());
    const temperature = await safe(() =>
      this.fetchNearestReading('air-temperature', latitude, longitude)
    );
    const humidity = await safe(() =>
      this.fetchNearestReading('relative-humidity', latitude, longitude)
    );
    const rainfall = await safe(() => this.fetchNearestReading('rainfall', latitude, longitude));
    const windSpeed = await safe(() => this.fetchNearestReading('wind-speed', latitude, longitude));
    const windDir = await safe(() =>
      this.fetchNearestReading('wind-direction', latitude, longitude)
    );
    const uv = await safe(() => this.fetchUvIndex());
    const psi = await safe(() => this.fetchPsiPayload());
    const pm25 = await safe(() => this.fetchPm25Payload());
    const twentyFour = await safe(() => this.fetchTwentyFourHourPayload());
    const fourDay = await safe(() => this.fetchFourDayPayload());

    const base = forecast
      ? this.snapshotFromPayload(forecast, latitude, longitude)
      : this.emptyForecastSnapshot();

    const aqRegion = psi
      ? nearestRegionName(psi.data?.regionMetadata ?? [], latitude, longitude)
      : null;

    const region24 = nearestRegionName(defaultRegions(), latitude, longitude) ?? 'central';
    const record24 = twentyFour?.data?.records?.[0];
    const forecastPeriods: ForecastPeriod[] = (record24?.periods ?? [])
      .map((p) => ({
        label: p.timePeriod?.text ?? '',
        forecast: p.regions?.[region24]?.text ?? p.regions?.central?.text ?? '',
      }))
      .filter((p) => p.label && p.forecast);

    const fourDayItem = fourDay?.items?.[0];
    const dailyForecast: DailyForecast[] = (fourDayItem?.forecasts ?? [])
      .map((f) => ({
        date: f.date ?? f.timestamp ?? '',
        forecast: f.forecast ?? '',
        temperature_low_c: numberOrNull(f.temperature?.low),
        temperature_high_c: numberOrNull(f.temperature?.high),
      }))
      .filter((f) => f.date && f.forecast);

    return {
      ...base,
      temperature_c: temperature?.value ?? null,
      humidity_percent: humidity?.value ?? null,
      rainfall_mm: rainfall?.value ?? null,
      wind_speed_knots: windSpeed?.value ?? null,
      wind_direction_degrees: windDir?.value ?? null,
      uv_index: uv?.value ?? null,
      psi_twenty_four_hourly: valueForRegion(
        psi?.data?.items?.[0]?.readings?.psi_twenty_four_hourly,
        aqRegion
      ),
      pm25_one_hourly: valueForRegion(pm25?.data?.items?.[0]?.readings?.pm25_one_hourly, aqRegion),
      air_quality_region: aqRegion,
      forecast_low_c: numberOrNull(record24?.general?.temperature?.low),
      forecast_high_c: numberOrNull(record24?.general?.temperature?.high),
      forecast_periods: forecastPeriods,
      daily_forecast: dailyForecast,
    };
  }

  async fetchLatestForecastPayload(): Promise<ForecastPayload> {
    return this.fetchJson(`${this.apiBaseUrl()}/v2/real-time/api/two-hr-forecast`);
  }

  async fetchNearestReading(
    endpoint:
      | 'air-temperature'
      | 'relative-humidity'
      | 'rainfall'
      | 'wind-speed'
      | 'wind-direction',
    latitude: number,
    longitude: number
  ): Promise<{ value: number | null; timestamp: string | null }> {
    const payload = await this.fetchReadingPayload(endpoint);
    if (payload.code !== undefined && payload.code !== 0) {
      throw new WeatherProviderError(
        payload.errorMsg ?? `Weather provider returned an error for ${endpoint}`
      );
    }

    const stations = payload.data?.stations ?? [];
    const latestReading = payload.data?.readings?.[0];
    const values = latestReading?.data ?? [];
    if (stations.length === 0 || values.length === 0) {
      return { value: null, timestamp: latestReading?.timestamp ?? null };
    }

    const valueByStation = new Map(
      values
        .map((entry) => [entry.stationId, Number(entry.value)] as const)
        .filter((entry): entry is [string, number] => Boolean(entry[0]) && !Number.isNaN(entry[1]))
    );
    const station = nearestStation(stations, latitude, longitude, valueByStation);
    return {
      value: station ? (valueByStation.get(station.id) ?? null) : null,
      timestamp: latestReading?.timestamp ?? null,
    };
  }

  async fetchReadingPayload(endpoint: string): Promise<ReadingPayload> {
    return this.fetchJson(`${this.apiBaseUrl()}/v2/real-time/api/${endpoint}`);
  }

  async fetchUvIndex(): Promise<{ value: number | null; timestamp: string | null }> {
    const payload = await this.fetchJson<UvPayload>(`${this.apiBaseUrl()}/v2/real-time/api/uv`);
    if (payload.code !== undefined && payload.code !== 0) {
      throw new WeatherProviderError(
        payload.errorMsg ?? 'Weather provider returned an error for uv'
      );
    }

    const record = payload.data?.records?.[0];
    const latest = record?.index?.[0];
    return {
      value: numberOrNull(latest?.value),
      timestamp: record?.updatedTimestamp ?? latest?.hour ?? record?.timestamp ?? null,
    };
  }

  async fetchPsiPayload(): Promise<PsiPayload> {
    const payload = await this.fetchJson<PsiPayload>(`${this.apiBaseUrl()}/v2/real-time/api/psi`);
    if (payload.code !== undefined && payload.code !== 0) {
      throw new WeatherProviderError(payload.errorMsg ?? 'Weather provider returned a PSI error');
    }
    return payload;
  }

  async fetchPm25Payload(): Promise<PsiPayload> {
    const payload = await this.fetchJson<PsiPayload>(`${this.apiBaseUrl()}/v2/real-time/api/pm25`);
    if (payload.code !== undefined && payload.code !== 0) {
      throw new WeatherProviderError(payload.errorMsg ?? 'Weather provider returned a PM2.5 error');
    }
    return payload;
  }

  async fetchTwentyFourHourPayload(): Promise<TwentyFourHourPayload> {
    const payload = await this.fetchJson<TwentyFourHourPayload>(
      `${this.apiBaseUrl()}/v2/real-time/api/twenty-four-hr-forecast`
    );
    if (payload.code !== undefined && payload.code !== 0) {
      throw new WeatherProviderError(
        payload.errorMsg ?? 'Weather provider returned a 24-hour forecast error'
      );
    }
    return payload;
  }

  async fetchFourDayPayload(): Promise<FourDayPayload> {
    return this.fetchJson<FourDayPayload>(
      `${this.legacyApiBaseUrl()}/v1/environment/4-day-weather-forecast`
    );
  }

  private apiBaseUrl(): string {
    return this.options.baseUrl ?? 'https://api-open.data.gov.sg';
  }

  private legacyApiBaseUrl(): string {
    return 'https://api.data.gov.sg';
  }

  private async fetchJson<T>(url: string, attempt = 0): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.options.timeoutMs ?? 8000);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          'User-Agent': this.options.userAgent ?? 'weather-starter/0.1 (educational project)',
          ...(this.options.apiKey ? { 'x-api-key': this.options.apiKey } : {}),
        },
      });

      if (!response.ok) {
        if (response.status === 429 && attempt < 3) {
          clearTimeout(timeout);
          const delay = 500 * 2 ** attempt + Math.random() * 200;
          await new Promise<void>((resolve) => setTimeout(resolve, delay));
          return this.fetchJson<T>(url, attempt + 1);
        }
        if (response.status === 429) {
          throw new WeatherProviderError('Weather provider rate limit reached (HTTP 429)');
        }
        if (response.status === 401 || response.status === 403) {
          throw new WeatherProviderError('Weather provider rejected request (check API key)');
        }
        throw new WeatherProviderError(`Weather provider returned HTTP ${response.status}`);
      }

      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof WeatherProviderError) throw error;
      throw new WeatherProviderError('Unable to reach weather provider');
    } finally {
      clearTimeout(timeout);
    }
  }

  snapshotFromPayload(
    payload: ForecastPayload,
    latitude: number,
    longitude: number
  ): WeatherSnapshot {
    if (payload.code !== undefined && payload.code !== 0) {
      throw new WeatherProviderError(payload.errorMsg ?? 'Weather provider returned an error');
    }

    const root = payload.data ?? payload;
    const areaMetadata = root.area_metadata ?? [];
    const items = root.items ?? [];
    if (items.length === 0) {
      throw new WeatherProviderError('Forecast response has no items');
    }

    const latestItem = items[0];
    const forecasts = latestItem.forecasts ?? [];
    if (forecasts.length === 0) {
      throw new WeatherProviderError('Forecast item has no area forecasts');
    }

    const forecastByArea = new Map(
      forecasts
        .filter((entry) => entry.area && entry.forecast)
        .map((entry) => [entry.area as string, entry.forecast as string])
    );

    const nearestArea = nearestAreaName(areaMetadata, latitude, longitude);
    if (nearestArea && forecastByArea.has(nearestArea)) {
      return {
        condition: forecastByArea.get(nearestArea) as string,
        observed_at: latestItem.update_timestamp ?? latestItem.timestamp ?? '',
        source: 'api-open.data.gov.sg',
        area: nearestArea,
        valid_period_text: latestItem.valid_period?.text ?? null,
        temperature_c: null,
        humidity_percent: null,
        rainfall_mm: null,
        wind_speed_knots: null,
        wind_direction_degrees: null,
        forecast_low_c: null,
        forecast_high_c: null,
        uv_index: null,
        psi_twenty_four_hourly: null,
        pm25_one_hourly: null,
        air_quality_region: null,
        forecast_periods: [],
        daily_forecast: [],
      };
    }

    const fallback = forecasts[0];
    return {
      condition: fallback.forecast ?? 'Unknown',
      observed_at: latestItem.update_timestamp ?? latestItem.timestamp ?? '',
      source: 'api-open.data.gov.sg',
      area: fallback.area ?? null,
      valid_period_text: latestItem.valid_period?.text ?? null,
      temperature_c: null,
      humidity_percent: null,
      rainfall_mm: null,
      wind_speed_knots: null,
      wind_direction_degrees: null,
      forecast_low_c: null,
      forecast_high_c: null,
      uv_index: null,
      psi_twenty_four_hourly: null,
      pm25_one_hourly: null,
      air_quality_region: null,
      forecast_periods: [],
      daily_forecast: [],
    };
  }

  private emptyForecastSnapshot(): WeatherSnapshot {
    return {
      condition: 'Unavailable',
      observed_at: '',
      source: 'api-open.data.gov.sg',
      area: null,
      valid_period_text: null,
      temperature_c: null,
      humidity_percent: null,
      rainfall_mm: null,
      wind_speed_knots: null,
      wind_direction_degrees: null,
      forecast_low_c: null,
      forecast_high_c: null,
      uv_index: null,
      psi_twenty_four_hourly: null,
      pm25_one_hourly: null,
      air_quality_region: null,
      forecast_periods: [],
      daily_forecast: [],
    };
  }
}

function nearestAreaName(
  areaMetadata: AreaMetadata[],
  latitude: number,
  longitude: number
): string | null {
  let nearest: { name: string; distance: number } | null = null;

  for (const area of areaMetadata) {
    const lat = Number(area.label_location?.latitude);
    const lon = Number(area.label_location?.longitude);
    if (!area.name || Number.isNaN(lat) || Number.isNaN(lon)) continue;

    const distance = (lat - latitude) ** 2 + (lon - longitude) ** 2;
    if (!nearest || distance < nearest.distance) {
      nearest = { name: area.name, distance };
    }
  }

  return nearest?.name ?? null;
}

function nearestRegionName(
  regions: RegionMetadata[],
  latitude: number,
  longitude: number
): string | null {
  let nearest: { name: string; distance: number } | null = null;

  for (const region of regions) {
    const lat = Number(region.labelLocation?.latitude);
    const lon = Number(region.labelLocation?.longitude);
    if (!region.name || Number.isNaN(lat) || Number.isNaN(lon)) continue;

    const distance = (lat - latitude) ** 2 + (lon - longitude) ** 2;
    if (!nearest || distance < nearest.distance) {
      nearest = { name: region.name, distance };
    }
  }

  return nearest?.name ?? null;
}

function nearestStation(
  stations: WeatherStation[],
  latitude: number,
  longitude: number,
  valueByStation: Map<string, number>
): { id: string; distance: number } | null {
  let nearest: { id: string; distance: number } | null = null;

  for (const station of stations) {
    const lat = Number(station.location?.latitude);
    const lon = Number(station.location?.longitude);
    if (!station.id || Number.isNaN(lat) || Number.isNaN(lon) || !valueByStation.has(station.id))
      continue;

    const distance = (lat - latitude) ** 2 + (lon - longitude) ** 2;
    if (!nearest || distance < nearest.distance) {
      nearest = { id: station.id, distance };
    }
  }

  return nearest;
}

function numberOrNull(value: number | string | undefined): number | null {
  const number = Number(value);
  return Number.isNaN(number) ? null : number;
}

function valueForRegion(
  values: Record<string, number | string> | undefined,
  region: string | null
): number | null {
  if (!values || !region) return null;
  return numberOrNull(values[region]);
}

function defaultRegions(): RegionMetadata[] {
  return [
    { name: 'west', labelLocation: { latitude: 1.35735, longitude: 103.7 } },
    { name: 'north', labelLocation: { latitude: 1.41803, longitude: 103.82 } },
    { name: 'central', labelLocation: { latitude: 1.35735, longitude: 103.82 } },
    { name: 'south', labelLocation: { latitude: 1.29587, longitude: 103.82 } },
    { name: 'east', labelLocation: { latitude: 1.35735, longitude: 103.94 } },
  ];
}
