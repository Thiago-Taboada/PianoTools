import { midiToNoteName, midiToSolfege } from '../../../core/music/pitch';
import type { SessionSummary as SessionSummaryData } from '../types';
import styles from './SessionSummary.module.css';

interface SessionSummaryProps {
  summary: SessionSummaryData;
}

export function SessionSummary({ summary }: SessionSummaryProps) {
  return (
    <div className={styles.panel}>
      <div className={styles.stats}>
        <div className={styles.stat}>
          <span>Precisión</span>
          <strong>{summary.accuracy}%</strong>
        </div>
        <div className={styles.stat}>
          <span>Aciertos</span>
          <strong>
            {summary.correct}/{summary.total}
          </strong>
        </div>
        <div className={styles.stat}>
          <span>Tiempo medio</span>
          <strong>{Math.round(summary.averageResponseMs)} ms</strong>
        </div>
      </div>
      <ol className={styles.list}>
        {summary.results.map((item, index) => (
          <li key={item.exercise.id}>
            <span>
              {index + 1}.{' '}
              {item.exercise.expectedPitches
                .map(
                  (pitch) =>
                    `${midiToNoteName(pitch)} · ${midiToSolfege(pitch)}`,
                )
                .join(' + ')}
            </span>
            <span className={item.result === 'correct' ? styles.ok : styles.bad}>
              {item.result === 'correct' ? 'Correcto' : 'Incorrecto'} · tocaste{' '}
              {item.playedPitches
                .map((pitch) => midiToNoteName(pitch))
                .join(' + ')}
            </span>
          </li>
        ))}
      </ol>
      <p className={styles.note}>
        La digitación del modo práctica es una sugerencia aproximada: mano
        derecha en clave de sol y mano izquierda en clave de fa.
      </p>
    </div>
  );
}
