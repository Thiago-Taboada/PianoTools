import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { matchPitchSet } from '../../../core/evaluation/NoteMatcher';
import type { NormalizedMidiNote } from '../../../core/midi/types';
import {
  createExercise,
  DEFAULT_NOTES_PER_EXERCISE,
  DEFAULT_SESSION_LENGTH,
  getDifficulty,
  MAX_NOTES,
  MIN_NOTES,
} from '../services/exerciseGenerator';
import type {
  ClefMode,
  DifficultyId,
  ExerciseResult,
  FlashcardExercise,
  SessionSummary,
} from '../types';

export type SessionPhase = 'idle' | 'waiting' | 'feedback' | 'summary';

const FEEDBACK_MS = 900;

export function useFlashcardSession() {
  const [difficultyId, setDifficultyId] = useState<DifficultyId>('beginner');
  const [sessionLength, setSessionLength] = useState(DEFAULT_SESSION_LENGTH);
  const [clefMode, setClefMode] = useState<ClefMode>('treble');
  const [notesPerExercise, setNotesPerExerciseState] = useState(
    DEFAULT_NOTES_PER_EXERCISE,
  );
  const [practiceMode, setPracticeMode] = useState(false);
  const [phase, setPhase] = useState<SessionPhase>('idle');
  const [exercise, setExercise] = useState<FlashcardExercise | null>(null);
  const [results, setResults] = useState<ExerciseResult[]>([]);
  const [lastResult, setLastResult] = useState<ExerciseResult | null>(null);

  const startedAtRef = useRef(0);
  const timeoutRef = useRef(0);
  const phaseRef = useRef<SessionPhase>('idle');
  const exerciseRef = useRef<FlashcardExercise | null>(null);
  const resultsRef = useRef<ExerciseResult[]>([]);
  const answeredRef = useRef(false);
  const pressedSetRef = useRef<Set<number>>(new Set());

  const clearAdvanceTimer = () => {
    window.clearTimeout(timeoutRef.current);
  };

  phaseRef.current = phase;
  exerciseRef.current = exercise;
  resultsRef.current = results;

  useEffect(() => () => clearAdvanceTimer(), []);

  const difficulty = useMemo(() => getDifficulty(difficultyId), [difficultyId]);

  const setNotesPerExercise = useCallback((value: number) => {
    setNotesPerExerciseState(
      Math.min(MAX_NOTES, Math.max(MIN_NOTES, Math.round(value) || MIN_NOTES)),
    );
  }, []);

  const startSession = useCallback(() => {
    clearAdvanceTimer();
    const next = createExercise(difficulty, { clefMode, notesPerExercise });
    answeredRef.current = false;
    pressedSetRef.current = new Set();
    setResults([]);
    resultsRef.current = [];
    setLastResult(null);
    setExercise(next);
    setPhase('waiting');
    startedAtRef.current = performance.now();
  }, [difficulty, clefMode, notesPerExercise]);

  const resetSession = useCallback(() => {
    clearAdvanceTimer();
    answeredRef.current = false;
    pressedSetRef.current = new Set();
    setResults([]);
    resultsRef.current = [];
    setLastResult(null);
    setExercise(null);
    setPhase('idle');
  }, []);

  const handleMidiEvent = useCallback(
    (event: NormalizedMidiNote | null) => {
      if (!event) {
        return;
      }

      if (phaseRef.current !== 'waiting' || answeredRef.current) {
        return;
      }

      const current = exerciseRef.current;
      if (!current) {
        return;
      }

      // Liberar una nota antes de completar el conjunto permite corregir.
      if (event.type === 'note-off') {
        pressedSetRef.current.delete(event.pitch);
        return;
      }

      if (event.type !== 'note-on') {
        return;
      }

      // Una nota mantenida (ya presente) no cuenta como varias respuestas.
      if (pressedSetRef.current.has(event.pitch)) {
        return;
      }
      pressedSetRef.current.add(event.pitch);

      if (pressedSetRef.current.size < current.expectedPitches.length) {
        return;
      }

      const playedPitches = [...pressedSetRef.current].sort((a, b) => a - b);
      answeredRef.current = true;

      const result: ExerciseResult = {
        exercise: current,
        playedPitches,
        result: matchPitchSet(current.expectedPitches, playedPitches),
        responseMs: performance.now() - startedAtRef.current,
      };

      const nextResults = [...resultsRef.current, result];
      resultsRef.current = nextResults;
      setResults(nextResults);
      setLastResult(result);
      setPhase('feedback');

      timeoutRef.current = window.setTimeout(() => {
        pressedSetRef.current = new Set();

        if (nextResults.length >= sessionLength) {
          setPhase('summary');
          setExercise(null);
          return;
        }

        const nextExercise = createExercise(difficulty, {
          clefMode,
          notesPerExercise,
          avoidPitches: current.expectedPitches,
        });
        answeredRef.current = false;
        setLastResult(null);
        setExercise(nextExercise);
        setPhase('waiting');
        startedAtRef.current = performance.now();
      }, FEEDBACK_MS);
    },
    [difficulty, sessionLength, clefMode, notesPerExercise],
  );

  const summary: SessionSummary | null = useMemo(() => {
    if (phase !== 'summary' || results.length === 0) {
      return null;
    }

    const correct = results.filter((item) => item.result === 'correct').length;
    const averageResponseMs =
      results.reduce((sum, item) => sum + item.responseMs, 0) / results.length;

    return {
      total: results.length,
      correct,
      accuracy: Math.round((correct / results.length) * 100),
      averageResponseMs,
      results,
    };
  }, [phase, results]);

  return {
    difficulty,
    difficultyId,
    setDifficultyId,
    sessionLength,
    setSessionLength,
    clefMode,
    setClefMode,
    notesPerExercise,
    setNotesPerExercise,
    practiceMode,
    setPracticeMode,
    phase,
    exercise,
    lastResult,
    results,
    summary,
    startSession,
    resetSession,
    handleMidiEvent,
  };
}
