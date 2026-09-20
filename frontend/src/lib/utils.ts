import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Dynamic Distance Formatting:
 * If >= 1000 meters: Convert to kilometers (meters / 1000).toFixed(1) and append "km".
 * If < 1000 meters: Round to nearest whole number and append "m".
 */
export function formatRoutingDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }
  return `${Math.round(meters)} m`;
}

export const formatDistance = formatRoutingDistance;

/**
 * Dynamic Duration / ETA Formatting:
 * If < 60 seconds: "1 min"
 * If < 3600 seconds (1 hour): Math.round(seconds / 60) + " min"
 * If >= 3600 seconds: Format into hours and minutes (e.g., "1 hr 15 min" or "1 hr")
 */
export function formatRoutingDuration(seconds: number): string {
  if (seconds < 60) {
    return '1 min';
  }
  if (seconds < 3600) {
    const mins = Math.round(seconds / 60);
    if (mins < 60) {
      return `${mins} min`;
    }
    return '1 hr';
  }
  const totalMinutes = Math.round(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;
  if (remainingMinutes === 0) {
    return `${hours} hr`;
  }
  return `${hours} hr ${remainingMinutes} min`;
}

export const formatDuration = formatRoutingDuration;
