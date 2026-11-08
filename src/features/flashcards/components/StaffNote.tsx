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

interface StaffNoteProps {
  pitches: number[];
  clef: Clef;
  zoom: number;
}

export function StaffNote({ pitches, clef, zoom }: StaffNoteProps) {
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
    const sorted = [...pitches].sort((a, b) => a - b);
    const mapped = sorted.map((pitch) => midiToVexKey(pitch));

    const renderer = new Renderer(host, Renderer.Backends.SVG);
    renderer.resize(BASE_WIDTH * zoom, BASE_HEIGHT * zoom);
    const context = renderer.getContext();
    // Escalar el contexto para que todo el dibujo use unidades base.
    context.scale(zoom, zoom);
    context.setFillStyle('#1b1a17');
    context.setStrokeStyle('#1b1a17');

    const stave = new Stave(STAVE_X, STAVE_Y, STAVE_WIDTH);
    stave.addClef(clefName);
    stave.setContext(context).draw();

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

    const voice = new Voice({ numBeats: 4, beatValue: 4 });
    voice.addTickables([note]);
    new Formatter().joinVoices([voice]).format([voice], FORMAT_WIDTH);
    voice.draw(context, stave);
  }, [pitches, clef, zoom, elementId]);

  return (
    <div className={styles.wrap}>
      <div ref={hostRef} id={elementId} className={styles.staff} />
    </div>
  );
}
