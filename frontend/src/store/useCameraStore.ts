import { create } from 'zustand';

// ---- Types ---------------------------------------------------------------

export type CameraFacingMode = 'environment' | 'user';

export type CameraErrorType =
  | 'permission-denied'
  | 'not-found'
  | 'not-supported'
  | 'stream-error'
  | null;

interface CameraState {
  streamActive: boolean;
  capturedBlob: Blob | null;
  cameraError: CameraErrorType;
  facingMode: CameraFacingMode;
}

interface CameraStoreActions {
  setStreamActive: (active: boolean) => void;
  setCapturedBlob: (blob: Blob | null) => void;
  setCameraError: (error: CameraErrorType) => void;
  setFacingMode: (mode: CameraFacingMode) => void;
  resetCamera: () => void;
}

// ---- Initial state -------------------------------------------------------

const initialState: CameraState = {
  streamActive: false,
  capturedBlob: null,
  cameraError: null,
  facingMode: 'environment', // default to rear camera for doorway capture
};

// ---- Store ---------------------------------------------------------------

export const useCameraStore = create<CameraState & CameraStoreActions>()((set) => ({
  ...initialState,

  setStreamActive: (active) => set({ streamActive: active }),

  setCapturedBlob: (blob) => set({ capturedBlob: blob }),

  setCameraError: (error) => set({ cameraError: error }),

  setFacingMode: (mode) => set({ facingMode: mode }),

  resetCamera: () => set(initialState),
}));
