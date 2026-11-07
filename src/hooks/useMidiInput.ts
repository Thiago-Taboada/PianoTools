import { useEffect, useRef, useState } from 'react';
import { MidiInputManager } from '../core/midi/MidiInputManager';
import type { MidiManagerState, NormalizedMidiNote } from '../core/midi/types';

const COMPUTER_KEY_MAP: Record<string, number> = {
  a: 60,
  w: 61,
  s: 62,
  e: 63,
  d: 64,
  f: 65,
  t: 66,
  g: 67,
  y: 68,
  h: 69,
  u: 70,
  j: 71,
  k: 72,
};

const INITIAL_STATE: MidiManagerState = {
  status: 'permission-pending',
  devices: [],
  selectedDeviceId: null,
  errorMessage: null,
  pressedPitches: [],
  recentNotes: [],
};

export function useMidiInput(
  onNote?: (event: NormalizedMidiNote | null) => void,
) {
  const [state, setState] = useState<MidiManagerState>(INITIAL_STATE);
  const onNoteRef = useRef(onNote);
  onNoteRef.current = onNote;

  useEffect(() => {
    const manager = MidiInputManager.getInstance();
    const unsubscribe = manager.subscribe((nextState, event) => {
      setState(nextState);
      onNoteRef.current?.(event);
    });
    void manager.requestAccess();
    return unsubscribe;
  }, []);

  useEffect(() => {
    const held = new Set<string>();
    const manager = MidiInputManager.getInstance();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat || event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }

      const target = event.target as HTMLElement | null;
      if (target && ['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName)) {
        return;
      }

      const pitch = COMPUTER_KEY_MAP[event.key.toLowerCase()];
      if (pitch === undefined || held.has(event.key)) {
        return;
      }

      held.add(event.key);
      manager.injectComputerNote('note-on', pitch);
    };

    const onKeyUp = (event: KeyboardEvent) => {
      const pitch = COMPUTER_KEY_MAP[event.key.toLowerCase()];
      if (pitch === undefined) {
        return;
      }

      held.delete(event.key);
      manager.injectComputerNote('note-off', pitch);
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  const selectDevice = (deviceId: string) => {
    MidiInputManager.getInstance().selectDevice(deviceId);
  };

  return { ...state, selectDevice };
}
