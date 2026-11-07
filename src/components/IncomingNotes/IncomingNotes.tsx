import { midiToNoteName } from '../../core/music/pitch';
import type { NormalizedMidiNote } from '../../core/midi/types';
import styles from './IncomingNotes.module.css';

interface IncomingNotesProps {
  notes: NormalizedMidiNote[];
}

export function IncomingNotes({ notes }: IncomingNotesProps) {
  return (
    <section className={styles.panel}>
      <h2>Notas entrantes</h2>
      {notes.length === 0 ? (
        <p>Aún no hay eventos MIDI.</p>
      ) : (
        <ul className={styles.list}>
          {notes.map((note, index) => (
            <li key={`${note.timestamp}-${note.pitch}-${index}`}>
              <span className={note.type === 'note-on' ? styles.on : styles.off}>
                {note.type === 'note-on' ? 'note-on' : 'note-off'}
              </span>
              <span>{midiToNoteName(note.pitch)}</span>
              <span>MIDI {note.pitch}</span>
              <span>vel {note.velocity}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
