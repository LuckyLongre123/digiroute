// ============================================================
// DigiRoute — Typed Service Layer (FOUND-03)
// All API communication routes through this abstraction.
// Provides: standardized error envelope, auth injection,
// timeout handling, and typed domain service methods.
// ============================================================

// ---- Response Envelope --------------------------------------------------

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

// ---- Request Options ----------------------------------------------------

interface ApiClientOptions extends RequestInit {
  timeoutMs?: number;
}

// ---- Core Fetch Wrapper -------------------------------------------------

async function apiClient<T>(
  endpoint: string,
  options: ApiClientOptions = {}
): Promise<ApiResponse<T>> {
  const { timeoutMs = 10000, ...fetchOptions } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(endpoint, {
      ...fetchOptions,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...fetchOptions.headers,
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorBody: { code?: string; message?: string } = {};
      try {
        errorBody = await response.json();
      } catch {
        // ignore parse error
      }
      return {
        success: false,
        error: {
          code: errorBody.code ?? `HTTP_${response.status}`,
          message:
            errorBody.message ??
            `Request failed with status ${response.status}`,
        },
      };
    }

    const data = (await response.json()) as T;
    return { success: true, data };
  } catch (err) {
    clearTimeout(timeoutId);

    if (err instanceof Error && err.name === 'AbortError') {
      return {
        success: false,
        error: {
          code: 'TIMEOUT',
          message: 'Request timed out. Please check your connection.',
        },
      };
    }

    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message:
          err instanceof Error
            ? err.message
            : 'An unexpected network error occurred.',
      },
    };
  }
}

// ============================================================
// Address Service — resolve & persist micro-addresses
// ============================================================

export interface PublicAddressCard {
  slug: string;
  digipin: string;
  lat: number;
  lng: number;
  photoUrl: string | null;
  metadata: {
    floor: string;
    flat: string;
    landmark: string;
    label: string;
  };
  isEphemeral: boolean;
  createdAt: number;
}

export interface CreateAddressDraft {
  digipin: string;
  lat: number;
  lng: number;
  photoBlob?: Blob;
  metadata: {
    floor: string;
    flat: string;
    landmark: string;
    label: string;
  };
  isEphemeral?: boolean;
}

export const addressService = {
  async getBySlug(slug: string): Promise<ApiResponse<PublicAddressCard>> {
    return apiClient<PublicAddressCard>(`/api/addresses/${slug}`);
  },

  async create(
    draft: CreateAddressDraft
  ): Promise<ApiResponse<{ slug: string }>> {
    const formData = new FormData();
    formData.append('digipin', draft.digipin);
    formData.append('lat', String(draft.lat));
    formData.append('lng', String(draft.lng));
    formData.append('metadata', JSON.stringify(draft.metadata));
    formData.append('isEphemeral', String(draft.isEphemeral ?? true));
    if (draft.photoBlob) {
      formData.append('photo', draft.photoBlob, 'doorway.webp');
    }

    return apiClient<{ slug: string }>('/api/addresses', {
      method: 'POST',
      body: formData,
      headers: {}, // Let browser set multipart boundary
    });
  },
};

// ============================================================
// Auth Service — session management via Server Actions
// ============================================================

export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  expiresAt: number;
}

export const authService = {
  async getSession(): Promise<ApiResponse<SessionPayload>> {
    return apiClient<SessionPayload>('/api/auth/session');
  },

  async logout(): Promise<ApiResponse<void>> {
    return apiClient<void>('/api/auth/logout', { method: 'POST' });
  },
};

// ============================================================
// Civic Reporting Service — anonymous grievance submission
// ============================================================

export type CivicCategory =
  'pothole' | 'broken-streetlight' | 'water-leak' | 'road-block' | 'other';

export interface CivicReport {
  category: CivicCategory;
  description?: string;
  lat?: number;
  lng?: number;
  digipin?: string;
  photoBlob?: Blob;
}

export const civicService = {
  async submitReport(
    report: CivicReport
  ): Promise<ApiResponse<{ reportId: string }>> {
    const formData = new FormData();
    formData.append('category', report.category);
    if (report.description) formData.append('description', report.description);
    if (report.lat != null) formData.append('lat', String(report.lat));
    if (report.lng != null) formData.append('lng', String(report.lng));
    if (report.digipin) formData.append('digipin', report.digipin);
    if (report.photoBlob)
      formData.append('photo', report.photoBlob, 'evidence.webp');

    return apiClient<{ reportId: string }>('/api/civic/report', {
      method: 'POST',
      body: formData,
      headers: {},
    });
  },
};
