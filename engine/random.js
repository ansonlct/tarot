export function secureRandomInt(maxExclusive) {
  if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) throw new Error('maxExclusive must be a positive integer');
  const cryptoObj = globalThis.crypto;
  if (!cryptoObj?.getRandomValues) throw new Error('Web Crypto API is required for secure random drawing.');
  const limit = Math.floor(0x100000000 / maxExclusive) * maxExclusive;
  const buf = new Uint32Array(1);
  let value;
  do { cryptoObj.getRandomValues(buf); value = buf[0]; } while (value >= limit);
  return value % maxExclusive;
}

export const secureChoice = (items) => items[secureRandomInt(items.length)];

export function secureShuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = secureRandomInt(i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
