import { create } from 'zustand';

// ---- Types ---------------------------------------------------------------

export type MapProvider = 'mappls' | 'leaflet';

export interface Coordinates {
  lat: number;
  lng: number;
}

interface MapState {
  center: Coordinates;
  zoom: number;
  markerPosition: Coordinates;
  isDragging: boolean;
  mapProvider: MapProvider;
}

interface MapStoreActions {
  setCenter: (coords: Coordinates) => void;
  setZoom: (zoom: number) => void;
  setMarkerPosition: (coords: Coordinates) => void;
  setIsDragging: (dragging: boolean) => void;
  setMapProvider: (provider: MapProvider) => void;
}

// ---- Default center: India geographic center ─────────────────────────────

const DEFAULT_CENTER: Coordinates = { lat: 20.5937, lng: 78.9629 };
const DEFAULT_ZOOM = 16;

// ---- Store ---------------------------------------------------------------

export const useMapStore = create<MapState & MapStoreActions>()((set) => ({
  center: DEFAULT_CENTER,
  zoom: DEFAULT_ZOOM,
  markerPosition: DEFAULT_CENTER,
  isDragging: false,
  mapProvider: 'mappls',

  setCenter: (coords) => set({ center: coords }),

  setZoom: (zoom) => set({ zoom }),

  setMarkerPosition: (coords) => set({ markerPosition: coords }),

  setIsDragging: (dragging) => set({ isDragging: dragging }),

  setMapProvider: (provider) => set({ mapProvider: provider }),
}));
