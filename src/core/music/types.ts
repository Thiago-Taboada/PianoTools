export interface NoteEvent {
  id: string;
  pitch: number;
  start: number;
  duration: number;
  velocity: number;
  track: number;
  channel?: number;
}

export interface MusicalTrack {
  id: string;
  name: string;
  channel?: number;
}

export interface MusicalDocument {
  title: string;
  tempo: number;
  timeSignature: {
    numerator: number;
    denominator: number;
  };
  notes: NoteEvent[];
  tracks: MusicalTrack[];
}

export type Clef = 'treble' | 'bass';
