import type { DifficultyId, DifficultyOption, FlashcardExercise } from '../types';

export const DIFFICULTIES: DifficultyOption[] = [
  {
    id: 'beginner',
    label: 'Nota individual · zona limitada',
    description: 'Do4 a Sol4 en clave de sol',
    range: { min: 60, max: 67 },
    clef: 'treble',
  },
  {
    id: 'intermediate',
    label: 'Clave de sol',
    description: 'Do4 a Do5',
    range: { min: 60, max: 72 },
    clef: 'treble',
  },
  {
    id: 'wide',
    label: 'Rango amplio',
    description: 'Sol3 a La5',
    range: { min: 55, max: 81 },
    clef: 'treble',
  },
];

export const DEFAULT_SESSION_LENGTH = 10;

const FALLBACK_DIFFICULTY: DifficultyOption = {
  id: 'beginner',
  label: 'Nota individual · zona limitada',
  description: 'Do4 a Sol4 en clave de sol',
  range: { min: 60, max: 67 },
  clef: 'treble',
};

export function getDifficulty(id: DifficultyId): DifficultyOption {
  return DIFFICULTIES.find((item) => item.id === id) ?? FALLBACK_DIFFICULTY;
}

export function createExercise(
  difficulty: DifficultyOption,
  avoidPitch?: number,
): FlashcardExercise {
  const span = difficulty.range.max - difficulty.range.min + 1;
  let pitch = difficulty.range.min + Math.floor(Math.random() * span);

  if (span > 1 && pitch === avoidPitch) {
    pitch = difficulty.range.min + ((pitch - difficulty.range.min + 1) % span);
  }

  return {
    id: crypto.randomUUID(),
    expectedPitch: pitch,
    clef: difficulty.clef,
  };
}
