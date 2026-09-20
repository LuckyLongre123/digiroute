import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ---- Types ---------------------------------------------------------------

export interface AddressDraftMetadata {
  floor: string;
  flat: string;
  landmark: string;
  label: string; // e.g. 'Home', 'Office', 'Delivery Point'
  customTag?: string;
  passcode?: string;
  expiry?: string;
  saveToAccount?: boolean;
}

export interface LiveViewer {
  id: string;
  name: string;
  lat: number;
  lng: number;
  distanceMeters: number;
  status: 'en_route' | 'arrived';
  updatedAt: string;
}

export interface AddressDraftState {
  _hasHydrated: boolean;
  // Step tracking (1: Base Location, 2: Camera, 3: Map, 4: Metadata, 5: Share)
  step: 1 | 2 | 3 | 4 | 5;
  currentStep: number;
  // Step 1: Base Location
  digipin: string;
  latitude: number | null;
  baseLat?: number | null;
  longitude: number | null;
  baseLng?: number | null;
  // Step 2: Visual Lock
  doorwayPhotoBlob: Blob | null;
  doorwayPhotoUrl?: string | null;
  photoUrl?: string | null;
  doorwayPhotoKey?: string | null;
  doorwayPhotoBase64?: string | null;
  // Step 3: Entrance Pin
  entranceLat?: number | null;
  entranceLng?: number | null;
  // Step 4: Secondary metadata & security
  floor?: string;
  flat?: string;
  landmark?: string;
  metadata: AddressDraftMetadata;
  // Step 5: Share
  slug: string;
  isEphemeral: boolean;
  expiresAt?: string | null;
  isCompleted: boolean;
  isSaved: boolean;
  // Background Cloudinary Upload Promise Tracker
  uploadPromise?: Promise<string | null> | null;
  // Live Radar & Tracking
  isLiveTracking: boolean;
  activeViewers: LiveViewer[];
}

interface AddressStoreActions {
  setHasHydrated: (hydrated: boolean) => void;
  setDigipin: (code: string) => void;
  setCoordinates: (lat: number, lng: number) => void;
  setEntranceCoordinates: (lat: number, lng: number) => void;
  setPhotoBlob: (blob: Blob | null) => void;
  setPhotoUrl: (url: string | null) => void;
  setPhotoKey: (key: string | null) => void;
  setPhotoBase64: (base64: string | null) => void;
  setMetadata: (data: Partial<AddressDraftMetadata>) => void;
  setFloor: (floor: string) => void;
  setFlat: (flat: string) => void;
  setLandmark: (landmark: string) => void;
  setStep: (step: AddressDraftState['step']) => void;
  setCurrentStep: (step: number) => void;
  setSlug: (slug: string, isEphemeral?: boolean) => void;
  setIsCompleted: (completed: boolean) => void;
  setIsSaved: (saved: boolean) => void;
  setIsEphemeral: (isEphemeral: boolean) => void;
  setExpiresAt: (expiresAt: string | null) => void;
  setSaveToAccount: (saveToAccount: boolean) => void;
  setIsLiveTracking: (enabled: boolean) => void;
  setUploadPromise: (promise: Promise<string | null> | null) => void;
  addOrUpdateViewer: (viewer: LiveViewer) => void;
  removeViewer: (id: string) => void;
  resetDraft: () => void;
}

export type AddressStore = AddressDraftState & AddressStoreActions;

// ---- Initial state -------------------------------------------------------

const initialState: AddressDraftState = {
  _hasHydrated: false,
  step: 1,
  currentStep: 1,
  digipin: '',
  latitude: null,
  baseLat: null,
  longitude: null,
  baseLng: null,
  doorwayPhotoBlob: null,
  doorwayPhotoUrl: null,
  photoUrl: null,
  doorwayPhotoKey: null,
  doorwayPhotoBase64: null,
  entranceLat: null,
  entranceLng: null,
  floor: '',
  flat: '',
  landmark: '',
  metadata: {
    floor: '',
    flat: '',
    landmark: '',
    label: 'Home',
    customTag: '',
    passcode: '',
    expiry: '30m',
    saveToAccount: true,
  },
  slug: '',
  isEphemeral: true,
  expiresAt: null,
  isCompleted: false,
  isSaved: false,
  uploadPromise: null,
  isLiveTracking: false,
  activeViewers: [],
};

