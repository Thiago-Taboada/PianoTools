export type MatchResult = 'correct' | 'incorrect';

/**
 * Compara el conjunto esperado de pitches contra el conjunto tocado.
 * Devuelve 'correct' solo si ambos tienen exactamente los mismos pitches
 * (sin importar el orden, sin notas de más ni de menos).
 */
export function matchPitchSet(
  expected: number[],
  played: number[],
): MatchResult {
  if (expected.length !== played.length) {
    return 'incorrect';
  }

  const playedSet = new Set(played);
  if (playedSet.size !== expected.length) {
    return 'incorrect';
  }

  return expected.every((pitch) => playedSet.has(pitch))
    ? 'correct'
    : 'incorrect';
}

/**
 * Compara una sola altura esperada contra la tocada. Se usa en la evaluación
 * en orden de las secuencias (modo `'notes'` con varias notas), nota a nota.
 * Devuelve 'correct' si coinciden exactamente, si no 'incorrect'.
 */
export function matchPitch(expected: number, played: number): MatchResult {
  return expected === played ? 'correct' : 'incorrect';
}
