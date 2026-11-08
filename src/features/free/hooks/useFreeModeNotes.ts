import { useCallback, useEffect, useRef, useState } from 'react';
import type { NormalizedMidiNote } from '../../../core/midi/types';

/** Duración en ms que una nota permanece en pantalla antes de desaparecer. */
export const NOTE_LIFETIME_MS = 3000;

/** Una nota tocada en el modo libre; cada pulsación genera una ficha propia. */
export interface FreeNote {
  id: string;
  pitch: number;
  timestamp: number;
}

let fallbackIdCounter = 0;

function createId(): string {
  // `crypto.randomUUID` existe en navegadores modernos (objetivo de Web MIDI);
  // el fallback evita asumir el entorno y mantiene el tipado estricto.
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  fallbackIdCounter += 1;
  return `free-note-${Date.now()}-${fallbackIdCounter}`;
}

/**
 * Mantiene la lista de notas activas del modo libre con fade por-nota.
 *
 * Cada `note-on` añade una ficha con su `id`/`timestamp` y arranca un
 * `setTimeout` propio (`NOTE_LIFETIME_MS`) que la elimina. Las notas coexisten
 * y cada una se auto-elimina sin cancelar a las demás. Todos los timers se
 * guardan en un `useRef<Map>` y se limpian en el cleanup del desmontaje para
 * no fugar ni hacer `setState` tras desmontar.
 */
export function useFreeModeNotes() {
  const [notes, setNotes] = useState<FreeNote[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );

  const removeNote = useCallback((id: string) => {
    setNotes((current) => current.filter((note) => note.id !== id));
    const timers = timersRef.current;
    const timer = timers.get(id);
    if (timer !== undefined) {
      clearTimeout(timer);
      timers.delete(id);
    }
  }, []);

  const handleMidiEvent = useCallback(
    (event: NormalizedMidiNote | null) => {
      // Solo las pulsaciones (`note-on`) generan fichas; se ignoran las
      // liberaciones y los eventos nulos.
      if (!event || event.type !== 'note-on') {
        return;
      }

      const id = createId();
      const note: FreeNote = { id, pitch: event.pitch, timestamp: event.timestamp };
      setNotes((current) => [...current, note]);

      const timer = setTimeout(() => {
        removeNote(id);
      }, NOTE_LIFETIME_MS);
      timersRef.current.set(id, timer);
    },
    [removeNote],
  );

  const clear = useCallback(() => {
    const timers = timersRef.current;
    timers.forEach((timer) => clearTimeout(timer));
    timers.clear();
    setNotes([]);
  }, []);

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
    };
  }, []);

  return { notes, handleMidiEvent, clear };
}
