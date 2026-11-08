import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { matchPitch, matchPitchSet } from '../../../core/evaluation/NoteMatcher';
import type { NormalizedMidiNote } from '../../../core/midi/types';
import {
  createExercise,
  DEFAULT_CHORD_QUALITIES,
  DEFAULT_NOTES_PER_EXERCISE,
  DEFAULT_SESSION_LENGTH,
  getDifficulty,
  MAX_NOTES,
  MIN_NOTES,
} from '../services/exerciseGenerator';
import type {
  ChordQuality,
  ClefMode,
  DifficultyId,
  ExerciseKind,
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
  const [exerciseKind, setExerciseKind] = useState<ExerciseKind>('notes');
  const [chordQualities, setChordQualities] = useState<ChordQuality[]>(
    DEFAULT_CHORD_QUALITIES,
  );
  const [phase, setPhase] = useState<SessionPhase>('idle');
  const [exercise, setExercise] = useState<FlashcardExercise | null>(null);
  const [results, setResults] = useState<ExerciseResult[]>([]);
  const [lastResult, setLastResult] = useState<ExerciseResult | null>(null);
  // Índice de progreso de la secuencia (nota esperada actual). Se expone a la
  // UI/teclado para redibujar el resaltado de la nota en curso.
  const [seqIndex, setSeqIndex] = useState(0);

  const startedAtRef = useRef(0);
  const timeoutRef = useRef(0);
  const phaseRef = useRef<SessionPhase>('idle');
  const exerciseRef = useRef<FlashcardExercise | null>(null);
  const resultsRef = useRef<ExerciseResult[]>([]);
  const answeredRef = useRef(false);
  const pressedSetRef = useRef<Set<number>>(new Set());
  // Ruta de secuencia: posición actual, marca de fallo y teclas sostenidas.
  const seqIndexRef = useRef(0);
  const seqHadErrorRef = useRef(false);
  const heldSetRef = useRef<Set<number>>(new Set());

  // Reinicia el estado de progreso compartido por ambas rutas (simultánea y
  // secuencia) al arrancar un ejercicio nuevo.
  const resetProgress = () => {
    answeredRef.current = false;
    pressedSetRef.current = new Set();
    seqIndexRef.current = 0;
    seqHadErrorRef.current = false;
    heldSetRef.current = new Set();
    setSeqIndex(0);
  };

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
    const next = createExercise(difficulty, {
      clefMode,
      notesPerExercise,
      exerciseKind,
      chordQualities,
    });
    resetProgress();
    setResults([]);
    resultsRef.current = [];
    setLastResult(null);
    setExercise(next);
    setPhase('waiting');
    startedAtRef.current = performance.now();
  }, [difficulty, clefMode, notesPerExercise, exerciseKind, chordQualities]);

  const resetSession = useCallback(() => {
    clearAdvanceTimer();
    resetProgress();
    setResults([]);
    resultsRef.current = [];
    setLastResult(null);
    setExercise(null);
    setPhase('idle');
  }, []);

  // Registra el resultado del ejercicio recién terminado, pasa a `feedback` y
  // programa el avance al siguiente ejercicio / resumen. Compartido por la ruta
  // simultánea (acordes) y la de secuencia (notas).
  const commitResult = useCallback(
    (previous: FlashcardExercise, result: ExerciseResult) => {
      answeredRef.current = true;

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

        const nextExercise = createExercise(difficulty, {
          clefMode,
          notesPerExercise,
          exerciseKind,
          chordQualities,
          avoidPitches: previous.expectedPitches,
        });
        resetProgress();
        setLastResult(null);
        setExercise(nextExercise);
        setPhase('waiting');
        startedAtRef.current = performance.now();
      }, FEEDBACK_MS);
    },
    [difficulty, sessionLength, clefMode, notesPerExercise, exerciseKind, chordQualities],
  );

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

      if (current.playback === 'sequence') {
        // Ruta de secuencia (modo Notas): evaluación en orden, nota a nota.
        // Cada note-on es un intento contra la nota esperada actual. Una tecla
        // mantenida no dispara intentos repetidos; hay que soltarla y volver a
        // pulsarla (necesario para secuencias con notas repetidas, p. ej.
        // Do, Do, Re).
        if (event.type === 'note-off') {
          heldSetRef.current.delete(event.pitch);
          return;
        }

        if (event.type !== 'note-on') {
          return;
        }

        if (heldSetRef.current.has(event.pitch)) {
          return;
        }
        heldSetRef.current.add(event.pitch);

        const expectedPitch = current.expectedPitches[seqIndexRef.current];
        if (matchPitch(expectedPitch, event.pitch) === 'incorrect') {
          // Fallo: se marca el error y NO se avanza (se repite la misma nota).
          seqHadErrorRef.current = true;
          return;
        }

        // Acierto: avanzar a la siguiente nota de la secuencia.
        seqIndexRef.current += 1;
        setSeqIndex(seqIndexRef.current);

        if (seqIndexRef.current < current.expectedPitches.length) {
          return;
        }

        // Última nota acertada: el ejercicio se completa. Solo es 'correct' si
        // no hubo ningún fallo durante toda la secuencia.
        const result: ExerciseResult = {
          exercise: current,
          // Solo se avanza con aciertos, así que las notas tocadas en orden
          // coinciden con la secuencia esperada.
          playedPitches: [...current.expectedPitches],
          result: seqHadErrorRef.current ? 'incorrect' : 'correct',
          responseMs: performance.now() - startedAtRef.current,
          hadError: seqHadErrorRef.current,
        };
        commitResult(current, result);
        return;
      }

      // Ruta simultánea (acordes): se acumulan note-on hasta completar el
      // conjunto y se evalúa con matchPitchSet.
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
      const matchResult = matchPitchSet(current.expectedPitches, playedPitches);

      const result: ExerciseResult = {
        exercise: current,
        playedPitches,
        result: matchResult,
        responseMs: performance.now() - startedAtRef.current,
        hadError: matchResult === 'incorrect',
      };
      commitResult(current, result);
    },
    [commitResult],
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
    exerciseKind,
    setExerciseKind,
    chordQualities,
    setChordQualities,
    phase,
    exercise,
    seqIndex,
    lastResult,
    results,
    summary,
    startSession,
    resetSession,
    handleMidiEvent,
  };
}
