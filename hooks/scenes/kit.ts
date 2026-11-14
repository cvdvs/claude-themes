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

// ---------------------------------------------------------------- the sidebar layer
// The app frosts the sidebar heavily (about a 50 px blur under a dark tint), so fine detail
// there turns to haze. What comes through is big, bright color, so each look gets a layer
// of large shapes in its own colors under the sidebar, moving slowly. It is clipped at the
// sidebar's edge so none of it reaches the text.

export type SidebarKind = 'ribbons' | 'orbs' | 'blocks' | 'moths'

export function sidebarLayer(kind: SidebarKind, colors: string[], isBusy: boolean, now: number, seed = 7): string {
  const rand = rng(seed)
  const pick = (i: number) => colors[i % colors.length] ?? '#ffffff'
  const parts: string[] = []
  const style: string[] = [
    '@keyframes sb-sway{from{transform:translate(-60px,-110px)}to{transform:translate(60px,110px)}}',
    '@keyframes sb-rise{from{transform:translate(0,140px)}to{transform:translate(0,-140px)}}',
    '@keyframes sb-blink{0%,100%{opacity:.25}50%{opacity:1}}',
  ]
  const anim = (name: string, dur: number, i: number, timing = 'ease-in-out', dir = 'alternate') =>
    `animation:${name} ${dur.toFixed(1)}s ${timing} ${begin(now, dir === 'alternate' ? dur * 2 : dur, i * 3.7)} infinite ${dir}`

  if (kind === 'ribbons') {
    // Ribbons that swing right across the sidebar and back, crossing each other.
    for (let i = 0; i < 6; i++) {
      const x0 = -60 + rand() * 360
      const x1 = -60 + rand() * 360
      const x2 = -60 + rand() * 360
      const swing = 200 + rand() * 120
      const side = i % 2 === 0 ? 1 : -1
      const d = `M ${x0.toFixed(0)} -200 C ${(x0 + side * swing).toFixed(0)} 160, ${(x1 - side * swing).toFixed(0)} 480, ${x1.toFixed(0)} 760 S ${(x2 + side * swing).toFixed(0)} 1250, ${x2.toFixed(0)} 1620`
      parts.push(`<path d="${d}" fill="none" stroke="${pick(i)}" stroke-width="${(110 + rand() * 60).toFixed(0)}" stroke-linecap="round" style="${anim('sb-sway', 16 + rand() * 12, i)}"/>`)
    }
  } else if (kind === 'orbs') {
    colors.forEach((c, i) => {
      parts.push(`<radialGradient id="sb-g${i}"><stop offset="0" stop-color="${c}"/><stop offset=".65" stop-color="${c}" stop-opacity=".92"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient>`)
    })
    for (let i = 0; i < 12; i++) {
      const cx = 20 + rand() * 220
      const cy = 40 + i * 118 + (rand() - 0.5) * 70
      const r = 95 + rand() * 55
      parts.push(`<circle cx="${cx.toFixed(0)}" cy="${cy.toFixed(0)}" r="${r.toFixed(0)}" fill="url(#sb-g${i % colors.length})" style="${anim('sb-rise', 14 + rand() * 14, i)}"/>`)
    }
  } else if (kind === 'blocks') {
    const cell = 96
    let blinks = 0
    for (let row = 0; row < 16; row++) {
      for (let col = 0; col < 3; col++) {
        if (rand() > 0.58) continue
        const blink = blinks < 20 && rand() < 0.45
        if (blink) blinks++
        const dur = 3 + rand() * 6
        parts.push(`<rect x="${col * cell}" y="${row * cell - 20}" width="${cell}" height="${cell}" fill="${pick(Math.floor(rand() * colors.length))}"${blink ? ` style="${anim('sb-blink', dur, row * 4 + col, 'steps(2)', 'normal')}"` : ''}/>`)
      }
    }
  } else {
    // Big glowing moths: the moth scene defines #bf (a wing pair) and its wing gradient.
    parts.push(`<radialGradient id="sb-halo"><stop offset="0" stop-color="#ffffff"/><stop offset=".4" stop-color="${pick(0)}" stop-opacity=".9"/><stop offset="1" stop-color="${pick(0)}" stop-opacity="0"/></radialGradient>`)
    for (let i = 0; i < 5; i++) {
      const x = 70 + rand() * 120
      const y = 140 + i * 280 + (rand() - 0.5) * 80
      const flap = 1.6 + rand() * 0.8
      parts.push(`<g style="${anim('sb-rise', 16 + rand() * 10, i)}"><circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="200" fill="url(#sb-halo)"/>
<g transform="translate(${x.toFixed(0)} ${y.toFixed(0)}) rotate(${((rand() - 0.5) * 50).toFixed(0)}) scale(${(2.5 + rand() * 0.6).toFixed(2)})"><g><animateTransform attributeName="transform" type="scale" values="1 1;0.3 1;1 1" dur="${flap.toFixed(2)}s" begin="${begin(now, flap, i)}" repeatCount="indefinite"/><use href="#bf"/></g></g></g>`)
    }
  }

  return `<defs><clipPath id="sb-clip"><rect x="0" y="0" width="256" height="${H}"/></clipPath></defs>
<style>${style.join('')}</style>
<g clip-path="url(#sb-clip)" opacity="${isBusy ? 1 : 0.86}">${parts.join('\n')}</g>`
}

