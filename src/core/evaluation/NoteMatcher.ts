export type MatchResult = 'correct' | 'incorrect';

export function matchPitch(
  expectedPitch: number,
  playedPitch: number,
): MatchResult {
  return expectedPitch === playedPitch ? 'correct' : 'incorrect';
}
