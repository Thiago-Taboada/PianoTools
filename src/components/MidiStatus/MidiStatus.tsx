import type { MidiConnectionStatus, MidiDeviceOption } from '../../core/midi/types';
import styles from './MidiStatus.module.css';

const STATUS_LABEL: Record<MidiConnectionStatus, string> = {
  connected: 'MIDI conectado',
  disconnected: 'MIDI desconectado',
  'permission-pending': 'Permiso MIDI pendiente',
  unsupported: 'MIDI no compatible',
  error: 'Error MIDI',
};

interface MidiStatusProps {
  status: MidiConnectionStatus;
  devices: MidiDeviceOption[];
  selectedDeviceId: string | null;
  errorMessage: string | null;
  onSelectDevice: (deviceId: string) => void;
}

export function MidiStatus({
  status,
  devices,
  selectedDeviceId,
  errorMessage,
  onSelectDevice,
}: MidiStatusProps) {
  return (
    <div className={styles.row}>
      <span className={`${styles.badge} ${styles[status] ?? ''}`}>
        <span className={styles.dot} />
        {STATUS_LABEL[status]}
      </span>
      {devices.length > 0 ? (
        <select
          className={styles.select}
          value={selectedDeviceId ?? ''}
          onChange={(event) => onSelectDevice(event.target.value)}
          aria-label="Dispositivo MIDI de entrada"
        >
          {devices.map((device) => (
            <option key={device.id} value={device.id}>
              {device.name}
            </option>
          ))}
        </select>
      ) : null}
      {errorMessage ? <span className={styles.message}>{errorMessage}</span> : null}
    </div>
  );
}
