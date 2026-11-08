import type { Clef } from '../../core/music/types';
import type { MatchResult } from '../../core/evaluation/NoteMatcher';
import type { ChordQuality } from '../../core/music/chords';

/**
 * Tipo de ejercicio de flashcards. `'notes'` mantiene el comportamiento actual
 * (notas sueltas o varias simultáneas). `'chords'` genera acordes con nombre.
 */
export type ExerciseKind = 'notes' | 'chords';

export type { ChordQuality };

export type DifficultyId = 'beginner' | 'intermediate' | 'wide';

export interface NoteRange {
  min: number;
  max: number;
}

export interface DifficultyOption {
  id: DifficultyId;
  label: string;
  description: string;
  range: NoteRange;
  clef: Clef;
}

/**
 * Selección de clave de la sesión. Es un ajuste aparte de `DifficultyOption`
 * porque la clave es ortogonal a la dificultad y tiene rangos propios.
 */
export type ClefMode = 'treble' | 'bass' | 'both';

export interface FlashcardExercise {
  id: string;
  expectedPitches: number[];
  clef: Clef;
  /** Nombre del acorde en modo `'chords'`; `undefined` en modo `'notes'`. */
  label?: string;
}

export interface ExerciseResult {
  exercise: FlashcardExercise;
  playedPitches: number[];
  result: MatchResult;
  responseMs: number;
}

export interface SessionSummary {
  total: number;
  correct: number;
  accuracy: number;
  averageResponseMs: number;
  results: ExerciseResult[];
}
