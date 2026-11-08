import { midiToSolfege } from './pitch';

/**
 * Teoría de acordes para el modo de entrenamiento de flashcards.
 * Solo estado fundamental.
 * Mejora futura: inversiones (hoy solo estado fundamental).
 */
export type ChordQuality =
  | 'major'
  | 'minor'
  | 'dim'
  | 'aug'
  | 'dom7'
  | 'maj7'
  | 'm7';

/** Intervalos (en semitonos) desde la raíz para cada calidad. */
export const CHORD_INTERVALS: Record<ChordQuality, number[]> = {
  major: [0, 4, 7],
  minor: [0, 3, 7],
  dim: [0, 3, 6],
  aug: [0, 4, 8],
  dom7: [0, 4, 7, 10],
  maj7: [0, 4, 7, 11],
  m7: [0, 3, 7, 10],
};

export interface ChordQualityOption {
  id: ChordQuality;
  label: string;
}

/** Sufijo en español que acompaña al nombre de la raíz en la etiqueta. */
const CHORD_SUFFIX: Record<ChordQuality, string> = {
  major: 'mayor',
  minor: 'menor',
  dim: 'disminuido',
  aug: 'aumentado',
  dom7: '7',
  maj7: 'maj7',
  m7: 'm7',
};

/** Calidades disponibles con etiqueta en español para la UI. */
export function chordQualities(): ChordQualityOption[] {
  return [
    { id: 'major', label: 'Mayor' },
    { id: 'minor', label: 'Menor' },
    { id: 'dim', label: 'Disminuido' },
    { id: 'aug', label: 'Aumentado' },
    { id: 'dom7', label: 'Dominante 7 (7)' },
    { id: 'maj7', label: 'Mayor 7 (maj7)' },
    { id: 'm7', label: 'Menor 7 (m7)' },
  ];
}

export interface ChordInfo {
  pitches: number[];
  label: string;
}

/**
 * Construye un acorde en estado fundamental a partir de una raíz MIDI y una
 * calidad. La etiqueta usa el nombre solfeo de la clase de altura de la raíz
 * (sin octava) + el sufijo en español de la calidad.
 *
 * Ejemplos:
 *   buildChord(60, 'major') => { pitches: [60, 64, 67], label: 'Do mayor' }
 *   buildChord(69, 'minor') => { pitches: [69, 72, 76], label: 'La menor' }
 */
export function buildChord(rootMidi: number, quality: ChordQuality): ChordInfo {
  const pitches = CHORD_INTERVALS[quality].map((interval) => rootMidi + interval);
  const rootName = midiToSolfege(rootMidi).replace(/\d+$/, '');
  return {
    pitches,
    label: `${rootName} ${CHORD_SUFFIX[quality]}`,
  };
}
