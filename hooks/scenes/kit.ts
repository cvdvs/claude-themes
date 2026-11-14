// Shared pieces for every scene. The canvas matches a tall desktop window (about 1250 × 1410,
// sidebar on the left, chat column in the middle). Art lives at the edges; the text column stays clear.

export const W = 1250
export const H = 1410

export const ZONES = {
  // Under the sidebar panel (frosted by it).
  sidebar: { x0: 0, x1: 255 },
  // The chat column and input box: keep art out of here, ambient glow only.
  text: { x0: 262, x1: 1060, y0: 150, y1: 1320 },
  // The free strip on the right of the chat column.
  right: { x0: 1060, x1: 1250 },
} as const

// Seeded random numbers, so a scene looks the same on every redraw.
export function rng(seed: number): () => number {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// A negative start time for SMIL `begin` or CSS `animation-delay`, from the wall clock, so a redraw
// (idle <-> busy) carries on mid-motion instead of jumping back to the start.
export const begin = (now: number, cycle: number, offset = 0): string =>
  `-${((now / 1000 + offset) % cycle).toFixed(2)}s`

// The root element every scene starts with.
export const open = (): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice">`