// ---- Store ---------------------------------------------------------------

export const useAddressStore = create<
  AddressDraftState & AddressStoreActions
>()(
  persist(
    (set) => ({
      ...initialState,

      setHasHydrated: (hydrated) => set({ _hasHydrated: hydrated }),

      setDigipin: (code) => set({ digipin: code }),

      setCoordinates: (lat, lng) =>
        set({ latitude: lat, baseLat: lat, longitude: lng, baseLng: lng }),

      setEntranceCoordinates: (lat, lng) =>
        set({ entranceLat: lat, entranceLng: lng }),

      setPhotoBlob: (blob) => set({ doorwayPhotoBlob: blob }),

      setPhotoUrl: (url) => set({ doorwayPhotoUrl: url, photoUrl: url }),

      setPhotoKey: (key) => set({ doorwayPhotoKey: key }),

      setPhotoBase64: (base64) => set({ doorwayPhotoBase64: base64 }),

      setMetadata: (data) =>
        set((state) => ({
          metadata: { ...state.metadata, ...data },
          floor: data.floor !== undefined ? data.floor : state.floor,
          flat: data.flat !== undefined ? data.flat : state.flat,
          landmark:
            data.landmark !== undefined ? data.landmark : state.landmark,
          isSaved: data.saveToAccount === false ? false : state.isSaved,
          isEphemeral: data.saveToAccount === false ? true : state.isEphemeral,
        })),

      setFloor: (floor) =>
        set((state) => ({
          floor,
          metadata: { ...state.metadata, floor },
        })),

      setFlat: (flat) =>
        set((state) => ({
          flat,
          metadata: { ...state.metadata, flat },
        })),

      setLandmark: (landmark) =>
        set((state) => ({
          landmark,
          metadata: { ...state.metadata, landmark },
        })),

      setStep: (step) => set({ step, currentStep: step }),

      setCurrentStep: (currentStep) =>
        set({ currentStep, step: (currentStep as 1 | 2 | 3 | 4 | 5) || 1 }),

      setSlug: (slug, isEphemeral = true) => set({ slug, isEphemeral }),

      setIsCompleted: (completed) => set({ isCompleted: completed }),

      setIsSaved: (saved) => set({ isSaved: saved }),

      setIsEphemeral: (isEphemeral) => set({ isEphemeral }),

      setExpiresAt: (expiresAt) => set({ expiresAt }),

      setSaveToAccount: (saveToAccount) =>
        set((state) => ({
          metadata: {
            ...state.metadata,
            saveToAccount: Boolean(saveToAccount),
          },
          isSaved: saveToAccount ? state.isSaved : false,
          isEphemeral: saveToAccount ? state.isEphemeral : true,
        })),

      setUploadPromise: (promise) => set({ uploadPromise: promise }),

      setIsLiveTracking: (enabled) => set({ isLiveTracking: enabled }),

      addOrUpdateViewer: (viewer) =>
        set((state) => {
          const existingIndex = state.activeViewers.findIndex(
            (v) => v.id === viewer.id
          );
          if (existingIndex >= 0) {
            const updated = [...state.activeViewers];
            updated[existingIndex] = viewer;
            return { activeViewers: updated };
          }
          return { activeViewers: [...state.activeViewers, viewer] };
        }),

      removeViewer: (id) =>
        set((state) => ({
          activeViewers: state.activeViewers.filter((v) => v.id !== id),
        })),

      resetDraft: () => {
        if (typeof window !== 'undefined') {
          try {
            localStorage.removeItem('digiroute_address_draft');
            sessionStorage.removeItem('digiroute_address_draft');
            localStorage.removeItem('digiroute-draft-storage');
            sessionStorage.removeItem('digiroute-draft-storage');
            localStorage.removeItem('digiroute_camera_key');
            sessionStorage.removeItem('digiroute_camera_key');
          } catch {}
        }
        set(() => ({
          _hasHydrated: true,
          step: 1,
          currentStep: 1,
          digipin: '',
          latitude: null,
          baseLat: null,
          longitude: null,
          baseLng: null,
          doorwayPhotoBlob: null,
          doorwayPhotoUrl: null,
          photoUrl: null,
          doorwayPhotoKey: null,
          doorwayPhotoBase64: null,
          entranceLat: null,
          entranceLng: null,
          floor: '',
          flat: '',
          landmark: '',
          metadata: {
            floor: '',
            flat: '',
            landmark: '',
            label: 'Home',
            customTag: '',
            passcode: '',
            expiry: '30m',
            saveToAccount: true,
          },
          slug: '',
          isEphemeral: true,
          expiresAt: null,
          isCompleted: false,
          isSaved: false,
          uploadPromise: null,
          isLiveTracking: false,
          activeViewers: [],
        }));
      },
    }),
    {
      name: 'digiroute_address_draft',
      version: 4,
      migrate: (persistedState: unknown, version: number) => {
        if (version < 4) {
          return initialState;
        }
        return persistedState as AddressStore;
      },
      partialize: (state) => {
        const {
          _hasHydrated: _unusedHydrated,
          doorwayPhotoBlob: _unusedBlob,
          uploadPromise: _unusedPromise,
          ...rest
        } = state;
        const { passcode: _unusedPasscode, ...restMetadata } = state.metadata;

        // Persist Base64 and Cloudinary URLs, while stripping ephemeral blob: URLs
        const safePhotoUrl =
          state.photoUrl && !state.photoUrl.startsWith('blob:')
            ? state.photoUrl
            : state.doorwayPhotoUrl &&
                !state.doorwayPhotoUrl.startsWith('blob:')
              ? state.doorwayPhotoUrl
              : state.doorwayPhotoBase64 &&
                  !state.doorwayPhotoBase64.startsWith('blob:')
                ? state.doorwayPhotoBase64
                : null;

        return {
          ...rest,
          _hasHydrated: false,
          step: (state.step || 1) as AddressDraftState['step'],
          currentStep: state.currentStep || state.step || 1,
          latitude: state.baseLat ?? state.latitude ?? null,
          baseLat: state.baseLat ?? state.latitude ?? null,
          longitude: state.baseLng ?? state.longitude ?? null,
          baseLng: state.baseLng ?? state.longitude ?? null,
          floor: state.floor ?? state.metadata.floor ?? '',
          flat: state.flat ?? state.metadata.flat ?? '',
          landmark: state.landmark ?? state.metadata.landmark ?? '',
          doorwayPhotoUrl: safePhotoUrl,
          photoUrl: safePhotoUrl,
          doorwayPhotoBase64: state.doorwayPhotoBase64 || safePhotoUrl,
          doorwayPhotoBlob: null,
          metadata: {
            ...restMetadata,
            floor: state.floor ?? state.metadata.floor ?? '',
            flat: state.flat ?? state.metadata.flat ?? '',
            landmark: state.landmark ?? state.metadata.landmark ?? '',
            passcode: '', // Strictly omit raw passcode from localStorage persistence
          },
        };
      },
      onRehydrateStorage: () => {
        return (state, error) => {
          if (error) {
            console.warn(
              '[useAddressStore] Rehydration error encountered:',
              error
            );
          }
          setTimeout(() => {
            useAddressStore.getState().setHasHydrated(true);
          }, 0);
        };
      },
    }
  )
);

/**
 * Hydration tracking hook: Returns true once Zustand store has finished rehydrating from localStorage.
 */
export function useHasHydrated(): boolean {
  const hasHydrated = useAddressStore((state) => state._hasHydrated);
  return hasHydrated;
}

// Module-level in-flight promise reference for zero-latency background handoff across route switches
let activeCloudinaryPromise: Promise<string | null> | null = null;

export function setActiveCloudinaryPromise(p: Promise<string | null> | null) {
  activeCloudinaryPromise = p;
}

export function getActiveCloudinaryPromise(): Promise<string | null> | null {
  return activeCloudinaryPromise;
}
