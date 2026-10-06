/** Small deterministic PRNG (mulberry32) so mock data is stable between renders/builds. */
export function rng(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}
export const pick = <T,>(r: () => number, arr: readonly T[]) => arr[Math.floor(r() * arr.length)];
export const hex = (r: () => number, n: number) =>
  Array.from({ length: n }, () => "0123456789abcdef"[Math.floor(r() * 16)]).join("");
