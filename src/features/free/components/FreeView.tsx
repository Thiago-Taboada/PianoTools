import type { CSSProperties } from 'react';
import { midiToNoteName } from '../../../core/music/pitch';
import { NOTE_LIFETIME_MS, type FreeNote } from '../hooks/useFreeModeNotes';
import { FreeNoteGlyph } from './FreeNoteGlyph';
import { FreeStaff } from './FreeStaff';
import styles from './FreeView.module.css';

interface FreeViewProps {
  /** Notas activas (una ficha por pulsación), provistas por `useFreeModeNotes`. */
  notes: FreeNote[];
}

// Tipo auxiliar para pasar la duración del fade y el desplazamiento horizontal
// como variables CSS sin `any`. `--offset-x` es el translateX (px) del glyph.
type NoteStyle = CSSProperties & { '--fade-ms': string; '--offset-x': string };

// Desplazamiento horizontal (px, en unidades base del SVG) entre notas
// consecutivas. Puramente presentacional: el modo libre no tiene ritmo.
const SLOT_WIDTH = 56;
// Nº de notas por fila antes de reiniciar la X (las más nuevas vuelven a la
// izquierda). Como cada nota se auto-elimina a ~3 s, rara vez se llena una fila.
const SLOTS_PER_ROW = 8;

/** Índice de slot horizontal de la nota i-ésima (orden de llegada). */
function slotForIndex(index: number): number {
  return index % SLOTS_PER_ROW;
}

/**
 * Modo libre: pentagrama vacío centrado sobre el que cada tecla tocada se DIBUJA
 * como nota real (VexFlow) en su línea/espacio correcto, con su nombre pequeño
 * debajo. Cada nota persiste ~`NOTE_LIFETIME_MS` y se desvanece con fade (CSS),
 * coexistiendo varias. No contiene lógica musical: reutiliza `pitch.ts`.
 */
export function FreeView({ notes }: FreeViewProps) {
  return (
    <section className={styles.stage}>
      <div className={styles.paper}>
        <FreeStaff />
        <div className={styles.overlay} aria-live="polite">
          {notes.length === 0 ? (
            <p className={styles.hint}>
              Toca una tecla MIDI o A–K para ver las notas.
            </p>
          ) : (
            <div className={styles.glyphLayer}>
              {notes.map((note, index) => {
                const noteStyle: NoteStyle = {
                  '--fade-ms': `${NOTE_LIFETIME_MS}ms`,
                  '--offset-x': `${slotForIndex(index) * SLOT_WIDTH}px`,
                };
                return (
                  <div
                    key={note.id}
                    className={styles.glyphWrap}
                    style={noteStyle}
                  >
                    <FreeNoteGlyph pitch={note.pitch} clef="treble" />
                    <span className={styles.noteName}>
                      {midiToNoteName(note.pitch)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
