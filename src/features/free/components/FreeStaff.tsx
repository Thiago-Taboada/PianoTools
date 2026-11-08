import { useEffect, useId, useRef } from 'react';
import { Renderer, Stave } from 'vexflow';
import type { Clef } from '../../../core/music/types';
import styles from './FreeStaff.module.css';

// Dimensiones base en unidades VexFlow (coherentes con StaffNote de flashcards).
const BASE_WIDTH = 620;
const BASE_HEIGHT = 340;
const STAVE_X = 20;
const STAVE_Y = 70;
const STAVE_WIDTH = 560;

// VexFlow pinta sobre SVG y no lee variables CSS: literal equivalente al token.
const COLOR_DEFAULT = '#1b1a17';

interface FreeStaffProps {
  /** Clave del pentagrama. Por defecto `'treble'`; preparado para un selector futuro. */
  clef?: Clef;
}

/**
 * Pentagrama VACÍO centrado (sin notas). El modo libre superpone las notas
 * tocadas como overlay de fichas, así que este componente solo dibuja el stave.
 */
export function FreeStaff({ clef = 'treble' }: FreeStaffProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const reactId = useId();
  const elementId = `free-staff-${reactId.replace(/:/g, '')}`;

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
    context.setFillStyle(COLOR_DEFAULT);
    context.setStrokeStyle(COLOR_DEFAULT);

    const stave = new Stave(STAVE_X, STAVE_Y, STAVE_WIDTH);
    stave.addClef(clefName);
    stave.setContext(context).draw();
  }, [clef, elementId]);

  return (
    <div className={styles.wrap}>
      <div ref={hostRef} id={elementId} className={styles.staff} />
    </div>
  );
}
