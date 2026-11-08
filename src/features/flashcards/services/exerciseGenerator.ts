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

function pickDistinctPitches(range: NoteRange, count: number): number[] {
  const span = range.max - range.min + 1;
  const target = Math.min(count, span);
  const pool = new Set<number>();

  while (pool.size < target) {
    pool.add(range.min + Math.floor(Math.random() * span));
  }

  return [...pool].sort((a, b) => a - b);
}

function sameSet(a: number[], b: number[]): boolean {
  if (a.length !== b.length) {
    return false;
  }
  const setB = new Set(b);
  return a.every((pitch) => setB.has(pitch));
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

  let pitches = pickDistinctPitches(range, count);

  // Evitar repetir exactamente el conjunto anterior cuando se pueda.
  if (
    options.avoidPitches &&
    sameSet(pitches, options.avoidPitches) &&
    range.max - range.min + 1 > count
  ) {
    pitches = pickDistinctPitches(range, count);
  }

  return {
    id: crypto.randomUUID(),
    expectedPitches: pitches,
    clef,
  };
}
