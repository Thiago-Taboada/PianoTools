import type { NormalizedMidiNote } from './types';

const NOTE_OFF = 0x80;
const NOTE_ON = 0x90;

export function parseMidiMessage(
  data: Uint8Array,
  timestamp: number,
): NormalizedMidiNote | null {
  if (data.length < 3) {
    return null;
  }

  const status = data[0] ?? 0;
  const command = status & 0xf0;
  const channel = (status & 0x0f) + 1;
  const pitch = data[1] ?? 0;
  const velocity = data[2] ?? 0;

  if (command === NOTE_OFF || (command === NOTE_ON && velocity === 0)) {
    return {
      type: 'note-off',
      pitch,
      velocity,
      channel,
      timestamp,
      source: 'midi',
    };
  }

  if (command === NOTE_ON) {
    return {
      type: 'note-on',
      pitch,
      velocity,
      channel,
      timestamp,
      source: 'midi',
    };
  }

  return null;
}