// A scene fitted to any window. Scenes are drawn on the 1250 × 1410 canvas. The app keeps
// the chat column centered in the area right of the sidebar, at most about 1280 px wide.
// - Narrow windows (no room beside the chat): the canvas right of the sidebar is pinned to the
//   window's right edge and scaled to its height, so the right column and the top and bottom
//   bands frame the chat.
// - Wide windows (from 1900 px): the scene's right column hugs the chat on the right, and a
//   mirror of it hugs the chat on the left, framing it on both sides.
// - Always: the sidebar layer fills the sidebar (about 256 px) at the left edge.
// - Phones (no sidebar): the art fills the screen from its right edge, where the columns are.
// The scene is drawn once into <defs> and shown with <use>, so its ids stay unique.
export type Surface = 'desktop' | 'mobile' | string

const CHAT_HALF = 640
const SIDEBAR = 256
const WIDE = 2 * (CHAT_HALF + SIDEBAR / 2) + 2 * 260 // room for a 260 px column beside the chat

export function withSidebar(
  scene: (isBusy: boolean, now: number) => string,
  kind: SidebarKind,
  colors: string[],
  background: string,
): (isBusy: boolean, now: number, surface?: Surface) => string {
  return (isBusy, now, surface = 'desktop') => {
    const drawn = scene(isBusy, now)
    const inner = drawn.slice(drawn.indexOf('>') + 1, drawn.lastIndexOf('</svg>'))
    const head = `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"><defs><g id="scene">${inner}</g></defs><rect width="100%" height="100%" fill="${background}"/>`
    if (surface === 'mobile') {
      return `${head}<svg width="100%" height="100%" viewBox="${SIDEBAR} 0 ${W - SIDEBAR} ${H}" preserveAspectRatio="xMaxYMid slice"><use href="#scene"/></svg></svg>`
    }
    const column = `viewBox="1000 0 250 ${H}"`
    const left = SIDEBAR / 2 - CHAT_HALF // chat's left edge, from the window's middle
    const right = SIDEBAR / 2 + CHAT_HALF // chat's right edge, from the window's middle
    return `${head}<style>.wide{display:none}@media (min-width:${WIDE}px){.wide{display:inline}.narrow{display:none}}</style>
<svg class="narrow" width="100%" height="100%" viewBox="${SIDEBAR} 0 ${W - SIDEBAR} ${H}" preserveAspectRatio="xMaxYMid meet"><use href="#scene"/></svg>
<g class="wide" transform="translate(${left} 0)"><svg width="50%" height="100%" ${column} preserveAspectRatio="xMaxYMid meet"><g transform="translate(2250 0) scale(-1 1)"><use href="#scene"/></g></svg></g>
<g class="wide" transform="translate(${right} 0)"><svg x="50%" width="50%" height="100%" ${column} preserveAspectRatio="xMinYMid meet"><use href="#scene"/></svg></g>
<svg width="${SIDEBAR}" height="100%" viewBox="0 0 ${SIDEBAR} ${H}" preserveAspectRatio="xMinYMid slice">${sidebarLayer(kind, colors, isBusy, now)}</svg></svg>`
  }
}
