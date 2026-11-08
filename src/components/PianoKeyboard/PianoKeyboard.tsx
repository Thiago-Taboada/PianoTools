import { isBlackKey } from '../../core/music/pitch';
import styles from './PianoKeyboard.module.css';

const START = 48;
const END = 84;
const MIDDLE_C = 60;

interface PianoKeyboardProps {
  pressedPitches: number[];
  targetPitches?: number[];
  fingerings?: Record<number, number>;
}

export function PianoKeyboard({
  pressedPitches,
  targetPitches,
  fingerings,
}: PianoKeyboardProps) {
  const pressed = new Set(pressedPitches);
  const targets = new Set(targetPitches ?? []);
  const fingers = fingerings ?? {};
  const whiteKeys: number[] = [];

  for (let pitch = START; pitch <= END; pitch += 1) {
    if (!isBlackKey(pitch)) {
      whiteKeys.push(pitch);
    }
  }

  const whiteWidth = 100 / whiteKeys.length;

  return (
    <div className={styles.keyboard} aria-hidden="true">
      {whiteKeys.map((pitch) => {
        const classes = [
          styles.white,
          pressed.has(pitch) ? styles.whiteActive : '',
          targets.has(pitch) ? styles.whiteTarget : '',
        ]
          .filter(Boolean)
          .join(' ');
        return <div key={pitch} className={classes} />;
      })}
      {whiteKeys.map((pitch, index) => {
        if (pitch !== MIDDLE_C) {
          return null;
        }
        return (
          <span
            key="watermark-c4"
            className={styles.watermark}
            style={{ left: `${(index + 0.5) * whiteWidth}%` }}
            aria-hidden="true"
          >
            C4
          </span>
        );
      })}
      {whiteKeys.map((pitch, index) => {
        if (!targets.has(pitch) || fingers[pitch] == null) {
          return null;
        }
        return (
          <span
            key={`finger-${pitch}`}
            className={styles.finger}
            style={{ left: `${(index + 0.5) * whiteWidth}%` }}
          >
            {fingers[pitch]}
          </span>
        );
      })}
      {whiteKeys.map((pitch, index) => {
        const sharp = pitch + 1;
        if (sharp > END || !isBlackKey(sharp)) {
          return null;
        }

        const left = ((index + 1) / whiteKeys.length) * 100;
        const isTarget = targets.has(sharp);
        const classes = [
          styles.black,
          pressed.has(sharp) ? styles.blackActive : '',
          isTarget ? styles.blackTarget : '',
        ]
          .filter(Boolean)
          .join(' ');
        return (
          <div
            key={sharp}
            className={classes}
            style={{ left: `calc(${left}% - 0.7%)` }}
          >
            {isTarget && fingers[sharp] != null ? (
              <span className={styles.fingerBlack}>{fingers[sharp]}</span>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
