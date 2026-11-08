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
import styles from './FreeNoteGlyph.module.css';

// Geometría IDÉNTICA a FreeStaff para que la cabeza de nota caiga exactamente
// sobre la línea/espacio del pentagrama de fondo (ambos SVG comparten tamaño,
// posición del stave y clave). No cambiar sin ajustar también FreeStaff.
const BASE_WIDTH = 620;
const BASE_HEIGHT = 340;
const STAVE_X = 20;
const STAVE_Y = 70;
const STAVE_WIDTH = 560;
// Ancho de formateo: coloca la nota cerca del inicio del stave (tras la clave).
// La separación horizontal entre notas la da el `translateX` del contenedor en
// FreeView, no este valor, así que todas las notas comparten la misma X base.
const FORMAT_WIDTH = 120;

// VexFlow pinta sobre SVG y no lee variables CSS: literal equivalente al token.
const COLOR_NOTE = '#1b1a17';
// Stave del glyph transparente: solo sirve para que VexFlow calcule la posición
// vertical de la nota; el pentagrama visible es el de FreeStaff, de fondo.
const COLOR_TRANSPARENT = 'rgba(0, 0, 0, 0)';

interface FreeNoteGlyphProps {
  /** Altura MIDI de la nota a dibujar. */
  pitch: number;
  /** Clave del pentagrama; debe coincidir con la de FreeStaff. */
  clef?: Clef;
}

/**
 * Dibuja UNA nota VexFlow en un mini-SVG cuya geometría es idéntica a la de
 * `FreeStaff`, de modo que al superponerse la cabeza de nota cae en su
 * línea/espacio real. El stave propio se pinta transparente (solo posiciona la
 * nota); lo visible es la cabeza, la plica, la alteración y las ledger lines.
 * No modifica `StaffNote` de flashcards: replica su patrón de render.
 */
export function FreeNoteGlyph({ pitch, clef = 'treble' }: FreeNoteGlyphProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const reactId = useId();
  const elementId = `free-note-${reactId.replace(/:/g, '')}`;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) {
      return;
    }

    host.replaceChildren();

    const clefName = clef === 'bass' ? 'bass' : 'treble';

    const renderer = new Renderer(host, Renderer.Backends.SVG);
    renderer.resize(BASE_WIDTH, BASE_HEIGHT);
    const context = renderer.getContext();

    // Stave transparente: misma (x, y, ancho) y clave que FreeStaff para que la
    // nota se posicione igual, pero sin pintarse encima del pentagrama real.
    context.setFillStyle(COLOR_TRANSPARENT);
    context.setStrokeStyle(COLOR_TRANSPARENT);
    const stave = new Stave(STAVE_X, STAVE_Y, STAVE_WIDTH);
    stave.addClef(clefName);
    stave.setContext(context).draw();

    // Nota en color sólido (un StaveNote redondo, como en StaffNote).
    const { key, accidental } = midiToVexKey(pitch);
    const note = new StaveNote({
      keys: [key],
      duration: 'w',
      clef: clefName,
    });
    if (accidental) {
      note.addModifier(new Accidental(accidental), 0);
    }
    note.setStyle({ fillStyle: COLOR_NOTE, strokeStyle: COLOR_NOTE });

    const voice = new Voice({ numBeats: 4, beatValue: 4 });
    voice.addTickables([note]);
    new Formatter().joinVoices([voice]).format([voice], FORMAT_WIDTH);
    context.setFillStyle(COLOR_NOTE);
    context.setStrokeStyle(COLOR_NOTE);
    voice.draw(context, stave);
  }, [pitch, clef, elementId]);

  return <div ref={hostRef} id={elementId} className={styles.glyph} />;
}
