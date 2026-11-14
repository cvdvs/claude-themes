// Smoke: a soft purple smoke ribbon rising out of black up the right strip, brightest
// where it leaves the bottom edge, with a second glow pooling low under the sidebar.
// The ribbon undulates by morphing its outlines (SMIL on `d`, same commands in every frame) inside
// one blurred group. Blurred shapes use flat colors (Chrome draws blurred gradients with blocky
// seams); the fade toward the top comes from a gradient mask applied after the blur.
import { W, H, ZONES, rng, begin, open } from './kit'

type Pt = [number, number]

const RX0 = ZONES.right.x0
const MID = (ZONES.right.x0 + ZONES.right.x1) / 2 + 6 // ribbon axis, a touch right of the strip's middle
const Y0 = H + 70 // the ribbon starts below the bottom edge
const Y1 = 90 // and has thinned out by the top
const N = 14 // points per edge
const FRAMES = 6

const f = (n: number): string => n.toFixed(1)

// Static plume pooling low under the sidebar: outer haze, brighter inner lobe, hot corner.
const PLUME = [
  { d: 'M-90 1500L-90 780C20 720 170 820 196 990C214 1120 168 1236 236 1338C320 1430 560 1424 800 1500Z', c: '#5a14b4', o: 0.6 },
  { d: 'M-90 1500L-90 1060C10 1010 130 1070 150 1190C164 1286 214 1362 330 1404C430 1438 520 1446 620 1500Z', c: '#9d4cff', o: 0.72 },
  { d: 'M-90 1500L-90 1300C0 1270 120 1320 170 1400C200 1450 260 1480 300 1500Z', c: '#e2c4ff', o: 0.6 },
]

// Catmull-Rom through the points, as cubic Bézier segments (no leading M).
function curve(pts: Pt[]): string {
  let d = ''
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[Math.min(pts.length - 1, i + 2)]
    if (!p0 || !p1 || !p2 || !p3) continue
    const c1: Pt = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]
    const c2: Pt = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
    d += `C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(p2[0])} ${f(p2[1])}`
  }
  return d
}

// amp: sideways swing; width: half-width at the base; len: share of the full height it climbs.
type Wisp = { amp: number; width: number; len: number; shift: number; lean: number; waves: number }

// One frame of a ribbon outline: up the left edge, back down the right edge.
function outline(w: Wisp, phase: number, sway: number): string {
  const left: Pt[] = []
  const right: Pt[] = []
  for (let i = 0; i <= N; i++) {
    const u = i / N
    const t = w.len * u // height along the whole ribbon, so layers of one ribbon stay aligned
    const y = Y0 + (Y1 - Y0) * t
    const a = w.amp * (0.5 + 0.5 * t) // the curl grows as the smoke rises
    const x = MID + w.shift + w.lean * t + a * Math.sin(t * w.waves * Math.PI + phase) + sway * t * t
    const hw = w.width * (Math.pow(1 - u, 1.2) * 0.9 + 0.1)
    // The leading edge of each bend is fuller than the trailing one.
    const skew = 0.22 * Math.cos(t * w.waves * Math.PI + phase)
    left.push([x - hw * (1 + skew), y])
    right.push([x + hw * (1 - skew), y])
  }
  right.reverse()
  const l0 = left[0]
  const r0 = right[0]
  if (!l0 || !r0) return ''
  return `M${f(l0[0])} ${f(l0[1])}${curve(left)}L${f(r0[0])} ${f(r0[1])}${curve(right)}Z`
}

// A ribbon layer morphing through a loop of frames. The phase steps backward, so the bends travel
// upward like rising smoke. Layers built from the same seed share their bends.
function wisp(w: Wisp, color: string, opacity: number, dur: number, now: number, offset: number, seed: number): string {
  const rand = rng(seed)
  const base = rand() * Math.PI * 2
  const frames: string[] = []
  for (let k = 0; k < FRAMES; k++) {
    const phase = base - (k / FRAMES) * Math.PI * 2
    const sway = (rand() - 0.5) * 44
    frames.push(outline(w, phase, sway))
  }
  const first = frames[0] ?? ''
  frames.push(first)
  const times = frames.map((_, k) => (k / FRAMES).toFixed(3)).join(';')
  return `<path d="${first}" fill="${color}" opacity="${opacity}"><animate attributeName="d" values="${frames.join(';')}" keyTimes="${times}" dur="${dur}s" begin="${begin(now, dur, offset)}" repeatCount="indefinite"/></path>`
}

