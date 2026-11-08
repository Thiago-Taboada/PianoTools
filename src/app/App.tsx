import { useCallback, useEffect, useState } from 'react';
import type { NormalizedMidiNote } from '../core/midi/types';
import { suggestFingerings } from '../core/music/pitch';
import { IncomingNotes } from '../components/IncomingNotes/IncomingNotes';
import { MidiStatus } from '../components/MidiStatus/MidiStatus';
import { PianoKeyboard } from '../components/PianoKeyboard/PianoKeyboard';
import { FlashcardView } from '../features/flashcards/components/FlashcardView';
import { useFlashcardSession } from '../features/flashcards/hooks/useFlashcardSession';
import { FreeView } from '../features/free/components/FreeView';
import { useFreeModeNotes } from '../features/free/hooks/useFreeModeNotes';
import { useMidiInput } from '../hooks/useMidiInput';
import styles from './App.module.css';

type AppMode = 'flashcards' | 'free' | 'sheet' | 'piano-roll';

export default function App() {
  const [mode, setMode] = useState<AppMode>('flashcards');
  const session = useFlashcardSession();
  const freeNotes = useFreeModeNotes();

  // Dispatcher MIDI estable: delega cada evento a flashcards (que sigue
  // recibiendo y evaluando igual) y al modo libre. No filtra por modo, así su
  // identidad no depende de `mode` y no fuerza re-suscripciones. Se destructuran
  // los callbacks (ambos estables vía `useCallback`) para que las dependencias
  // sean identificadores simples.
  const handleFlashcardMidi = session.handleMidiEvent;
  const handleFreeMidi = freeNotes.handleMidiEvent;
  const handleMidi = useCallback(
    (event: NormalizedMidiNote | null) => {
      handleFlashcardMidi(event);
      handleFreeMidi(event);
    },
    [handleFlashcardMidi, handleFreeMidi],
  );

  const midi = useMidiInput(handleMidi);

  // Al salir del modo libre, limpiar las fichas y sus timers para no acumular
  // estado colgado al volver.
  const { clear: clearFreeNotes } = freeNotes;
  useEffect(() => {
    if (mode !== 'free') {
      clearFreeNotes();
    }
  }, [mode, clearFreeNotes]);

  const practiceActive =
    mode === 'flashcards' && session.practiceMode && session.exercise !== null;

  // En práctica con secuencia, el teclado resalta SOLO la nota actual (acotando
  // el índice por si se está en la fase de feedback). Para acordes/una nota se
  // resaltan todas las notas del ejercicio.
  const practiceTargets = (() => {
    if (!practiceActive) {
      return undefined;
    }
    const exercise = session.exercise!;
    if (exercise.playback === 'sequence' && exercise.expectedPitches.length > 1) {
      const index = Math.min(
        session.seqIndex,
        exercise.expectedPitches.length - 1,
      );
      return [exercise.expectedPitches[index]];
    }
    return exercise.expectedPitches;
  })();

  const targetPitches = practiceTargets;
  const fingerings =
    practiceActive && practiceTargets
      ? suggestFingerings(practiceTargets, session.exercise!.clef)
      : undefined;

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <strong>Piano Trainer</strong>
          <span>Lectura, MIDI y práctica local</span>
        </div>
        <nav className={styles.nav} aria-label="Modos">
          <button
            type="button"
            aria-current={mode === 'flashcards' ? 'page' : undefined}
            onClick={() => setMode('flashcards')}
          >
            Flashcards
          </button>
          <button
            type="button"
            aria-current={mode === 'free' ? 'page' : undefined}
            onClick={() => setMode('free')}
          >
            Modo libre
          </button>
          <button
            type="button"
            aria-current={mode === 'sheet' ? 'page' : undefined}
            onClick={() => setMode('sheet')}
          >
            Partitura
          </button>
          <button
            type="button"
            aria-current={mode === 'piano-roll' ? 'page' : undefined}
            onClick={() => setMode('piano-roll')}
          >
            Piano Roll
          </button>
        </nav>
        <MidiStatus
          status={midi.status}
          devices={midi.devices}
          selectedDeviceId={midi.selectedDeviceId}
          errorMessage={midi.errorMessage}
          onSelectDevice={midi.selectDevice}
        />
      </header>

      <main className={styles.main}>
        {mode === 'flashcards' ? (
          <FlashcardView session={session} />
        ) : mode === 'free' ? (
          <FreeView notes={freeNotes.notes} />
        ) : (
          <section className={styles.placeholder}>
            <p>
              {mode === 'sheet'
                ? 'La vista de partitura MusicXML llegará en la fase de importación.'
                : 'El piano roll de bloques descendentes se construirá sobre el mismo modelo musical.'}
            </p>
          </section>
        )}
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerMain}>
          <PianoKeyboard
            pressedPitches={midi.pressedPitches}
            targetPitches={targetPitches}
            fingerings={fingerings}
          />
          <IncomingNotes notes={midi.recentNotes} />
        </div>
      </footer>
    </div>
  );
}
