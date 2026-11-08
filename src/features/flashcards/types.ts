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
  /**
   * Modo de reproducción del ejercicio:
   * - `'sequence'`: las notas se tocan UNA TRAS OTRA en orden (melodía). Es el
   *   modo del `ExerciseKind` `'notes'` (con N==1 es una secuencia de una nota,
   *   indistinguible del comportamiento clásico de nota suelta).
   * - `'simultaneous'`: las notas se tocan a la vez (acorde apilado). Es el modo
   *   del `ExerciseKind` `'chords'`.
   */
  playback: 'sequence' | 'simultaneous';
  /** Nombre del acorde en modo `'chords'`; `undefined` en modo `'notes'`. */
  label?: string;
}

export interface ExerciseResult {
  exercise: FlashcardExercise;
  playedPitches: number[];
  result: MatchResult;
  responseMs: number;
  /**
   * `true` si hubo al menos un intento incorrecto durante el ejercicio. En
   * secuencia, un solo fallo deja el resultado final en `'incorrect'` aunque la
   * secuencia se complete. En simultáneos equivale a `result === 'incorrect'`.
   */
  hadError: boolean;
}

export interface SessionSummary {
  total: number;
  correct: number;
  accuracy: number;
  averageResponseMs: number;
  results: ExerciseResult[];
}
