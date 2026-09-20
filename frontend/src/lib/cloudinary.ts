/**
 * Cloudinary Direct Unsigned Upload Utility
 *
 * Enables client-side image uploads directly from the browser to Cloudinary
 * using unsigned upload presets, bypassing server payload limits and reducing latency.
 */

export interface CloudinaryUploadResult {
  success: boolean;
  url?: string;
  publicId?: string;
  error?: string;
}

/**
 * Upload an image (Blob, File, or base64 data URL) directly to Cloudinary.
 * Uses NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET.
 */
export async function uploadToCloudinary(
  file: Blob | File | string
): Promise<CloudinaryUploadResult> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    const warning =
      'Cloudinary configuration missing (NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME or NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET).';
    console.warn(`[Cloudinary] ${warning}`);
    return {
      success: false,
      error: warning,
    };
  }

  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);

    const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorJson = await response.json().catch(() => null);
      const message =
        errorJson?.error?.message ||
        `Cloudinary upload failed with HTTP ${response.status}`;
      console.error('[Cloudinary] Upload failed:', message);
      return {
        success: false,
        error: message,
      };
    }

    const data = await response.json();
    const secureUrl = data.secure_url || data.url;

    return {
      success: true,
      url: secureUrl,
      publicId: data.public_id,
    };
  } catch (error: unknown) {
    console.error('[Cloudinary] Network error:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Network error during Cloudinary upload',
    };
  }
}
