import { midiToNoteName, midiToSolfege } from '../../../core/music/pitch';
import {
  DEFAULT_SESSION_LENGTH,
  DIFFICULTIES,
  getDifficulty,
  MAX_NOTES,
  MIN_NOTES,
} from '../services/exerciseGenerator';
import type { ClefMode } from '../types';
import type { useFlashcardSession } from '../hooks/useFlashcardSession';
import { useStaffZoom } from '../hooks/useStaffZoom';
import { SessionSummary } from './SessionSummary';
import { StaffNote } from './StaffNote';
import styles from './FlashcardView.module.css';

type Session = ReturnType<typeof useFlashcardSession>;

interface FlashcardViewProps {
  session: Session;
}

function formatPitches(pitches: number[]): string {
  return pitches
    .map((pitch) => `${midiToNoteName(pitch)} / ${midiToSolfege(pitch)}`)
    .join(' · ');
}

export function FlashcardView({ session }: FlashcardViewProps) {
  const {
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
  } = session;

  const busy = phase === 'waiting' || phase === 'feedback';
  const { zoom, zoomIn, zoomOut, canZoomIn, canZoomOut } = useStaffZoom();
  const selectedDifficulty = getDifficulty(difficultyId);

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <label className={styles.label}>
          Dificultad
          <select
            value={difficultyId}
            disabled={busy}
            onChange={(event) =>
              setDifficultyId(event.target.value as typeof difficultyId)
            }
          >
            {DIFFICULTIES.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
          <span className={styles.help}>{selectedDifficulty.description}</span>
          <span className={styles.help}>
            El rango aplica en clave de sol; en clave de fa el rango lo decide la
            clave.
          </span>
        </label>
        <label className={styles.label}>
          Clave
          <select
            value={clefMode}
            disabled={busy}
            onChange={(event) =>
              setClefMode(event.target.value as ClefMode)
            }
          >
            <option value="treble">Clave de sol</option>
            <option value="bass">Clave de fa</option>
            <option value="both">Ambas</option>
          </select>
        </label>
        <label className={styles.label}>
          Notas por ejercicio: {notesPerExercise}
          <input
            type="range"
            min={MIN_NOTES}
            max={MAX_NOTES}
            step={1}
            disabled={busy}
            value={notesPerExercise}
            onChange={(event) =>
              setNotesPerExercise(Number(event.target.value))
            }
          />
        </label>
        <label className={styles.toggle}>
          <input
            type="checkbox"
            checked={practiceMode}
            onChange={(event) => setPracticeMode(event.target.checked)}
          />
          Modo práctica (resalta teclas y digitación sugerida)
        </label>
        <label className={styles.label}>
          Ejercicios por sesión
          <input
            type="number"
            min={5}
            max={30}
            disabled={busy}
            value={sessionLength}
            onChange={(event) =>
              setSessionLength(
                Math.min(30, Math.max(5, Number(event.target.value) || DEFAULT_SESSION_LENGTH)),
              )
            }
          />
        </label>
        <p className={styles.progress}>
          {phase === 'idle'
            ? 'Sesión lista'
            : phase === 'summary'
              ? 'Sesión terminada'
              : `Ejercicio ${results.length + (phase === 'feedback' ? 0 : 1)} / ${sessionLength}`}
        </p>
        <div className={styles.actions}>
          {phase === 'idle' || phase === 'summary' ? (
            <button className={styles.primary} type="button" onClick={startSession}>
              {phase === 'summary' ? 'Nueva sesión' : 'Empezar'}
            </button>
          ) : (
            <button className={styles.ghost} type="button" onClick={resetSession}>
              Cancelar
            </button>
          )}
        </div>
      </aside>

      <section className={styles.stage}>
        {phase === 'summary' && summary ? (
          <SessionSummary summary={summary} />
        ) : (
          <>
            <div className={styles.paper}>
              <div className={styles.zoomControls}>
                <button
                  type="button"
                  className={styles.zoomButton}
                  aria-label="Reducir partitura"
                  disabled={!canZoomOut}
                  onClick={zoomOut}
                >
                  −
                </button>
                <button
                  type="button"
                  className={styles.zoomButton}
                  aria-label="Aumentar partitura"
                  disabled={!canZoomIn}
                  onClick={zoomIn}
                >
                  +
                </button>
              </div>
              {exercise ? (
                <StaffNote
                  pitches={exercise.expectedPitches}
                  clef={exercise.clef}
                  zoom={zoom}
                />
              ) : (
                <p className={styles.hint}>
                  Pulsa Empezar para ver una o varias notas en el pentagrama.
                  Tócalas en el teclado MIDI o usa A–K en el ordenador.
                </p>
              )}
            </div>
            <p className={styles.feedback}>
              {lastResult ? (
                <span
                  className={
                    lastResult.result === 'correct'
                      ? styles.correct
                      : styles.incorrect
                  }
                >
                  {lastResult.result === 'correct' ? 'Correcto' : 'Incorrecto'} ·{' '}
                  {formatPitches(lastResult.exercise.expectedPitches)}
                  {lastResult.result === 'incorrect'
                    ? ` · tocaste ${lastResult.playedPitches
                        .map((pitch) => midiToNoteName(pitch))
                        .join(' · ')}`
                    : ''}
                </span>
              ) : phase === 'waiting' ? (
                'Toca la nota'
              ) : (
                ' '
              )}
            </p>
          </>
        )}
      </section>
    </div>
  );
}
