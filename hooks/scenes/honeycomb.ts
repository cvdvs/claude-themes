// Honeycomb: a honeycomb of fine hexagonal cells on deep navy, colored dots at their corners, a few
// cells filled with rings of dots, and pale curved lines fanning out of a handful of hubs. The comb
// fills a column down the right of the window, where reply lines end, and runs along the top and
// the bottom as one row each; a fine thread of dots runs down the narrow margin left of the replies.
// The pastel color walks around that frame: butter at the bottom left, peach and pink up the thread,
// violet across the top, cyan and mint down the right. The sidebar only gets a faint glow, the chat
// text a soft navy one.
// Motion: some lines draw themselves in and fade (stroke-dashoffset); corner dots and hubs pulse.

import { W, H, rng, begin, open } from './kit'

type Cell = { x: number; y: number; kind: number; hex: string; s: number }
type Dot = { x: number; y: number; hex: string }
type Fan = { hub: Dot; curves: string[] }

// Where the reply text sits in the app window: nothing but a glow goes here. Left of it is a thin
// margin (x 256 to 298) and the sidebar, which is drawn almost solid.
const T = { x0: 298, x1: 990, y0: 100, y1: 1236 }
const SIDE = 258
const THREAD = 274
const R = 36
const HW = R * Math.cos(Math.PI / 6)
// Lattice steps: rows land at y 42 (the top band), 1277 (between the last reply and the input box)
// and 1372 (under it).
const ROW = 95
const STEP = 110

// Pastel stops around the frame, by position s in [0, 1): bottom left, up the left, across the top,
// down the right, back along the bottom.
const STOPS: Array<[number, string]> = [
  [0, '#f6e27f'],
  [0.13, '#fbb98e'],
  [0.26, '#f79bc0'],
  [0.38, '#b99bfa'],
  [0.5, '#93aefb'],
  [0.62, '#8fdcf3'],
  [0.76, '#9cf0b5'],
  [0.88, '#d4f08a'],
  [1, '#f6e27f'],
]

