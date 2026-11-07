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
