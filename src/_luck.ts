// Students: Do not modify this file.

import murmur32 from "murmur-32";

/**
 * Deterministically generates a number between 0 and 1 for the given
 * situation. Use the result like you would for `Math.random()`.
 */
export default function luck(situation: string): number {
  const LARGE_INTEGER = 1 << 30;
  return (
    (new DataView(murmur32(situation)).getUint32(0) % LARGE_INTEGER) /
    LARGE_INTEGER
  );
}
