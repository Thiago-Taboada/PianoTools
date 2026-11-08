import { useEffect, useId, useRef, useState, type ReactElement } from 'react';
import styles from './Select.module.css';

export interface SelectOption<T extends string> {
  value: T;
  label: string;
}

export interface SelectProps<T extends string> {
  value: T;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  disabled?: boolean;
  id?: string;
  'aria-label'?: string;
}

/**
 * Dropdown propio y reutilizable (botón trigger + popover con lista de
 * opciones), totalmente estilado con CSS Modules para el tema oscuro. Sustituye
 * al `<select>` nativo, cuyo desplegable lo pinta el SO y no es estilable de
 * forma fiable. Patrón ARIA combobox/listbox con foco real en las opciones.
 */
export function Select<T extends string>({
  value,
  options,
  onChange,
  disabled = false,
  id,
  'aria-label': ariaLabel,
}: SelectProps<T>): ReactElement {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<(HTMLLIElement | null)[]>([]);

  const reactId = useId();
  const listboxId = `${id ?? reactId}-listbox`;

  const selectedIndex = options.findIndex((option) => option.value === value);
  const selectedOption = selectedIndex >= 0 ? options[selectedIndex] : options[0];

  const openList = () => {
    if (disabled) return;
    const startIndex = selectedIndex >= 0 ? selectedIndex : 0;
    setActiveIndex(startIndex);
    setOpen(true);
  };

  const closeList = (returnFocus = true) => {
    setOpen(false);
    if (returnFocus) {
      triggerRef.current?.focus();
    }
  };

  const selectIndex = (index: number) => {
    const option = options[index];
    if (!option) return;
    onChange(option.value);
    closeList();
  };

  // Enfoca la opción activa al abrir o al moverse con el teclado.
  useEffect(() => {
    if (!open) return;
    optionRefs.current[activeIndex]?.focus();
  }, [open, activeIndex]);

  // Clic fuera y Escape cierran el popover. Listeners en document, limpios en
  // el cleanup; solo registrados mientras está abierto.
  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        closeList();
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const handleTriggerKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (
      event.key === 'ArrowDown' ||
      event.key === 'ArrowUp' ||
      event.key === 'Enter' ||
      event.key === ' '
    ) {
      event.preventDefault();
      openList();
    }
  };

  const handleListKeyDown = (event: React.KeyboardEvent<HTMLUListElement>) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setActiveIndex((index) => Math.min(index + 1, options.length - 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        setActiveIndex((index) => Math.max(index - 1, 0));
        break;
      case 'Home':
        event.preventDefault();
        setActiveIndex(0);
        break;
      case 'End':
        event.preventDefault();
        setActiveIndex(options.length - 1);
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        selectIndex(activeIndex);
        break;
      default:
        break;
    }
  };

  return (
    <div className={styles.container} ref={containerRef}>
      <button
        ref={triggerRef}
        type="button"
        id={id}
        className={styles.trigger}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-label={ariaLabel}
        onClick={() => (open ? closeList(false) : openList())}
        onKeyDown={handleTriggerKeyDown}
      >
        <span className={styles.triggerLabel}>{selectedOption?.label ?? ''}</span>
        <svg
          className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`}
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open ? (
        <ul
          id={listboxId}
          className={styles.popover}
          role="listbox"
          tabIndex={-1}
          aria-label={ariaLabel}
          onKeyDown={handleListKeyDown}
        >
          {options.map((option, index) => {
            const isSelected = option.value === value;
            const isActive = index === activeIndex;
            return (
              <li
                key={option.value}
                ref={(node) => {
                  optionRefs.current[index] = node;
                }}
                role="option"
                aria-selected={isSelected}
                tabIndex={-1}
                className={`${styles.option} ${isActive ? styles.optionActive : ''}`}
                onClick={() => selectIndex(index)}
                onMouseEnter={() => setActiveIndex(index)}
              >
                <span className={styles.check} aria-hidden="true">
                  {isSelected ? '✓' : ''}
                </span>
                {option.label}
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
