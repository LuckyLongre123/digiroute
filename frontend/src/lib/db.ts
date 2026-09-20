import Dexie, { type EntityTable } from 'dexie';

// ---- Record Types -------------------------------------------------------

export interface AddressRecord {
  id: string;
  slug: string;
  digipin: string;
  lat: number;
  lng: number;
  photoBlob: Blob | null;
  metadata: {
    floor: string;
    flat: string;
    landmark: string;
    label: string;
  };
  isEphemeral: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface CameraBlobRecord {
  id: string;
  blob: Blob;
  mimeType: string;
  createdAt: number;
}

export interface SettingRecord {
  key: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any;
}

// ---- Database Class -----------------------------------------------------

class DigiRouteDatabase extends Dexie {
  addresses!: EntityTable<AddressRecord, 'id'>;
  camera_blobs!: EntityTable<CameraBlobRecord, 'id'>;
  settings!: EntityTable<SettingRecord, 'key'>;

  constructor() {
    super('DigiRouteDB');

    this.version(1).stores({
      // Primary index first, then secondary indexes
      addresses: 'id, slug, digipin, isEphemeral, createdAt',
      camera_blobs: 'id, createdAt',
      settings: 'key',
    });
  }
}

// ---- Singleton Export ---------------------------------------------------

export const db = new DigiRouteDatabase();

// ---- Storage Helpers ----------------------------------------------------

export async function saveCameraBlob(blob: Blob): Promise<{ id: string; previewUrl: string }> {
  const id = `photo_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const previewUrl = URL.createObjectURL(blob);
  await db.camera_blobs.put({
    id,
    blob,
    mimeType: blob.type || 'image/webp',
    createdAt: Date.now(),
  });
  return { id, previewUrl };
}

export async function getCameraBlob(id: string): Promise<CameraBlobRecord | undefined> {
  return db.camera_blobs.get(id);
}
