import { midiToNoteName, midiToSolfege } from '../../../core/music/pitch';
import {
  DEFAULT_SESSION_LENGTH,
  DIFFICULTIES,
} from '../services/exerciseGenerator';
import type { useFlashcardSession } from '../hooks/useFlashcardSession';
import { SessionSummary } from './SessionSummary';
import { StaffNote } from './StaffNote';
import styles from './FlashcardView.module.css';

type Session = ReturnType<typeof useFlashcardSession>;

interface FlashcardViewProps {
  session: Session;
}

export function FlashcardView({ session }: FlashcardViewProps) {
  const {
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
  } = session;

  const busy = phase === 'waiting' || phase === 'feedback';

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
              {exercise ? (
                <StaffNote pitch={exercise.expectedPitch} clef={exercise.clef} />
              ) : (
                <p className={styles.hint}>
                  Pulsa Empezar para ver una nota en clave de sol. Tócala en el
                  teclado MIDI o usa A–K en el ordenador.
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
                  {midiToNoteName(lastResult.exercise.expectedPitch)} /{' '}
                  {midiToSolfege(lastResult.exercise.expectedPitch)}
                  {lastResult.result === 'incorrect'
                    ? ` · tocaste ${midiToNoteName(lastResult.playedPitch)}`
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
