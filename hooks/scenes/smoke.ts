// Smoke: a soft purple smoke ribbon rising out of black up the right column of the
// window, brightest where it leaves the bottom edge. The smoke pools along the floor under the input
// box, gathers under the ceiling behind the header and trails off to the left there, and one thin
// thread rises in the narrow margin left of the cards. The text column stays black.
// The ribbons undulate by morphing their outlines (SMIL on `d`, same commands in every frame) inside
// blurred groups. Blurred shapes use flat colors (Chrome draws blurred gradients with blocky
// seams); the fades come from gradient masks applied after the blur.
import { W, H, begin, open, rng } from './kit'

type Pt = [number, number]

const MID = 1150 // ribbon axis: inside the right column, clear of most line ends
const FRAMES = 6

// Where a ribbon runs: from its wide base to its thin tip along one axis, centred on `axis` across
// it. `flip` lays it on its side (along x instead of y). `n` is the number of points per edge.
type Track = { from: number; to: number; axis: number; flip: boolean; n: number }
const RISE: Track = { from: H + 70, to: 90, axis: MID, flip: false, n: 14 }
const DRIFT: Track = { from: W + 60, to: 380, axis: 58, flip: true, n: 10 }
const THREAD: Track = { from: H + 30, to: 380, axis: 274, flip: false, n: 9 }

const f = (n: number): string => n.toFixed(1)

