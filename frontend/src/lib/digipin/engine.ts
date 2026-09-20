/**
 * DIGIPIN Mathematical Engine (DIGIPIN-01, DIGIPIN-02, DIGIPIN-03)
 *
 * Official Department of Posts (India Post) WGS84 Spatial Addressing Standard.
 * Powered by `digipinjs-lib`, the official JavaScript implementation of India's DIGIPIN geocoding standard.
 *
 * - Geodetic Bounding Box: 2.5°N to 38.5°N latitude, 63.5°E to 99.5°E longitude
 * - Charset: 16 alphanumeric characters: 23456789CJKLMPFT (4 bits per character)
 * - Hierarchy: 10 recursive subdivisions yielding ~3.8m x 3.8m doorway resolution
 * - Official formatting: 3-3-4 character blocks with hyphens (e.g. 39J-M99-P923)
 */

import {
  encode as libEncode,
  decode as libDecode,
  isValid as libIsValid,
  isValidCoordinate as libIsValidCoordinate,
  getBounds as libGetBounds,
  INDIA_BOUNDS,
  DIGIPIN_ALPHABET,
} from 'digipinjs-lib';

export const DIGIPIN_BOUNDS = {
  MIN_LAT: INDIA_BOUNDS.MIN_LAT, // 2.5
  MAX_LAT: INDIA_BOUNDS.MAX_LAT, // 38.5
  MIN_LNG: INDIA_BOUNDS.MIN_LON, // 63.5
  MAX_LNG: INDIA_BOUNDS.MAX_LON, // 99.5
} as const;

export const DIGIPIN_CHARSET = DIGIPIN_ALPHABET; // '23456789CJKLMPFT'
export const DIGIPIN_CODE_LENGTH = 10;

export interface DigipinBounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

export interface DigipinLocation {
  center: {
    lat: number;
    lng: number;
  };
  bounds: DigipinBounds;
  accuracyMeters: {
    latMeters: number;
    lngMeters: number;
  };
}

/**
 * Verify if coordinates fall strictly within India's supported boundary.
 */
export function isWithinIndiaBounds(lat: number, lng: number): boolean {
  if (
    typeof lat !== 'number' ||
    typeof lng !== 'number' ||
    isNaN(lat) ||
    isNaN(lng)
  ) {
    return false;
  }
  return libIsValidCoordinate(lat, lng);
}

/**
 * Sanitize and clean user DIGIPIN string.
 * Strips whitespace, hyphens, and converts to uppercase.
 */
export function cleanDigipin(input: string | null | undefined): string {
  if (!input) return '';
  return input.toUpperCase().replace(/[^23456789CJKLMPFT]/g, '');
}

/**
 * Validates a DIGIPIN candidate string.
 * Strict check: must be exactly 10 characters from the allowed charset.
 */
export function isValid(input: string | null | undefined): boolean {
  if (!input) return false;
  const clean = cleanDigipin(input);
  if (clean.length !== DIGIPIN_CODE_LENGTH) return false;
  return libIsValid(clean, true);
}

/**
 * Format a DIGIPIN into official standard readable blocks: XXX-XXX-XXXX (e.g. 39J-M99-P923)
 */
export function formatDigipin(input: string | null | undefined): string {
  const clean = cleanDigipin(input);
  if (!clean) return '';
  if (clean.length <= 3) return clean;
  if (clean.length <= 6) return `${clean.slice(0, 3)}-${clean.slice(3)}`;
  return `${clean.slice(0, 3)}-${clean.slice(3, 6)}-${clean.slice(6, 10)}`;
}

/**
 * Encode WGS84 coordinates into an official 10-character DIGIPIN.
 * By default returns the official hyphenated format (e.g. 39J-M99-P923).
 */
export function encode(
  lat: number,
  lng: number,
  formatted: boolean = true
): string {
  if (
    typeof lat !== 'number' ||
    typeof lng !== 'number' ||
    isNaN(lat) ||
    isNaN(lng)
  ) {
    throw new Error('Latitude and Longitude must be valid numbers.');
  }

  if (!isWithinIndiaBounds(lat, lng)) {
    throw new Error(
      `Coordinates (${lat.toFixed(4)}, ${lng.toFixed(4)}) are outside India's bounding box. Valid range: lat 2.5-38.5, lon 63.5-99.5`
    );
  }

  const rawCode = libEncode(lat, lng, DIGIPIN_CODE_LENGTH);
  return formatted ? formatDigipin(rawCode) : rawCode;
}

/**
 * Decode a DIGIPIN into bounding box and center coordinate.
 * Accepts both formatted (39J-M99-P923) and unformatted (39JM99P923) codes.
 */
export function decode(digipin: string): DigipinLocation {
  const clean = cleanDigipin(digipin);

  if (clean.length !== DIGIPIN_CODE_LENGTH) {
    throw new Error(
      `DIGIPIN must be exactly ${DIGIPIN_CODE_LENGTH} characters. Received ${clean.length}.`
    );
  }

  if (!libIsValid(clean, true)) {
    throw new Error(`Invalid DIGIPIN code: ${digipin}`);
  }

  const coord = libDecode(clean);
  const bounds = libGetBounds(clean);

  const centerLat = Number(coord.lat.toFixed(6));
  const centerLng = Number(coord.lon.toFixed(6));

  const latSpanMeters = (bounds.maxLat - bounds.minLat) * 111000;
  const lngSpanMeters =
    (bounds.maxLon - bounds.minLon) *
    111000 *
    Math.cos((centerLat * Math.PI) / 180);

  return {
    center: {
      lat: centerLat,
      lng: centerLng,
    },
    bounds: {
      minLat: Number(bounds.minLat.toFixed(6)),
      maxLat: Number(bounds.maxLat.toFixed(6)),
      minLng: Number(bounds.minLon.toFixed(6)),
      maxLng: Number(bounds.maxLon.toFixed(6)),
    },
    accuracyMeters: {
      latMeters: Number(latSpanMeters.toFixed(2)),
      lngMeters: Number(lngSpanMeters.toFixed(2)),
    },
  };
}
