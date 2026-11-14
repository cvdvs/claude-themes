// Shared pieces for every scene. The canvas matches a tall desktop window (about 1250 × 1410,
// sidebar on the left, chat column in the middle). Art lives in the right column and the top and bottom bands; the text column stays clear.

export const W = 1250
export const H = 1410

export const ZONES = {
  // Under the sidebar: the app draws it almost solid, so only a faint glow belongs here.
  sidebar: { x0: 0, x1: 255 },
  // Behind the reply text: dim ambient color only.
  text: { x0: 310, x1: 1000, y0: 60, y1: 1230 },
  // The main stage: the ragged ends of lines and the margin right of the reply cards.
  right: { x0: 1000, x1: 1250 },
  // Bands that frame the chat: the header, and around and below the message box.
  top: { y0: 0, y1: 120 },
  bottom: { y0: 1230, y1: 1410 },
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
