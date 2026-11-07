import { parseMidiMessage } from './MidiMessageParser';
import type {
  MidiDeviceOption,
  MidiManagerState,
  NormalizedMidiNote,
} from './types';

type Listener = (state: MidiManagerState, event: NormalizedMidiNote | null) => void;

const RECENT_NOTES_LIMIT = 24;

function deviceLabel(input: WebMidi.MIDIInput): MidiDeviceOption {
  return {
    id: input.id,
    name: input.name ?? 'Dispositivo MIDI',
    manufacturer: input.manufacturer ?? '',
  };
}

export class MidiInputManager {
  private static instance: MidiInputManager | null = null;

  private access: WebMidi.MIDIAccess | null = null;
  private selectedInput: WebMidi.MIDIInput | null = null;
  private listeners = new Set<Listener>();
  private pressed = new Set<number>();
  private recentNotes: NormalizedMidiNote[] = [];
  private selectedDeviceId: string | null = null;
  private status: MidiManagerState['status'] = 'permission-pending';
  private errorMessage: string | null = null;

  static getInstance(): MidiInputManager {
    MidiInputManager.instance ??= new MidiInputManager();
    return MidiInputManager.instance;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.getState(), null);
    return () => {
      this.listeners.delete(listener);
    };
  }

  getState(): MidiManagerState {
    return {
      status: this.status,
      devices: this.listDevices(),
      selectedDeviceId: this.selectedDeviceId,
      errorMessage: this.errorMessage,
      pressedPitches: [...this.pressed].sort((a, b) => a - b),
      recentNotes: [...this.recentNotes],
    };
  }

  async requestAccess(): Promise<void> {
    if (!navigator.requestMIDIAccess) {
      this.status = 'unsupported';
      this.errorMessage =
        'Este navegador no admite Web MIDI. Usa Chrome o Edge en localhost.';
      this.emit(null);
      return;
    }

    this.status = 'permission-pending';
    this.errorMessage = null;
    this.emit(null);

    try {
      this.access = await navigator.requestMIDIAccess({
        sysex: false,
        software: false,
      });
      this.access.onstatechange = () => {
        this.refreshInputs();
      };
      this.refreshInputs();
    } catch (error) {
      this.status = 'error';
      const raw = error instanceof Error ? error.message : '';
      this.errorMessage = /not granted/i.test(raw)
        ? 'No se concedió el permiso MIDI. Recarga la página en Chrome o Edge y acéptalo.'
        : raw || 'No se pudo obtener acceso MIDI.';
      this.emit(null);
    }
  }

  selectDevice(deviceId: string): void {
    this.selectedDeviceId = deviceId;
    this.bindSelectedInput();
    this.emit(null);
  }

  injectComputerNote(type: NormalizedMidiNote['type'], pitch: number): void {
    this.handleNote({
      type,
      pitch,
      velocity: type === 'note-on' ? 96 : 0,
      channel: 1,
      timestamp: performance.now(),
      source: 'computer-keyboard',
    });
  }

  private listDevices(): MidiDeviceOption[] {
    if (!this.access) {
      return [];
    }

    return [...this.access.inputs.values()].map(deviceLabel);
  }

  private refreshInputs(): void {
    if (!this.access) {
      return;
    }

    const devices = this.listDevices();
    const stillSelected = devices.some(
      (device) => device.id === this.selectedDeviceId,
    );

    if (!stillSelected) {
      this.selectedDeviceId = devices[0]?.id ?? null;
    }

    this.bindSelectedInput();

    if (devices.length === 0) {
      this.status = 'disconnected';
      this.errorMessage = 'No se detectó ningún teclado MIDI.';
    } else {
      this.status = 'connected';
      this.errorMessage = null;
    }

    this.emit(null);
  }

  private bindSelectedInput(): void {
    if (this.selectedInput) {
      this.selectedInput.onmidimessage = null;
      this.selectedInput = null;
    }

    if (!this.access || !this.selectedDeviceId) {
      return;
    }

    const input = this.access.inputs.get(this.selectedDeviceId);
    if (!input) {
      return;
    }

    this.selectedInput = input;
    input.onmidimessage = (event) => {
      const data =
        event.data instanceof Uint8Array
          ? event.data
          : new Uint8Array(event.data ?? []);
      const parsed = parseMidiMessage(data, event.timeStamp);
      if (parsed) {
        this.handleNote(parsed);
      }
    };
  }

  private handleNote(note: NormalizedMidiNote): void {
    if (note.type === 'note-on') {
      this.pressed.add(note.pitch);
    } else {
      this.pressed.delete(note.pitch);
    }

    this.recentNotes = [note, ...this.recentNotes].slice(0, RECENT_NOTES_LIMIT);
    this.emit(note);
  }

  private emit(event: NormalizedMidiNote | null): void {
    const state = this.getState();
    for (const listener of this.listeners) {
      listener(state, event);
    }
  }
}