// Static smoke pooled on the floor (bottom right, spreading left under the input) and under the
// ceiling (top right, spreading left behind the header): outer haze, brighter lobe, hot core.
const FLOOR = [
  { d: 'M1340 1500L1340 860C1240 820 1110 900 1084 1030C1062 1146 1062 1214 980 1256C860 1316 600 1292 300 1346L260 1500Z', c: '#5a14b4', o: 0.6 },
  { d: 'M1340 1500L1340 1080C1250 1050 1150 1110 1130 1210C1110 1300 1000 1340 800 1362C640 1378 520 1404 420 1500Z', c: '#9d4cff', o: 0.72 },
  { d: 'M1340 1500L1340 1290C1270 1270 1190 1310 1160 1380C1140 1430 1080 1470 1000 1500Z', c: '#e2c4ff', o: 0.6 },
]
const CEILING = [
  { d: 'M1340 -80L1340 420C1270 396 1210 300 1130 210C1050 130 900 118 700 106C560 98 450 66 380 -80Z', c: '#46108f', o: 0.55 },
  { d: 'M1340 -80L1340 250C1260 226 1180 150 1060 100C960 64 830 56 720 -80Z', c: '#8a3cf0', o: 0.5 },
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

// amp: sideways swing; width: half-width at the base; len: share of the track it covers.
type Wisp = { amp: number; width: number; len: number; shift: number; lean: number; waves: number }

// One frame of a ribbon outline: out along one edge, back along the other.
function outline(tr: Track, w: Wisp, phase: number, sway: number): string {
  const left: Pt[] = []
  const right: Pt[] = []
  for (let i = 0; i <= tr.n; i++) {
    const u = i / tr.n
    const t = w.len * u // position along the whole track, so layers of one ribbon stay aligned
    const y = tr.from + (tr.to - tr.from) * t
    const a = w.amp * (0.5 + 0.5 * t) // the curl grows as the smoke travels
    const x = tr.axis + w.shift + w.lean * t + a * Math.sin(t * w.waves * Math.PI + phase) + sway * t * t
    const hw = w.width * (Math.pow(1 - u, 1.2) * 0.9 + 0.1)
    // The leading edge of each bend is fuller than the trailing one.
    const skew = 0.22 * Math.cos(t * w.waves * Math.PI + phase)
    const l: Pt = [x - hw * (1 + skew), y]
    const r: Pt = [x + hw * (1 - skew), y]
    left.push(tr.flip ? [l[1], l[0]] : l)
    right.push(tr.flip ? [r[1], r[0]] : r)
  }
  right.reverse()
  const l0 = left[0]
  const r0 = right[0]
  if (!l0 || !r0) return ''
  return `M${f(l0[0])} ${f(l0[1])}${curve(left)}L${f(r0[0])} ${f(r0[1])}${curve(right)}Z`
}

// A ribbon layer morphing through a loop of frames. The phase steps backward, so the bends travel
// from base to tip like drifting smoke. Layers built from the same seed share their bends.
function wisp(tr: Track, w: Wisp, color: string, opacity: number, dur: number, now: number, offset: number, seed: number, swing = 44): string {
  const rand = rng(seed)
  const base = rand() * Math.PI * 2
  const frames: string[] = []
  for (let k = 0; k < FRAMES; k++) {
    const phase = base - (k / FRAMES) * Math.PI * 2
    const sway = (rand() - 0.5) * swing
    frames.push(outline(tr, w, phase, sway))
  }
  const first = frames[0] ?? ''
  frames.push(first)
  const times = frames.map((_, k) => (k / FRAMES).toFixed(3)).join(';')
  return `<path d="${first}" fill="${color}" opacity="${opacity}"><animate attributeName="d" values="${frames.join(';')}" keyTimes="${times}" dur="${dur}s" begin="${begin(now, dur, offset)}" repeatCount="indefinite"/></path>`
}

const stop = (o: number, c: string, a: number): string =>
  `<stop offset="${o}" stop-color="${c}" stop-opacity="${a}"/>`

// A blur region and a matching mask region, in canvas units.
const region = (x: number, y: number, w: number, h: number): string =>
  `filterUnits="userSpaceOnUse" x="${x}" y="${y}" width="${w}" height="${h}"`

export function smokeScene(isBusy: boolean, now: number): string {
  const morph = isBusy ? 9 : 20
  const breathe = isBusy ? 4 : 9
  const lift = isBusy ? 1 : 0.82

  const haze: Wisp = { amp: 60, width: 96, len: 1, shift: -6, lean: -6, waves: 2 }
  const main: Wisp = { amp: 66, width: 60, len: 1, shift: 0, lean: -10, waves: 2 }
  const side: Wisp = { amp: 74, width: 24, len: 0.92, shift: -14, lean: 18, waves: 2.4 }
  const glow: Wisp = { amp: 66, width: 44, len: 0.66, shift: 0, lean: -10, waves: 2 }
  const core: Wisp = { amp: 66, width: 22, len: 0.3, shift: 0, lean: -10, waves: 2 }
  // Under the ceiling: drifts left from the top of the column, thinning out behind the header.
  const roof: Wisp = { amp: 34, width: 26, len: 1, shift: 0, lean: 6, waves: 2.2 }
  const roofCore: Wisp = { amp: 34, width: 10, len: 0.6, shift: 0, lean: 6, waves: 2.2 }
  // The thread in the margin: barely sways, so it stays in the 36 px gap.
  const thread: Wisp = { amp: 7, width: 10, len: 1, shift: 0, lean: 0, waves: 2.6 }

  const pool = (cx: number, cy: number, rx: number, ry: number, lo: number, hi: number, off: number): string =>
    `<ellipse class="br" cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#pool)" style="--lo:${(lo * lift).toFixed(2)};--hi:${(hi * lift).toFixed(2)};animation-delay:${begin(now, breathe * 2, off)}"/>`

  return `${open()}
<defs>
<radialGradient id="pool">${stop(0, '#c27bff', 0.9)}${stop(0.32, '#8e2cf0', 0.6)}${stop(0.68, '#46108f', 0.22)}${stop(1, '#2a0660', 0)}</radialGradient>
<radialGradient id="haze">${stop(0, '#4a14a0', 0.5)}${stop(0.6, '#26094f', 0.2)}${stop(1, '#12052a', 0)}</radialGradient>
<linearGradient id="fadeG" gradientUnits="userSpaceOnUse" x1="0" y1="${H}" x2="0" y2="0">${stop(0, '#ffffff', 1)}${stop(0.45, '#ffffff', 0.9)}${stop(0.8, '#ffffff', 0.55)}${stop(1, '#ffffff', 0.3)}</linearGradient>
<linearGradient id="fadeTG" gradientUnits="userSpaceOnUse" x1="0" y1="${H}" x2="0" y2="0">${stop(0, '#ffffff', 1)}${stop(0.3, '#ffffff', 0.8)}${stop(0.68, '#ffffff', 0)}</linearGradient>
<linearGradient id="fadeLG" gradientUnits="userSpaceOnUse" x1="${W}" y1="0" x2="360" y2="0">${stop(0, '#ffffff', 1)}${stop(0.5, '#ffffff', 0.6)}${stop(1, '#ffffff', 0)}</linearGradient>
<mask id="fade" maskUnits="userSpaceOnUse" x="900" y="0" width="${W - 900}" height="${H}"><rect x="900" width="${W - 900}" height="${H}" fill="url(#fadeG)"/></mask>
<mask id="fadeT" maskUnits="userSpaceOnUse" x="236" y="0" width="76" height="${H}"><rect x="236" width="76" height="${H}" fill="url(#fadeTG)"/></mask>
<mask id="fadeL" maskUnits="userSpaceOnUse" x="300" y="0" width="${W - 300}" height="240"><rect x="300" width="${W - 300}" height="240" fill="url(#fadeLG)"/></mask>
<filter id="soft" ${region(900, 0, W - 900, H)}><feGaussianBlur stdDeviation="${isBusy ? 15 : 18}"/></filter>
<filter id="softT" ${region(300, 0, W - 300, 240)}><feGaussianBlur stdDeviation="${isBusy ? 9 : 11}"/></filter>
<filter id="hair" ${region(236, 0, 76, H)}><feGaussianBlur stdDeviation="5"/></filter>
<filter id="cloud" ${region(160, 640, W - 60, H - 600)}><feGaussianBlur stdDeviation="40"/></filter>
<filter id="cloudT" ${region(240, -120, W - 140, 600)}><feGaussianBlur stdDeviation="40"/></filter>
</defs>
<style>
.br{animation:br ${breathe}s ease-in-out infinite alternate}
@keyframes br{from{opacity:var(--lo)}to{opacity:var(--hi)}}
</style>
<rect width="${W}" height="${H}" fill="#030106"/>
<ellipse cx="780" cy="${H + 40}" rx="700" ry="150" fill="url(#haze)"/>
${pool(-40, 1160, 290, 520, 0.18, 0.32, 3)}
<g filter="url(#cloud)" opacity="${isBusy ? 1 : 0.88}">${FLOOR.map(p => `<path d="${p.d}" fill="${p.c}" opacity="${p.o}"/>`).join('')}</g>
<g filter="url(#cloudT)" opacity="${isBusy ? 0.95 : 0.8}">${CEILING.map(p => `<path d="${p.d}" fill="${p.c}" opacity="${p.o}"/>`).join('')}</g>
${pool(MID, H + 40, 220, 200, 0.5, 0.9, 5)}
<g mask="url(#fade)"><g filter="url(#soft)" opacity="${isBusy ? 1 : 0.92}">
${wisp(RISE, haze, '#5216b8', 0.55, morph * 1.15, now, 3, 29)}
${wisp(RISE, main, '#9636ff', 0.9, morph, now, 0, 17)}
${wisp(RISE, side, '#a978ff', 0.5, morph * 1.3, now, 7, 41)}
${wisp(RISE, glow, '#c493ff', 0.7, morph, now, 0, 17)}
${wisp(RISE, core, '#f3e6ff', 0.8, morph, now, 0, 17)}
</g></g>
<g mask="url(#fadeL)"><g filter="url(#softT)" opacity="${isBusy ? 1 : 0.9}">
${wisp(DRIFT, roof, '#8a3cf0', 0.75, morph * 1.4, now, 4, 53, 30)}
${wisp(DRIFT, roofCore, '#d2b0ff', 0.6, morph * 1.4, now, 4, 53, 30)}
</g></g>
<g mask="url(#fadeT)"><g filter="url(#hair)" opacity="${isBusy ? 1 : 0.85}">
${wisp(THREAD, thread, '#b78cff', 0.9, morph * 1.6, now, 9, 67, 8)}
</g></g>
</svg>`
}
