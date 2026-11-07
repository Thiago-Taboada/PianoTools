import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { matchPitch } from '../../../core/evaluation/NoteMatcher';
import type { NormalizedMidiNote } from '../../../core/midi/types';
import {
  createExercise,
  DEFAULT_SESSION_LENGTH,
  getDifficulty,
} from '../services/exerciseGenerator';
import type {
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

  const clearAdvanceTimer = () => {
    window.clearTimeout(timeoutRef.current);
  };

  phaseRef.current = phase;
  exerciseRef.current = exercise;
  resultsRef.current = results;

  useEffect(() => () => clearAdvanceTimer(), []);

  const difficulty = useMemo(() => getDifficulty(difficultyId), [difficultyId]);

  const startSession = useCallback(() => {
    clearAdvanceTimer();
    const next = createExercise(difficulty);
    answeredRef.current = false;
    setResults([]);
    resultsRef.current = [];
    setLastResult(null);
    setExercise(next);
    setPhase('waiting');
    startedAtRef.current = performance.now();
  }, [difficulty]);

  const resetSession = useCallback(() => {
    clearAdvanceTimer();
    answeredRef.current = false;
    setResults([]);
    resultsRef.current = [];
    setLastResult(null);
    setExercise(null);
    setPhase('idle');
  }, []);

  const handleMidiEvent = useCallback(
    (event: NormalizedMidiNote | null) => {
      if (!event || event.type !== 'note-on') {
        return;
      }

      if (phaseRef.current !== 'waiting' || answeredRef.current) {
        return;
      }

      const current = exerciseRef.current;
      if (!current) {
        return;
      }

      answeredRef.current = true;
      const result: ExerciseResult = {
        exercise: current,
        playedPitch: event.pitch,
        result: matchPitch(current.expectedPitch, event.pitch),
        responseMs: performance.now() - startedAtRef.current,
      };

      const nextResults = [...resultsRef.current, result];
      resultsRef.current = nextResults;
      setResults(nextResults);
      setLastResult(result);
      setPhase('feedback');

      timeoutRef.current = window.setTimeout(() => {
        if (nextResults.length >= sessionLength) {
          setPhase('summary');
          setExercise(null);
          return;
        }

        const nextExercise = createExercise(
          difficulty,
          current.expectedPitch,
        );
        answeredRef.current = false;
        setLastResult(null);
        setExercise(nextExercise);
        setPhase('waiting');
        startedAtRef.current = performance.now();
      }, FEEDBACK_MS);
    },
    [difficulty, sessionLength],
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
