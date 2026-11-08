import { midiToNoteName, midiToSolfege } from '../../../core/music/pitch';
import { chordQualities as chordQualityOptions } from '../../../core/music/chords';
import {
  DEFAULT_SESSION_LENGTH,
  DIFFICULTIES,
  getDifficulty,
  MAX_NOTES,
  MIN_NOTES,
} from '../services/exerciseGenerator';
import { Select } from '../../../components/Select/Select';
import type { ChordQuality, ClefMode, DifficultyId, ExerciseKind } from '../types';
import type { useFlashcardSession } from '../hooks/useFlashcardSession';
import { useStaffZoom } from '../hooks/useStaffZoom';
import { SessionSummary } from './SessionSummary';
import { StaffNote } from './StaffNote';
import styles from './FlashcardView.module.css';

type Session = ReturnType<typeof useFlashcardSession>;

interface FlashcardViewProps {
  session: Session;
}

function formatPitches(pitches: number[], separator = ' · '): string {
  return pitches
    .map((pitch) => `${midiToNoteName(pitch)} / ${midiToSolfege(pitch)}`)
    .join(separator);
}

/** Texto de un ejercicio para el feedback: nombre del acorde o la secuencia. */
function describeExercise(exercise: {
  label?: string;
  expectedPitches: number[];
}): string {
  if (exercise.label) {
    return exercise.label;
  }
  // Secuencia (o nota única): notas EN ORDEN unidas por flechas.
  return formatPitches(
    exercise.expectedPitches,
    exercise.expectedPitches.length > 1 ? ' → ' : ' · ',
  );
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
  } = session;

  const busy = phase === 'waiting' || phase === 'feedback';
  const { zoom, zoomIn, zoomOut, canZoomIn, canZoomOut } = useStaffZoom();
  const selectedDifficulty = getDifficulty(difficultyId);
  const isChords = exerciseKind === 'chords';

  const toggleChordQuality = (id: ChordQuality) => {
    setChordQualities(
      chordQualities.includes(id)
        ? chordQualities.filter((quality) => quality !== id)
        : [...chordQualities, id],
    );
  };

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <label className={styles.label}>
          Dificultad
          <Select<DifficultyId>
            value={difficultyId}
            disabled={busy}
            onChange={setDifficultyId}
            options={DIFFICULTIES.map((item) => ({
              value: item.id,
              label: item.label,
            }))}
          />
          <span className={styles.help}>{selectedDifficulty.description}</span>
          <span className={styles.help}>
            El rango aplica en clave de sol; en clave de fa el rango lo decide la
            clave.
          </span>
        </label>
        <label className={styles.label}>
          Modo de ejercicio
          <Select<ExerciseKind>
            value={exerciseKind}
            disabled={busy}
            onChange={setExerciseKind}
            options={[
              { value: 'notes', label: 'Notas' },
              { value: 'chords', label: 'Acordes' },
            ]}
          />
        </label>
        <label className={styles.label}>
          Clave
          <Select<ClefMode>
            value={clefMode}
            disabled={busy}
            onChange={setClefMode}
            options={[
              { value: 'treble', label: 'Clave de sol' },
              { value: 'bass', label: 'Clave de fa' },
              { value: 'both', label: 'Ambas' },
            ]}
          />
        </label>
        {isChords ? (
          <div className={styles.label}>
            Calidades de acorde
            <div className={styles.qualityList}>
              {chordQualityOptions().map((option) => (
                <label key={option.id} className={styles.quality}>
                  <input
                    type="checkbox"
                    disabled={busy}
                    checked={chordQualities.includes(option.id)}
                    onChange={() => toggleChordQuality(option.id)}
                  />
                  {option.label}
                </label>
              ))}
            </div>
            <span className={styles.help}>
              Si no seleccionas ninguna se usan mayor y menor.
            </span>
          </div>
        ) : (
          <label className={styles.label}>
            Notas en la secuencia: {notesPerExercise}
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
            <span className={styles.help}>
              Con más de una nota se tocan en orden, una tras otra (melodía).
            </span>
          </label>
        )}
        <label
          className={styles.switch}
          title="Resalta las teclas y la digitación sugerida"
        >
          <input
            className={styles.switchInput}
            type="checkbox"
            aria-label="Modo práctica: resalta las teclas y la digitación sugerida"
            checked={practiceMode}
            onChange={(event) => setPracticeMode(event.target.checked)}
          />
          <span className={styles.switchTrack}>
            <span className={styles.switchThumb} />
          </span>
          <span className={styles.switchText}>Modo práctica</span>
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
                <div className={styles.staffWrap}>
                  {exercise.label ? (
                    <p className={styles.chordLabel}>{exercise.label}</p>
                  ) : null}
                  <StaffNote
                    pitches={exercise.expectedPitches}
                    clef={exercise.clef}
                    zoom={zoom}
                    playback={exercise.playback}
                    currentIndex={seqIndex}
                  />
                </div>
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
                  {describeExercise(lastResult.exercise)}
                  {lastResult.result === 'incorrect'
                    ? ` · tocaste ${lastResult.playedPitches
                        .map((pitch) => midiToNoteName(pitch))
                        .join(' · ')}`
                    : ''}
                </span>
              ) : phase === 'waiting' ? (
                exercise &&
                exercise.playback === 'sequence' &&
                exercise.expectedPitches.length > 1 ? (
                  `Nota ${seqIndex + 1} de ${exercise.expectedPitches.length}`
                ) : (
                  'Toca la nota'
                )
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
