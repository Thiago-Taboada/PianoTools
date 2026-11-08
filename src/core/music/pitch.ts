import type { Clef } from './types';

const PITCH_CLASS_NAMES = [
  'C',
  'C#',
  'D',
  'D#',
  'E',
  'F',
  'F#',
  'G',
  'G#',
  'A',
  'A#',
  'B',
] as const;

const SOLFEGE_NAMES = [
  'Do',
  'Do#',
  'Re',
  'Re#',
  'Mi',
  'Fa',
  'Fa#',
  'Sol',
  'Sol#',
  'La',
  'La#',
  'Si',
] as const;

const VEX_KEYS = [
  'c',
  'c',
  'd',
  'd',
  'e',
  'f',
  'f',
  'g',
  'g',
  'a',
  'a',
  'b',
] as const;

const VEX_ACCIDENTALS = [
  null,
  '#',
  null,
  '#',
  null,
  null,
  '#',
  null,
  '#',
  null,
  '#',
  null,
] as const;

export function midiOctave(pitch: number): number {
  return Math.floor(pitch / 12) - 1;
}

export function pitchClass(pitch: number): number {
  return ((pitch % 12) + 12) % 12;
}

export function midiToNoteName(pitch: number): string {
  return `${PITCH_CLASS_NAMES[pitchClass(pitch)]}${midiOctave(pitch)}`;
}

export function midiToSolfege(pitch: number): string {
  return `${SOLFEGE_NAMES[pitchClass(pitch)]}${midiOctave(pitch)}`;
}

export function midiToVexKey(pitch: number): {
  key: string;
  accidental: string | null;
} {
  const pc = pitchClass(pitch);
  return {
    key: `${VEX_KEYS[pc]}/${midiOctave(pitch)}`,
    accidental: VEX_ACCIDENTALS[pc],
  };
}

export function isBlackKey(pitch: number): boolean {
  return VEX_ACCIDENTALS[pitchClass(pitch)] !== null;
}

/**
 * Rango MIDI recomendado por clave para generar ejercicios.
 * treble (clave de sol): C4–C6; bass (clave de fa): C2–C4.
 */
export function pitchesForClefRange(clef: Clef): { min: number; max: number } {
  return clef === 'bass' ? { min: 36, max: 60 } : { min: 60, max: 84 };
}

/**
 * Mapeo grado→dedo para la mano derecha (clef treble), indexado por
 * clase de altura (0 = C … 11 = B). 1 = pulgar … 5 = meñique.
 * Imita una posición de 5 dedos con paso de pulgar en F:
 * C=1, D=2, E=3, F=1, G=2, A=3, B=4. Las alteraciones heredan el dedo
 * de la tecla blanca inmediatamente inferior.
 */
const RIGHT_HAND_FINGERS = [1, 1, 2, 2, 3, 1, 1, 2, 2, 3, 4, 4] as const;

/**
 * Mapeo grado→dedo para la mano izquierda (clef bass), espejo del anterior:
 * las notas graves usan el meñique (5) y las agudas del rango el pulgar/índice.
 * C=5, D=4, E=3, F=5, G=4, A=3, B=2.
 */
const LEFT_HAND_FINGERS = [5, 5, 4, 4, 3, 5, 5, 4, 4, 3, 2, 2] as const;

/**
 * Sugerencia APROXIMADA de digitación (1 = pulgar … 5 = meñique).
 * Devuelve un mapa pitch → número de dedo. No es una digitación óptima,
 * solo una pista plausible para el modo práctica.
 *
 * - Para 1 nota: se usa una tabla grado→dedo según la mano (treble = mano
 *   derecha, bass = mano izquierda), de modo que notas distintas producen
 *   dedos distintos y plausibles (nunca todas 1).
 * - Para acordes (2–4 notas): se aplica un patrón por conteo de grave a
 *   agudo (2 → [1,5]; 3 → [1,3,5]; 4 → [1,2,3,5]) en mano derecha; en mano
 *   izquierda se invierte el sentido (pulgar en la nota más aguda).
 */
export function suggestFingerings(
  pitches: number[],
  clef: Clef = 'treble',
): Record<number, number> {
  const sorted = [...pitches].sort((a, b) => a - b);
  if (sorted.length === 0) {
    return {};
  }

  const leftHand = clef === 'bass';
  const result: Record<number, number> = {};

  if (sorted.length === 1) {
    const pitch = sorted[0];
    const table = leftHand ? LEFT_HAND_FINGERS : RIGHT_HAND_FINGERS;
    result[pitch] = table[pitchClass(pitch)];
    return result;
  }

  const count = Math.min(sorted.length, 4);
  const patterns: Record<number, number[]> = {
    2: [1, 5],
    3: [1, 3, 5],
    4: [1, 2, 3, 5],
  };
  const basePattern = patterns[count] ?? [1, 2, 3, 5];
  // Mano izquierda: pulgar en la nota más aguda → recorrer el patrón invertido.
  const fingers = leftHand ? [...basePattern].reverse() : basePattern;

  sorted.forEach((pitch, index) => {
    result[pitch] = fingers[Math.min(index, fingers.length - 1)];
  });
  return result;
}
