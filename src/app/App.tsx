import { useState } from 'react';
import { suggestFingerings } from '../core/music/pitch';
import { IncomingNotes } from '../components/IncomingNotes/IncomingNotes';
import { MidiStatus } from '../components/MidiStatus/MidiStatus';
import { PianoKeyboard } from '../components/PianoKeyboard/PianoKeyboard';
import { FlashcardView } from '../features/flashcards/components/FlashcardView';
import { useFlashcardSession } from '../features/flashcards/hooks/useFlashcardSession';
import { useMidiInput } from '../hooks/useMidiInput';
import styles from './App.module.css';

type AppMode = 'flashcards' | 'sheet' | 'piano-roll';

export default function App() {
  const [mode, setMode] = useState<AppMode>('flashcards');
  const session = useFlashcardSession();
  const midi = useMidiInput(session.handleMidiEvent);

  const practiceActive =
    mode === 'flashcards' && session.practiceMode && session.exercise !== null;
  const targetPitches = practiceActive
    ? session.exercise!.expectedPitches
    : undefined;
  const fingerings = practiceActive
    ? suggestFingerings(
        session.exercise!.expectedPitches,
        session.exercise!.clef,
      )
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
