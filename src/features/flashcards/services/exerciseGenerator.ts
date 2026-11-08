import { pitchesForClefRange } from '../../../core/music/pitch';
import { buildChord, CHORD_INTERVALS } from '../../../core/music/chords';
import type { Clef } from '../../../core/music/types';
import type {
  ChordQuality,
  ClefMode,
  DifficultyId,
  DifficultyOption,
  ExerciseKind,
  FlashcardExercise,
  NoteRange,
} from '../types';

export const DIFFICULTIES: DifficultyOption[] = [
  {
    id: 'beginner',
    label: 'Zona central (fácil)',
    description: 'Rango estrecho alrededor del centro (Do4–Sol4)',
    range: { min: 60, max: 67 },
    clef: 'treble',
  },
  {
    id: 'intermediate',
    label: 'Una octava',
    description: 'Una octava desde Do4 (Do4–Do5)',
    range: { min: 60, max: 72 },
    clef: 'treble',
  },
  {
    id: 'wide',
    label: 'Rango amplio',
    description: 'Más de dos octavas con líneas adicionales (Sol3–La5)',
    range: { min: 55, max: 81 },
    clef: 'treble',
  },
];

export const DEFAULT_SESSION_LENGTH = 10;

const FALLBACK_DIFFICULTY: DifficultyOption = {
  id: 'beginner',
  label: 'Zona central (fácil)',
  description: 'Rango estrecho alrededor del centro (Do4–Sol4)',
  range: { min: 60, max: 67 },
  clef: 'treble',
};

export const DEFAULT_NOTES_PER_EXERCISE = 1;
export const MIN_NOTES = 1;
export const MAX_NOTES = 4;

/** Calidades activas por defecto en el modo de acordes. */
export const DEFAULT_CHORD_QUALITIES: ChordQuality[] = ['major', 'minor'];

export function getDifficulty(id: DifficultyId): DifficultyOption {
  return DIFFICULTIES.find((item) => item.id === id) ?? FALLBACK_DIFFICULTY;
}

interface CreateExerciseOptions {
  clefMode: ClefMode;
  notesPerExercise: number;
  avoidPitches?: number[];
  exerciseKind?: ExerciseKind;
  chordQualities?: ChordQuality[];
}

function resolveClef(clefMode: ClefMode): Clef {
  if (clefMode === 'both') {
    return Math.random() < 0.5 ? 'treble' : 'bass';
  }
  return clefMode;
}

function resolveRange(
  clefMode: ClefMode,
  clef: Clef,
  difficulty: DifficultyOption,
): NoteRange {
  if (clefMode === 'treble') {
    return difficulty.range;
  }
  return pitchesForClefRange(clef);
}

/**
 * Elige una SECUENCIA de `count` alturas dentro del rango (orden = orden de
 * interpretación de la melodía). Se permite repetir notas, pero se evita que
 * TODAS sean iguales cuando hay más de una nota y el rango tiene variedad.
 */
function pickSequencePitches(range: NoteRange, count: number): number[] {
  const span = range.max - range.min + 1;
  const randomPitch = () => range.min + Math.floor(Math.random() * span);

  const pitches = Array.from({ length: count }, randomPitch);

  // Evitar una secuencia de notas todas iguales cuando hay más de una nota.
  if (count > 1 && span > 1 && pitches.every((pitch) => pitch === pitches[0])) {
    let replacement = randomPitch();
    while (replacement === pitches[0]) {
      replacement = randomPitch();
    }
    pitches[pitches.length - 1] = replacement;
  }

  return pitches;
}

function sameSet(a: number[], b: number[]): boolean {
  if (a.length !== b.length) {
    return false;
  }
  const setB = new Set(b);
  return a.every((pitch) => setB.has(pitch));
}

/** Igualdad en ORDEN (para no repetir la secuencia exacta anterior). */
function sameSequence(a: number[], b: number[]): boolean {
  return a.length === b.length && a.every((pitch, index) => pitch === b[index]);
}

function createChordExercise(
  difficulty: DifficultyOption,
  options: CreateExerciseOptions,
): FlashcardExercise {
  const clef = resolveClef(options.clefMode);
  const range = resolveRange(options.clefMode, clef, difficulty);

  const available =
    options.chordQualities && options.chordQualities.length > 0
      ? options.chordQualities
      : DEFAULT_CHORD_QUALITIES;

  const pickRoot = (quality: ChordQuality): number => {
    const width = Math.max(...CHORD_INTERVALS[quality]);
    const rootMax = Math.max(range.min, range.max - width);
    return range.min + Math.floor(Math.random() * (rootMax - range.min + 1));
  };

  const pickChord = () => {
    const quality = available[Math.floor(Math.random() * available.length)];
    const root = pickRoot(quality);
    return buildChord(root, quality);
  };

  let chord = pickChord();

  // Evitar repetir exactamente el acorde anterior cuando se pueda (reintento único).
  if (options.avoidPitches && sameSet(chord.pitches, options.avoidPitches)) {
    chord = pickChord();
  }

  return {
    id: crypto.randomUUID(),
    expectedPitches: chord.pitches,
    clef,
    label: chord.label,
    playback: 'simultaneous',
  };
}

export function createExercise(
  difficulty: DifficultyOption,
  options: CreateExerciseOptions,
): FlashcardExercise {
  if (options.exerciseKind === 'chords') {
    return createChordExercise(difficulty, options);
  }

  const clef = resolveClef(options.clefMode);
  const range = resolveRange(options.clefMode, clef, difficulty);
  const count = Math.min(Math.max(options.notesPerExercise, MIN_NOTES), MAX_NOTES);

  let pitches = pickSequencePitches(range, count);

  // Evitar repetir exactamente la secuencia anterior (en orden) cuando se pueda.
  if (
    options.avoidPitches &&
    sameSequence(pitches, options.avoidPitches) &&
    range.max - range.min + 1 > 1
  ) {
    pitches = pickSequencePitches(range, count);
  }

  return {
    id: crypto.randomUUID(),
    expectedPitches: pitches,
    clef,
    playback: 'sequence',
  };
}
