import { useEffect, useId, useRef } from 'react';
import {
  Accidental,
  Formatter,
  Renderer,
  Stave,
  StaveNote,
  Voice,
} from 'vexflow';
import { midiToVexKey } from '../../../core/music/pitch';
import type { Clef } from '../../../core/music/types';
import styles from './StaffNote.module.css';

// Dimensiones base en unidades VexFlow. El zoom escala el render real
// (renderer.resize + context.scale) para conservar nitidez.
const BASE_WIDTH = 620;
const BASE_HEIGHT = 340;
const STAVE_X = 20;
const STAVE_Y = 70;
const STAVE_WIDTH = 560;
const FORMAT_WIDTH = 480;
// Ancho de formateo reservado por nota en una secuencia; se acota al ancho útil
// del pentagrama para que varias notas no se amontonen sin salirse del stave.
const SEQUENCE_WIDTH_PER_NOTE = 110;

// Colores alineados con el tema (VexFlow pinta sobre SVG y no lee variables
// CSS, por eso se usan literales equivalentes a los tokens de `index.css`).
const COLOR_DEFAULT = '#1b1a17';
const COLOR_CURRENT = '#e2b54a'; // --accent: nota actual destacada.
const COLOR_DONE = '#8a8578'; // nota ya tocada (atenuada).

interface StaffNoteProps {
  pitches: number[];
  clef: Clef;
  zoom: number;
  /** `'sequence'` dibuja N notas en horizontal; `'simultaneous'` las apila. */
  playback: 'sequence' | 'simultaneous';
  /** Índice de la nota actual en la secuencia (para resaltarla). */
  currentIndex?: number;
}

export function StaffNote({
  pitches,
  clef,
  zoom,
  playback,
  currentIndex = 0,
}: StaffNoteProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const reactId = useId();
  const elementId = `staff-${reactId.replace(/:/g, '')}`;

  useEffect(() => {
    const host = hostRef.current;
    if (!host || pitches.length === 0) {
      return;
    }

    host.replaceChildren();

    const clefName = clef === 'bass' ? 'bass' : 'treble';
    const isSequence = playback === 'sequence' && pitches.length > 1;

    const renderer = new Renderer(host, Renderer.Backends.SVG);
    renderer.resize(BASE_WIDTH * zoom, BASE_HEIGHT * zoom);
    const context = renderer.getContext();
    // Escalar el contexto para que todo el dibujo use unidades base.
    context.scale(zoom, zoom);
    context.setFillStyle(COLOR_DEFAULT);
    context.setStrokeStyle(COLOR_DEFAULT);

    const stave = new Stave(STAVE_X, STAVE_Y, STAVE_WIDTH);
    stave.addClef(clefName);
    stave.setContext(context).draw();

    let notes: StaveNote[];
    let formatWidth: number;

    if (isSequence) {
      // Una nota por tiempo (negras) en el orden de la melodía. Resalta la nota
      // actual; atenúa las ya tocadas; deja las futuras en el color normal.
      notes = pitches.map((pitch, index) => {
        const { key, accidental } = midiToVexKey(pitch);
        const note = new StaveNote({
          keys: [key],
          duration: 'q',
          clef: clefName,
        });
        if (accidental) {
          note.addModifier(new Accidental(accidental), 0);
        }
        const color =
          index < currentIndex
            ? COLOR_DONE
            : index === currentIndex
              ? COLOR_CURRENT
              : COLOR_DEFAULT;
        note.setStyle({ fillStyle: color, strokeStyle: color });
        return note;
      });
      formatWidth = Math.min(
        STAVE_WIDTH - 60,
        SEQUENCE_WIDTH_PER_NOTE * pitches.length,
      );
    } else {
      // Acorde o nota única: un StaveNote apilado con sus alteraciones.
      const sorted = [...pitches].sort((a, b) => a - b);
      const mapped = sorted.map((pitch) => midiToVexKey(pitch));
      const note = new StaveNote({
        keys: mapped.map((item) => item.key),
        duration: 'w',
        clef: clefName,
      });
      mapped.forEach((item, index) => {
        if (item.accidental) {
          note.addModifier(new Accidental(item.accidental), index);
        }
      });
      notes = [note];
      formatWidth = FORMAT_WIDTH;
    }

    const voice = new Voice({ numBeats: 4, beatValue: 4 });
    // En secuencia el número de negras varía (1–4), así que no siempre suman un
    // compás completo: modo flexible para que el Formatter no exija 4 tiempos.
    if (isSequence) {
      voice.setMode(Voice.Mode.SOFT);
    }
    voice.addTickables(notes);
    new Formatter().joinVoices([voice]).format([voice], formatWidth);
    voice.draw(context, stave);
  }, [pitches, clef, zoom, playback, currentIndex, elementId]);

  return (
    <div className={styles.wrap}>
      <div ref={hostRef} id={elementId} className={styles.staff} />
    </div>
  );
}
