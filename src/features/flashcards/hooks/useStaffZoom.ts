import { useEffect, useState } from 'react';

export const MIN_ZOOM = 0.6;
export const MAX_ZOOM = 2.0;
export const ZOOM_STEP = 0.2;
export const DEFAULT_ZOOM = 1;
export const STAFF_ZOOM_STORAGE_KEY = 'pianotools.flashcards.staffZoom';

function clamp(value: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
}

function roundStep(value: number): number {
  return Math.round(value * 10) / 10;
}

function readStoredZoom(): number {
  try {
    const raw = window.localStorage.getItem(STAFF_ZOOM_STORAGE_KEY);
    if (raw === null) {
      return DEFAULT_ZOOM;
    }
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) {
      return DEFAULT_ZOOM;
    }
    return clamp(parsed);
  } catch {
    return DEFAULT_ZOOM;
  }
}

export interface StaffZoomApi {
  zoom: number;
  zoomIn: () => void;
  zoomOut: () => void;
  canZoomIn: boolean;
  canZoomOut: boolean;
}

/**
 * Gestiona el nivel de zoom del pentagrama y lo persiste en localStorage
 * (clave `pianotools.flashcards.staffZoom`). La lectura/escritura está
 * protegida con try/catch para no romper si el almacenamiento no está
 * disponible, y la persistencia vive en un useEffect (fuera del render).
 */
export function useStaffZoom(): StaffZoomApi {
  const [zoom, setZoom] = useState<number>(readStoredZoom);

  useEffect(() => {
    try {
      window.localStorage.setItem(STAFF_ZOOM_STORAGE_KEY, String(zoom));
    } catch {
      // Ignorar: el almacenamiento puede no estar disponible.
    }
  }, [zoom]);

  const zoomIn = () => setZoom((value) => clamp(roundStep(value + ZOOM_STEP)));
  const zoomOut = () => setZoom((value) => clamp(roundStep(value - ZOOM_STEP)));

  return {
    zoom,
    zoomIn,
    zoomOut,
    canZoomIn: zoom < MAX_ZOOM,
    canZoomOut: zoom > MIN_ZOOM,
  };
}