const stop = (o: number, c: string, a: number): string =>
  `<stop offset="${o}" stop-color="${c}" stop-opacity="${a}"/>`

export function smokeScene(isBusy: boolean, now: number): string {
  const morph = isBusy ? 9 : 20
  const breathe = isBusy ? 4 : 9
  const lift = isBusy ? 1 : 0.82

  const haze: Wisp = { amp: 52, width: 84, len: 1, shift: -4, lean: -6, waves: 2 }
  const main: Wisp = { amp: 60, width: 56, len: 1, shift: 0, lean: -8, waves: 2 }
  const side: Wisp = { amp: 70, width: 22, len: 0.92, shift: -12, lean: 16, waves: 2.4 }
  const glow: Wisp = { amp: 60, width: 42, len: 0.66, shift: 0, lean: -8, waves: 2 }
  const core: Wisp = { amp: 60, width: 22, len: 0.3, shift: 0, lean: -8, waves: 2 }

  const pool = (cx: number, cy: number, rx: number, ry: number, lo: number, hi: number, off: number): string =>
    `<ellipse class="br" cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#pool)" style="--lo:${(lo * lift).toFixed(2)};--hi:${(hi * lift).toFixed(2)};animation-delay:${begin(now, breathe * 2, off)}"/>`

  return `${open()}
<defs>
<radialGradient id="pool">${stop(0, '#c27bff', 0.9)}${stop(0.32, '#8e2cf0', 0.6)}${stop(0.68, '#46108f', 0.22)}${stop(1, '#2a0660', 0)}</radialGradient>
<radialGradient id="haze">${stop(0, '#4a14a0', 0.5)}${stop(0.6, '#26094f', 0.2)}${stop(1, '#12052a', 0)}</radialGradient>
<linearGradient id="fadeG" gradientUnits="userSpaceOnUse" x1="0" y1="${H}" x2="0" y2="0">${stop(0, '#ffffff', 1)}${stop(0.45, '#ffffff', 0.88)}${stop(0.8, '#ffffff', 0.45)}${stop(0.97, '#ffffff', 0)}</linearGradient>
<mask id="fade" maskUnits="userSpaceOnUse" x="${RX0 - 120}" y="0" width="${W - RX0 + 180}" height="${H}"><rect x="${RX0 - 120}" width="${W - RX0 + 180}" height="${H}" fill="url(#fadeG)"/></mask>
<filter id="soft" filterUnits="userSpaceOnUse" x="${RX0 - 120}" y="0" width="${W - RX0 + 180}" height="${H}"><feGaussianBlur stdDeviation="${isBusy ? 15 : 18}"/></filter>
<filter id="cloud" filterUnits="userSpaceOnUse" x="-120" y="560" width="1000" height="${H - 520}"><feGaussianBlur stdDeviation="40"/></filter>
</defs>
<style>
.br{animation:br ${breathe}s ease-in-out infinite alternate}
@keyframes br{from{opacity:var(--lo)}to{opacity:var(--hi)}}
</style>
<rect width="${W}" height="${H}" fill="#030106"/>
<ellipse cx="${W / 2}" cy="${H + 40}" rx="760" ry="140" fill="url(#haze)"/>
<g filter="url(#cloud)" opacity="${isBusy ? 1 : 0.88}">${PLUME.map(p => `<path d="${p.d}" fill="${p.c}" opacity="${p.o}"/>`).join('')}</g>
${pool(40, H - 10, 300, 290, 0.45, 0.85, 0)}
${pool(MID, H + 40, 200, 190, 0.5, 0.9, 5)}
<g mask="url(#fade)"><g filter="url(#soft)" opacity="${isBusy ? 1 : 0.92}">
${wisp(haze, '#5216b8', 0.55, morph * 1.15, now, 3, 29)}
${wisp(main, '#9636ff', 0.9, morph, now, 0, 17)}
${wisp(side, '#a978ff', 0.5, morph * 1.3, now, 7, 41)}
${wisp(glow, '#c493ff', 0.7, morph, now, 0, 17)}
${wisp(core, '#f3e6ff', 0.8, morph, now, 0, 17)}
</g></g>
</svg>`
}