const rgb = (hex: string): [number, number, number] => {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
const toHex = (c: [number, number, number]): string =>
  `#${c.map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('')}`
const mix = (a: string, b: string, t: number): string => {
  const p = rgb(a)
  const q = rgb(b)
  return toHex([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t, p[2] + (q[2] - p[2]) * t])
}

function hue(s: number): string {
  const v = ((s % 1) + 1) % 1
  for (let i = 1; i < STOPS.length; i++) {
    const a = STOPS[i - 1]
    const b = STOPS[i]
    if (a && b && v <= b[0]) return mix(a[1], b[1], (v - a[0]) / (b[0] - a[0]))
  }
  return STOPS[0]?.[1] ?? '#ffffff'
}

// Where a point sits on the walk around the frame, by its angle from the middle of the window.
const frameS = (x: number, y: number): number => {
  const deg = (Math.atan2(y - H / 2, x - W / 2) * 180) / Math.PI
  return (((deg - 128) % 360) + 360) % 360 / 360
}

const inText = (x: number, y: number, m: number): boolean =>
  x > T.x0 - m && x < T.x1 + m && y > T.y0 - m && y < T.y1 + m

const corners = (x: number, y: number, r: number): Array<[number, number]> =>
  [-90, -30, 30, 90, 150, 210].map(a => [x + r * Math.cos((a * Math.PI) / 180), y + r * Math.sin((a * Math.PI) / 180)])

const n1 = (v: number): string => (Math.round(v * 10) / 10).toString()

const G = (() => {
  const rand = rng(2810)
  const jit = (s: number) => (rand() - 0.5) * 2 * s

  // The lattice: rows 95 apart, cells 110 apart, odd rows shifted half a step. A cell is kept only if
  // its whole box stays clear of the text zone and the sidebar, and the top row starts right of the
  // chat title; some are dropped for air, like the reference.
  const cells: Cell[] = []
  for (let k = 0; k <= 14; k++) {
    const y = 42 + k * ROW
    for (let x = k % 2 ? 145 : 90; x < W + HW; x += STEP) {
      if (x + HW + 2 > T.x0 && x - HW - 2 < T.x1 && y + R + 2 > T.y0 && y - R - 2 < T.y1) continue
      if (x - HW < SIDE || (k === 0 && x < 490)) continue
      // The right column and the two band rows keep most of their cells; the row under the input box
      // thins out.
      if (rand() < (k === 0 ? 0 : k === 14 ? 0.3 : 0.08)) continue
      const p = rand()
      const kind = p < 0.17 ? 1 : p < 0.27 ? 2 : p < 0.33 ? 3 : 0
      const s = frameS(x, y) + jit(0.045)
      cells.push({ x, y, kind, hex: hue(s), s })
    }
  }

  const dots: Dot[] = []
  const cellMarks: string[] = []
  cells.forEach(c => {
    const pts = c.kind === 3 ? [-1, 1].flatMap(sx => [-1, 1].map(sy => [c.x + sx * R * 0.6, c.y + sy * R * 0.6] as [number, number])) : corners(c.x, c.y, R)
    const outline =
      c.kind === 3
        ? `M${n1(c.x - R * 0.6)} ${n1(c.y - R * 0.6)}h${n1(R * 1.2)}v${n1(R * 1.2)}h${n1(-R * 1.2)}z`
        : `M${c.x} ${c.y - R}l${n1(HW)} ${R / 2}v${R}l${n1(-HW)} ${R / 2}l${n1(-HW)} ${-R / 2}v${-R}z`
    const fillOp = c.kind === 1 ? 0.15 : c.kind === 2 ? 0.035 : 0.07
    let marks = `<path d="${outline}" stroke="${c.hex}" fill="${c.hex}" fill-opacity="${fillOp}"/>`
    const own: Array<[number, number]> = []
    if (c.kind !== 2) pts.forEach(p => (rand() < 0.82 ? own.push(p) : undefined))
    // Some cells carry a bent line through the middle, corner to center to corner.
    if (c.kind === 0 && rand() < 0.4) {
      const a = pts[Math.floor(rand() * pts.length)]
      const b = pts[Math.floor(rand() * pts.length)]
      if (a && b && a !== b) marks += `<path d="M${n1(a[0])} ${n1(a[1])}L${c.x} ${c.y}L${n1(b[0])} ${n1(b[1])}" stroke="${c.hex}" fill="none" stroke-opacity=".5"/>`
    }
    // Ring cells: a circle of dots with a few inside.
    const inner: Array<[number, number]> = []
    if (c.kind === 1) {
      const n = 10 + Math.floor(rand() * 3)
      const off = rand()
      for (let i = 0; i < n; i++) {
        const a = ((i + off) / n) * Math.PI * 2
        inner.push([c.x + Math.cos(a) * R * 0.6, c.y + Math.sin(a) * R * 0.6])
      }
      for (let i = 0; i < 4; i++) inner.push([c.x + jit(R * 0.3), c.y + jit(R * 0.3)])
    }
    const dotPath = (list: Array<[number, number]>) => list.map(([x, y]) => `M${n1(x)} ${n1(y)}h0`).join('')
    if (own.length) {
      const d = dotPath(own)
      marks += `<path d="${d}" stroke="${c.hex}" stroke-width="15" stroke-opacity=".13"/><path d="${d}" stroke="${c.hex}" stroke-width="7" stroke-opacity="1"/>`
    }
    if (inner.length) marks += `<path d="${dotPath(inner)}" stroke="${mix(c.hex, '#ffffff', 0.25)}" stroke-width="4.6" stroke-opacity=".9"/>`
    cellMarks.push(marks)
    own.forEach(([x, y]) => dots.push({ x, y, hex: c.hex }))
  })

  // The thread: a fine line down the margin with a small dot level with each row, turning a rounded
  // corner at the top into the first cell of the top row.
  const threadY = Array.from({ length: 14 }, (_, k) => 42 + (k + 1) * ROW)
  const first = threadY[0] ?? 137
  const corner = `M${THREAD} ${first}V94Q${THREAD} 60 ${THREAD + 34} 60H${n1(490 + 40 - HW)}`
  cellMarks.push(`<path d="${corner}" stroke="${hue(frameS(380, 60))}" fill="none"/>`)
  threadY.forEach((y, k) => {
    const hex = hue(frameS(THREAD, y))
    const next = threadY[k + 1]
    if (next !== undefined) cellMarks.push(`<path d="M${THREAD} ${y}V${next}" stroke="${mix(hex, hue(frameS(THREAD, next)), 0.5)}"/>`)
    cellMarks.push(`<path d="M${THREAD} ${y}h0" stroke="${hex}" stroke-width="11" stroke-opacity=".14"/><path d="M${THREAD} ${y}h0" stroke="${hex}" stroke-width="5" stroke-opacity="1"/>`)
    dots.push({ x: THREAD, y, hex })
  })

  // Curves must stay out of the text zone along their whole length.
  const quadClear = (a: Dot, cx: number, cy: number, b: Dot): boolean => {
    for (let i = 0; i <= 40; i++) {
      const t = i / 40
      const u = 1 - t
      const x = u * u * a.x + 2 * u * t * cx + t * t * b.x
      const y = u * u * a.y + 2 * u * t * cy + t * t * b.y
      if (inText(x, y, 12) || x < SIDE || x > W + 60 || y < -60 || y > H + 60) return false
    }
    return true
  }

  // Hubs: a corner dot near each of these spots, with lines fanning out to other corner dots.
  const spots: Array<[number, number]> = [[640, 70], [930, 70], [1135, 250], [1190, 640], [1080, 960], [1190, 1300], [700, 1300], [380, 1372]]
  const fans: Fan[] = []
  spots.forEach(([sx, sy]) => {
    const hub = dots.slice().sort((p, q) => Math.hypot(p.x - sx, p.y - sy) - Math.hypot(q.x - sx, q.y - sy))[0]
    if (!hub || fans.some(f => f.hub === hub)) return
    const curves: string[] = []
    const pool = dots
      .filter(d => {
        const len = Math.hypot(d.x - hub.x, d.y - hub.y)
        return len > 100 && len < 520
      })
      .sort(() => rand() - 0.5)
    for (const d of pool) {
      if (curves.length >= 11) break
      const len = Math.hypot(d.x - hub.x, d.y - hub.y)
      const nx = -(d.y - hub.y) / len
      const ny = (d.x - hub.x) / len
      const bend = (0.05 + rand() * 0.27) * len * (rand() < 0.5 ? -1 : 1)
      for (const sign of [1, -1]) {
        const cx = (hub.x + d.x) / 2 + nx * bend * sign
        const cy = (hub.y + d.y) / 2 + ny * bend * sign
        if (quadClear(hub, cx, cy, d)) {
          curves.push(`M${n1(hub.x)} ${n1(hub.y)}Q${n1(cx)} ${n1(cy)} ${n1(d.x)} ${n1(d.y)}`)
          break
        }
      }
    }
    fans.push({ hub, curves })
  })

  // Corner dots that pulse, spread out.
  const pulsing: Dot[] = []
  for (const d of dots.slice().sort(() => rand() - 0.5)) {
    if (pulsing.length >= 19) break
    if (fans.some(f => f.hub === d)) continue
    // Not on the seam between the sidebar and the chat panel, where a ring would show unfrosted.
    if (d.x - SIDE < 14) continue
    if (pulsing.some(p => Math.hypot(p.x - d.x, p.y - d.y) < 110)) continue
    pulsing.push(d)
  }

  // Which fan lines get a live overlay that draws in and fades: three or four per hub.
  const live = fans.flatMap((f, fi) =>
    f.curves
      .filter((_, i) => i % 3 === fi % 3)
      .slice(0, 4)
      .map((d, i) => ({ d, hex: mix(f.hub.hex, '#ffffff', 0.35), dur: 8 + rand() * 6, off: fi * 2.3 + i * 3.1 })),
  )

  return { cells: cellMarks.join(''), fans, pulsing, live }
})()

export function honeycombScene(isBusy: boolean, now: number): string {
  const pace = isBusy ? 0.55 : 1
  const draw = isBusy ? 'db' : 'dr'
  const beat = isBusy ? 'pb' : 'pu'

  const statics = G.fans.map(f => `<path d="${f.curves.join('')}" stroke="${f.hub.hex}"/>`).join('')

  const lines = G.live
    .map(l => {
      const d = l.dur * pace
      return `<path class="ln" pathLength="1" d="${l.d}" stroke="${l.hex}" style="animation:${draw} ${d.toFixed(2)}s ${begin(now, d, l.off)} infinite ease-in-out"/>`
    })
    .join('')

  const pulses = G.pulsing
    .map((p, i) => {
      const d = (3.2 + (i % 5) * 0.7) * pace
      return `<circle class="pl" cx="${n1(p.x)}" cy="${n1(p.y)}" r="8" fill="${p.hex}" fill-opacity=".18" stroke="${mix(p.hex, '#ffffff', 0.3)}" stroke-width="1.3" style="animation:${beat} ${d.toFixed(2)}s ${begin(now, d, i * 0.9)} infinite ease-in-out"/>`
    })
    .join('')

  const hubs = G.fans
    .map((f, i) => {
      const d = 4.6 * pace
      const x = n1(f.hub.x)
      const y = n1(f.hub.y)
      return `<circle cx="${x}" cy="${y}" r="16" fill="url(#hb)"/><circle class="pl" cx="${x}" cy="${y}" r="11" fill="none" stroke="${mix(f.hub.hex, '#ffffff', 0.4)}" stroke-width="1.2" style="animation:${beat} ${d.toFixed(2)}s ${begin(now, d, i * 0.6)} infinite ease-in-out"/><circle cx="${x}" cy="${y}" r="4" fill="${mix(f.hub.hex, '#ffffff', 0.7)}"/>`
    })
    .join('')

  return `${open()}<defs>
<linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0a1029"/><stop offset="1" stop-color="#060a1b"/></linearGradient>
<radialGradient id="amb" gradientUnits="userSpaceOnUse" cx="${(T.x0 + T.x1) / 2}" cy="${(T.y0 + T.y1) / 2}" r="640"><stop offset="0" stop-color="#121a3a" stop-opacity=".75"/><stop offset="1" stop-color="#121a3a" stop-opacity="0"/></radialGradient>
<radialGradient id="hb"><stop offset="0" stop-color="#ffffff" stop-opacity=".35"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></radialGradient>
<radialGradient id="g1"><stop offset="0" stop-color="#f79bc0" stop-opacity=".16"/><stop offset="1" stop-color="#f79bc0" stop-opacity="0"/></radialGradient>
<radialGradient id="g2"><stop offset="0" stop-color="#f6e27f" stop-opacity=".13"/><stop offset="1" stop-color="#f6e27f" stop-opacity="0"/></radialGradient>
</defs>
<style>.ln{stroke-dasharray:1 1;stroke-dashoffset:1;opacity:0}.pl{opacity:0;transform-box:fill-box;transform-origin:center}
@keyframes dr{0%{stroke-dashoffset:1;opacity:0}8%{opacity:.85}45%{stroke-dashoffset:0;opacity:.85}72%{stroke-dashoffset:0;opacity:.6}90%,100%{stroke-dashoffset:0;opacity:0}}
@keyframes db{0%{stroke-dashoffset:1;opacity:0}6%{opacity:1}40%{stroke-dashoffset:0;opacity:1}70%{stroke-dashoffset:0;opacity:.75}90%,100%{stroke-dashoffset:0;opacity:0}}
@keyframes pu{0%,100%{opacity:0;transform:scale(.5)}50%{opacity:.75;transform:scale(1.2)}}
@keyframes pb{0%,100%{opacity:0;transform:scale(.5)}50%{opacity:1;transform:scale(1.55)}}</style>
<rect width="${W}" height="${H}" fill="url(#bg)"/>
<rect width="${W}" height="${H}" fill="url(#amb)"/>
<circle cx="110" cy="470" r="300" fill="url(#g1)"/><circle cx="120" cy="1150" r="280" fill="url(#g2)"/>
<g stroke-width="1.25" stroke-opacity=".64" stroke-linecap="round">${G.cells}</g>
<g fill="none" stroke-width="1.1" stroke-opacity=".36" stroke-linecap="round">${statics}</g>
<g fill="none" stroke-width="1.4" stroke-linecap="round">${lines}</g>
${pulses}${hubs}</svg>`
}
