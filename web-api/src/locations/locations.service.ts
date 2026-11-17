import {
  Injectable,
  Logger,
  ServiceUnavailableException
} from '@nestjs/common';
import { apiError } from '../common/errors/api-error';

// Photon (Komoot) is a keyless geocoder built for as-you-type search. Overridable
// so a self-hosted deployment can point at its own Photon instance.
const PHOTON_ENDPOINT =
  process.env.LOCATION_GEOCODER_URL || 'https://photon.komoot.io/api/';
const FETCH_TIMEOUT_MS = 5_000;
// Identifies this app to the geocoder per its usage etiquette.
const FETCH_USER_AGENT = 'job-tracker/1.0 (location autocomplete)';
const MAX_SUGGESTIONS = 8;

/** A Photon GeoJSON feature — only the address fields we build a label from. */
type PhotonFeature = {
  properties?: {
    name?: unknown;
    city?: unknown;
    state?: unknown;
    country?: unknown;
  };
};

@Injectable()
export class LocationsService {
  private readonly logger = new Logger(LocationsService.name);

  /**
   * Returns up to MAX_SUGGESTIONS unique "City, Country" strings for the query,
   * via Photon (Komoot) — a keyless geocoder built for as-you-type search. An
   * upstream failure maps to a 503 rather than an opaque 500; a too-short or
   * empty query short-circuits to an empty list without a network call.
   */
  async suggest(query: string): Promise<string[]> {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      return [];
    }

    const url = new URL(PHOTON_ENDPOINT);
    url.searchParams.set('q', trimmed);
    // `city` layer covers cities, towns and villages — the place granularity we want.
    url.searchParams.set('layer', 'city');
    url.searchParams.set('lang', 'en');
    url.searchParams.set('limit', String(MAX_SUGGESTIONS * 2));

    let features: PhotonFeature[];
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': FETCH_USER_AGENT, Accept: 'application/json' },
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)
      });

      if (!response.ok) {
        this.logger.error(`Photon request failed (${response.status})`);
        throw new ServiceUnavailableException(
          apiError(
            'LOCATION_SUGGEST_UNAVAILABLE',
            'Location suggestions are unavailable right now — please type it in'
          )
        );
      }

      const body = (await response.json()) as { features?: PhotonFeature[] };
      features = Array.isArray(body.features) ? body.features : [];
    } catch (error) {
      if (error instanceof ServiceUnavailableException) {
        throw error;
      }

      this.logger.error(
        `Photon request errored: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      throw new ServiceUnavailableException(
        apiError(
          'LOCATION_SUGGEST_UNAVAILABLE',
          'Location suggestions are unavailable right now — please type it in'
        )
      );
    }

    return this.toLabels(features);
  }

  /** Builds deduped "City, Country" labels, skipping features missing either part. */
  private toLabels(features: PhotonFeature[]): string[] {
    const seen = new Set<string>();
    const labels: string[] = [];

    for (const feature of features) {
      const properties = feature.properties ?? {};
      const city = this.asText(properties.name) ?? this.asText(properties.city);
      const country = this.asText(properties.country);
      if (!city || !country) {
        continue;
      }

      const label = `${city}, ${country}`;
      const key = label.toLocaleLowerCase();
      if (seen.has(key)) {
        continue;
      }

      seen.add(key);
      labels.push(label);
      if (labels.length >= MAX_SUGGESTIONS) {
        break;
      }
    }

    return labels;
  }

  private asText(value: unknown): string | null {
    return typeof value === 'string' && value.trim().length > 0
      ? value.trim()
      : null;
  }
}
