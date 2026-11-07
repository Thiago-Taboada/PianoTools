export type MidiConnectionStatus =
  | 'unsupported'
  | 'permission-pending'
  | 'disconnected'
  | 'connected'
  | 'error';

export type NormalizedMidiNoteType = 'note-on' | 'note-off';

export interface NormalizedMidiNote {
  type: NormalizedMidiNoteType;
  pitch: number;
  velocity: number;
  channel: number;
  timestamp: number;
  source: 'midi' | 'computer-keyboard';
}

export interface MidiDeviceOption {
  id: string;
  name: string;
  manufacturer: string;
}

export interface MidiManagerState {
  status: MidiConnectionStatus;
  devices: MidiDeviceOption[];
  selectedDeviceId: string | null;
  errorMessage: string | null;
  pressedPitches: number[];
  recentNotes: NormalizedMidiNote[];
}
