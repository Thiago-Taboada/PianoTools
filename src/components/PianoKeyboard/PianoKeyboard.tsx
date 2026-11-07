import { isBlackKey } from '../../core/music/pitch';
import styles from './PianoKeyboard.module.css';

const START = 48;
const END = 84;

interface PianoKeyboardProps {
  pressedPitches: number[];
}

export function PianoKeyboard({ pressedPitches }: PianoKeyboardProps) {
  const pressed = new Set(pressedPitches);
  const whiteKeys: number[] = [];

  for (let pitch = START; pitch <= END; pitch += 1) {
    if (!isBlackKey(pitch)) {
      whiteKeys.push(pitch);
    }
  }

  return (
    <div className={styles.keyboard} aria-hidden="true">
      {whiteKeys.map((pitch) => (
        <div
          key={pitch}
          className={`${styles.white} ${pressed.has(pitch) ? styles.whiteActive : ''}`}
        />
      ))}
      {whiteKeys.map((pitch, index) => {
        const sharp = pitch + 1;
        if (sharp > END || !isBlackKey(sharp)) {
          return null;
        }

        const left = ((index + 1) / whiteKeys.length) * 100;
        return (
          <div
            key={sharp}
            className={`${styles.black} ${pressed.has(sharp) ? styles.blackActive : ''}`}
            style={{ left: `calc(${left}% - 0.7%)` }}
          />
        );
      })}
    </div>
  );
}
