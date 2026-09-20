/**
 * Validate and sanitize callbackUrl to strictly prevent open redirects.
 * Only relative paths starting with a single '/' are permitted.
 * Blocks external domains, protocol-relative '//', and trick patterns.
 */
export function sanitizeCallbackUrl(url: string | null | undefined): string {
  if (!url || typeof url !== 'string') {
    return '/dashboard';
  }

  const trimmed = url.trim();

  // Must start with '/' and cannot start with '//' (protocol-relative) or '/\'
  if (
    trimmed.startsWith('/') &&
    !trimmed.startsWith('//') &&
    !trimmed.startsWith('/\\') &&
    !trimmed.includes('\\')
  ) {
    try {
      // Decode to verify no double-encoded open redirect attempts (%2F%2F)
      const decoded = decodeURIComponent(trimmed);
      if (
        decoded.startsWith('/') &&
        !decoded.startsWith('//') &&
        !decoded.startsWith('/\\') &&
        !decoded.includes('\\')
      ) {
        return trimmed;
      }
    } catch {
      return '/dashboard';
    }
  }

  return '/dashboard';
}
