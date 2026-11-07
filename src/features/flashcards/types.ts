import type { Clef } from '../../core/music/types';
import type { MatchResult } from '../../core/evaluation/NoteMatcher';

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

export interface FlashcardExercise {
  id: string;
  expectedPitch: number;
  clef: Clef;
}

export interface ExerciseResult {
  exercise: FlashcardExercise;
  playedPitch: number;
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
