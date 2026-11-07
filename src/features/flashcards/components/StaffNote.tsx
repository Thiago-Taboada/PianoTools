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

interface StaffNoteProps {
  pitch: number;
  clef: Clef;
}

export function StaffNote({ pitch, clef }: StaffNoteProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const reactId = useId();
  const elementId = `staff-${reactId.replace(/:/g, '')}`;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) {
      return;
    }

    host.replaceChildren();

    const renderer = new Renderer(host, Renderer.Backends.SVG);
    renderer.resize(320, 210);
    const context = renderer.getContext();
    context.setFillStyle('#1b1a17');
    context.setStrokeStyle('#1b1a17');

    const stave = new Stave(16, 36, 288);
    stave.addClef(clef === 'bass' ? 'bass' : 'treble');
    stave.setContext(context).draw();

    const { key, accidental } = midiToVexKey(pitch);
    const note = new StaveNote({
      keys: [key],
      duration: 'w',
      clef: clef === 'bass' ? 'bass' : 'treble',
    });

    if (accidental) {
      note.addModifier(new Accidental(accidental));
    }

    const voice = new Voice({ numBeats: 4, beatValue: 4 });
    voice.addTickables([note]);
    new Formatter().joinVoices([voice]).format([voice], 220);
    voice.draw(context, stave);
  }, [pitch, clef, elementId]);

  return (
    <div className={styles.wrap}>
      <div ref={hostRef} id={elementId} className={styles.staff} />
    </div>
  );
}
