// Network: a note map on near-black. Lumpy hull blobs outline clusters, green
// starburst hubs fan fine colored lines out to their notes, and a few iridescent thumbnails are
// linked by white curves, over a faint dark botanical silhouette. Everything sits under the sidebar,
// in the right strip and along the top and bottom edges; the chat column only gets dim glow.

import { W, H, ZONES, rng, begin, open } from './kit'

type P = [number, number]

const n = (v: number): string => (Math.round(v * 10) / 10).toString()
const at = <T>(a: readonly T[], i: number): T => a[Math.max(0, Math.min(i, a.length - 1))]!

// A smooth curve through points (Catmull-Rom turned into cubic Béziers).
function smooth(pts: readonly P[]): string {
  const first = at(pts, 0)
  let d = `M${n(first[0])} ${n(first[1])}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = at(pts, i - 1)
    const p1 = at(pts, i)
    const p2 = at(pts, i + 1)
    const p3 = at(pts, i + 2)
    const c1: P = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]
    const c2: P = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
    d += `C${n(c1[0])} ${n(c1[1])} ${n(c2[0])} ${n(c2[1])} ${n(p2[0])} ${n(p2[1])}`
  }
  return d
}

// ---------------------------------------------------------------- the map

// Hull blobs: tubes through a cluster's notes (with side arms), lumpy where notes bunch up.
type Hull = { arms: P[][]; w: number; line: string; fill: string }
const BLUE = { line: '#6d86ff', fill: '#26306e' }
const PINK = { line: '#ff4fb3', fill: '#56194c' }
const GREEN = { line: '#6fe07a', fill: '#183d26' }
const VIOLET = { line: '#b07bff', fill: '#33215f' }

const HULLS: Hull[] = [
  // sidebar, upper: a thin tube hugging the left edge
  { arms: [[[14, 300], [44, 350], [28, 420], [60, 486], [38, 560]], [[28, 420], [-4, 452]]], w: 8, ...BLUE },
  // sidebar, lower cluster
  { arms: [[[40, 928], [90, 956], [110, 1006], [160, 1030], [198, 1076]], [[110, 1006], [76, 1040], [88, 1074]]], w: 11, ...PINK },
  { arms: [[[22, 1086], [68, 1112], [56, 1170], [106, 1200], [168, 1190], [214, 1238]], [[106, 1200], [122, 1250]], [[168, 1190], [204, 1150]]], w: 13, ...BLUE },
  { arms: [[[118, 1284], [150, 1318], [198, 1306], [230, 1350]], [[198, 1306], [238, 1288]]], w: 9, ...GREEN },
  { arms: [[[16, 1296], [52, 1330], [38, 1374]]], w: 10, ...VIOLET },
  // top edge, between the title and the icons
  { arms: [[[590, 26], [640, 46], [700, 34], [760, 52]], [[700, 34], [728, 8]]], w: 8, ...VIOLET },
  // bottom edge, under the input box
  { arms: [[[330, 1398], [390, 1388], [450, 1400], [520, 1390]]], w: 8, ...PINK },
  // right strip
  { arms: [[[1086, 214], [1112, 250], [1100, 292], [1132, 322]]], w: 9, ...VIOLET },
  { arms: [[[1250, 690], [1222, 726], [1238, 772]]], w: 9, ...GREEN },
  { arms: [[[1088, 1176], [1130, 1206], [1172, 1196], [1204, 1236], [1254, 1246]], [[1172, 1196], [1182, 1150]]], w: 11, ...PINK },
  { arms: [[[1096, 1292], [1140, 1270], [1186, 1300], [1234, 1288]]], w: 13, ...BLUE },
]

// Starburst hubs. Big ones fan out to many notes.
type Star = { x: number; y: number; r: number; k: number; big?: boolean }
const STARS: Star[] = [
  { x: 24, y: 236, r: 16, k: 11, big: true },
  { x: 214, y: 640, r: 12, k: 9 },
  { x: 222, y: 948, r: 20, k: 12, big: true },
  { x: 34, y: 1238, r: 14, k: 10 },
  { x: 190, y: 1140, r: 11, k: 9 },
  { x: 124, y: 1420, r: 28, k: 13, big: true },
  { x: 846, y: 34, r: 13, k: 10 },
  { x: 610, y: 1406, r: 18, k: 11 },
  { x: 1236, y: 300, r: 23, k: 12, big: true },
  { x: 1244, y: 720, r: 14, k: 10 },
  { x: 1080, y: 1240, r: 12, k: 9 },
  { x: 1222, y: 1166, r: 16, k: 10, big: true },
  { x: 1244, y: 1404, r: 20, k: 11 },
]

function starPath(r: number, k: number, seed: number): string {
  const rand = rng(seed)
  const pts: string[] = []
  for (let i = 0; i < k * 2; i++) {
    const a = (i * Math.PI) / k + (rand() - 0.5) * 0.18
    const rr = i % 2 === 0 ? r * (0.82 + rand() * 0.32) : r * (0.42 + rand() * 0.12)
    pts.push(`${n(Math.cos(a) * rr)} ${n(Math.sin(a) * rr)}`)
  }
  return `M${pts.join('L')}Z`
}

// Notes that sit on no hull, for the fans to reach.
const LOOSE: P[] = [
  [1092, 150], [1130, 196], [1150, 372], [1084, 520], [1166, 500], [1232, 470], [1090, 640],
  [1236, 960], [1086, 900], [1240, 1060], [1100, 1100],
  [140, 330], [96, 270], [150, 560], [120, 760], [70, 690], [236, 1010], [230, 880], [176, 820],
  [700, 70], [920, 58], [980, 24], [470, 1376], [700, 1394], [760, 1378],
]

// Ringed notes, like flagged pages.
const RINGS: Array<[number, number, string]> = [
  [125, 880, '#ff6a7a'], [236, 1010, '#ffa24f'], [1166, 500, '#b07bff'], [1232, 470, '#ff5fc1'],
  [62, 640, '#ffb067'], [1086, 900, '#ff6a7a'], [920, 58, '#4fd6d0'],
]

const HULL_NODES: P[] = HULLS.flatMap(h => h.arms.flatMap(a => a.slice(a === h.arms[0] ? 0 : 1)))

const LINE_COLORS = ['#ff5fc1', '#6f8dff', '#4fd6d0', '#ffb067', '#7be06a', '#b48cff', '#ff8f6b']

// A segment is allowed only if it never enters the text column.
function clear(a: P, b: P): boolean {
  const z = ZONES.text
  for (let t = 0; t <= 1; t += 0.02) {
    const x = a[0] + (b[0] - a[0]) * t
    const y = a[1] + (b[1] - a[1]) * t
    if (x > z.x0 - 4 && x < z.x1 + 4 && y > z.y0 - 4 && y < z.y1 + 4) return false
  }
  return true
}

// Fans: each hub reaches its nearest notes, the big hubs reach many, like a citation burst.
type Seg = { a: P; b: P; c: string }
const FANS: Seg[] = (() => {
  const rand = rng(41)
  const all = [...HULL_NODES, ...LOOSE]
  const out: Seg[] = []
  STARS.forEach((s, i) => {
    const reach = s.big === true ? 430 : 300
    const want = s.big === true ? 11 + Math.floor(rand() * 4) : 3 + Math.floor(rand() * 3)
    const hue = at(LINE_COLORS, i % LINE_COLORS.length)
    all
      .map(p => ({ p, d: Math.hypot(p[0] - s.x, p[1] - s.y) }))
      .filter(o => o.d > s.r + 8 && o.d < reach && clear([s.x, s.y], o.p))
      .sort((x, y) => x.d - y.d)
      .slice(0, want)
      .forEach(o => {
        // Big hubs keep mostly one color per fan, like the reference's bundles.
        const c = s.big === true && rand() < 0.65 ? hue : at(LINE_COLORS, Math.floor(rand() * LINE_COLORS.length))
        out.push({ a: [s.x, s.y], b: o.p, c })
      })
  })
  return out
})()

// ---------------------------------------------------------------- the thumbnails

// Iridescent thumbnails: center, size, variant.
type Thumb = { x: number; y: number; s: number; v: number }
const THUMBS: Thumb[] = [
  { x: 206, y: 152, s: 46, v: 0 },
  { x: 74, y: 846, s: 42, v: 1 },
  { x: 150, y: 1112, s: 48, v: 2 },
  { x: 1184, y: 92, s: 58, v: 3 },
  { x: 1108, y: 432, s: 44, v: 1 },
  { x: 1198, y: 604, s: 50, v: 0 },
  { x: 1120, y: 762, s: 56, v: 2 },
  { x: 1210, y: 856, s: 42, v: 3 },
  { x: 1150, y: 990, s: 48, v: 1 },
]
const thumb = (i: number): Thumb => at(THUMBS, i)

// White links: S-curves that leave and enter the thumbnails vertically.
type Link = { a: number; b: number; c1: P; c2: P }
function mk(i: number, j: number, bend = 0.55, sway = 0): Link {
  const a = thumb(i)
  const b = thumb(j)
  const k = Math.abs(b.y - a.y) * bend
  return { a: i, b: j, c1: [a.x + sway, a.y + k], c2: [b.x - sway, b.y - k] }
}
const LINKS: Link[] = [
  { a: 0, b: 3, c1: [420, 34], c2: [880, 30] }, // across the top edge, sidebar to right strip
  mk(0, 1, 0.5, -60),
  mk(1, 2, 0.6, 40),
  mk(3, 4, 0.62, -30),
  mk(3, 6, 0.58, -70),
  mk(4, 5, 0.6),
  mk(4, 8, 0.5, 30),
  mk(5, 7, 0.7),
  mk(6, 7, 0.4),
  mk(6, 8, 0.6),
]
function linkD(l: Link, move = true): string {
  const a = thumb(l.a)
  const b = thumb(l.b)
  return `${move ? `M${n(a.x)} ${n(a.y)}` : ''}C${n(l.c1[0])} ${n(l.c1[1])} ${n(l.c2[0])} ${n(l.c2[1])} ${n(b.x)} ${n(b.y)}`
}
// The busy dots ride chains of links end to end.
const ROUTES: number[][] = [[3, 5, 7], [0, 4, 9], [1, 2]]
const routeD = (ids: number[]): string => ids.map((id, i) => linkD(at(LINKS, id), i === 0)).join('')

// The marbled inside of a thumbnail (thermal-map style), drawn once in a 100 × 100 box.
const MARBLE = `<g id="wk-m">
<rect width="100" height="100" fill="url(#wk-ir)"/>
<path d="M-5-5H72C62 16 44 22 36 38S12 62-5 58Z" fill="#7ff0e8" stroke="#3436e8" stroke-width="2.5"/>
<path d="M105 38C82 44 70 60 76 78S62 100 54 105H105Z" fill="#ff8fdc" stroke="#3436e8" stroke-width="2.5"/>
<path d="M14 74C30 60 48 68 58 52S78 28 96 18" fill="none" stroke="#4436ff" stroke-width="8" stroke-linecap="round"/>
<path d="M14 74C30 60 48 68 58 52S78 28 96 18" fill="none" stroke="#b4c2ff" stroke-width="2.5" stroke-linecap="round"/>
<path d="M80 70C86 63 97 67 95 75S83 83 80 70Z" fill="#8ff6ee" stroke="#3436e8" stroke-width="2"/>
<path d="M18 16C26 10 36 14 32 22S20 26 18 16Z" fill="#ff9be0" stroke="#3436e8" stroke-width="2"/>
<path d="M30 92C36 84 48 86 46 94" fill="none" stroke="#ffe7a6" stroke-width="5" stroke-linecap="round"/>
<rect width="100" height="100" fill="url(#wk-sheen)"/>
<rect x="1.5" y="1.5" width="97" height="97" fill="none" stroke="#dff8ff" stroke-width="3"/>
</g>`
const VARIANTS = ['', 'rotate(90 50 50)', 'rotate(180 50 50)', 'translate(100 0) scale(-1 1)']

// ---------------------------------------------------------------- the silhouette

// Faint dark sprigs: a stem with leaves alternating along it.
function sprig(stem: P[], leaves: number, size: number, seed: number): string {
  const rand = rng(seed)
  let out = `<path d="${smooth(stem)}" fill="none" stroke="#211e30" stroke-width="3"/>`
  for (let i = 1; i <= leaves; i++) {
    const seg = (i / (leaves + 1)) * (stem.length - 1)
    const s0 = at(stem, Math.floor(seg))
    const s1 = at(stem, Math.floor(seg) + 1)
    const f = seg - Math.floor(seg)
    const x = s0[0] + (s1[0] - s0[0]) * f
    const y = s0[1] + (s1[1] - s0[1]) * f
    const dir = (Math.atan2(s1[1] - s0[1], s1[0] - s0[0]) * 180) / Math.PI
    const ang = dir + (i % 2 === 0 ? 1 : -1) * (40 + rand() * 30)
    const l = size * (0.7 + rand() * 0.6)
    const w = l * (0.42 + rand() * 0.16)
    out += `<path transform="translate(${n(x)} ${n(y)}) rotate(${n(ang)})" d="M0 0C${n(l * 0.3)} ${n(-w)} ${n(l * 0.8)} ${n(-w * 0.8)} ${n(l)} 0C${n(l * 0.8)} ${n(w * 0.8)} ${n(l * 0.3)} ${n(w)} 0 0Z"/>`
  }
  return out
}

const SILHOUETTE = [
  sprig([[1262, 150], [1210, 330], [1236, 520], [1150, 720], [1190, 930], [1098, 1140], [1130, 1330]], 26, 54, 7),
  sprig([[1262, 640], [1200, 760], [1226, 900], [1170, 1040]], 10, 42, 8),
  sprig([[1076, 230], [1120, 380], [1090, 520]], 7, 34, 9),
  sprig([[-10, 700], [60, 820], [30, 980], [110, 1150], [70, 1330], [140, 1420]], 20, 48, 10),
  sprig([[250, 760], [190, 880], [230, 1000]], 7, 34, 11),
].join('')

// ---------------------------------------------------------------- the scene

export function networkScene(isBusy: boolean, now: number): string {
  const rand = rng(77)

  // Static glow at the edges, so the art survives the frosted panels.
  const halos = STARS.map(s => `<circle cx="${s.x}" cy="${s.y}" r="${n(s.r * 1.5)}" fill="#7be06a"/>`).join('')
    + THUMBS.map(t => `<rect x="${n(t.x - t.s / 2 - 4)}" y="${n(t.y - t.s / 2 - 4)}" width="${t.s + 8}" height="${t.s + 8}" fill="#b7a4ff"/>`).join('')

  // Each hull: outline layer (wide stroke + bigger pockets), then the fill layer on top.
  const lumps = HULLS.map(h => h.arms.flat().map(p => ({ p, r: h.w * (0.5 + rand() * 0.7) })))
  const hullOut = HULLS.map((h, i) => {
    const arms = h.arms.map(a => `<path d="${smooth(a)}" fill="none" stroke-width="${h.w + 5}"/>`).join('')
    const pockets = (lumps[i] ?? []).map(o => `<circle cx="${o.p[0]}" cy="${o.p[1]}" r="${n(o.r + 2.6)}"/>`).join('')
    const dur = 11 + (i % 4) * 2
    return `<g class="wk-br" style="animation-duration:${dur}s;animation-delay:${begin(now, dur, i * 1.7)}" fill="${h.line}" stroke="${h.line}" stroke-linecap="round" stroke-linejoin="round">${arms}${pockets}</g>`
  }).join('')
  const hullIn = HULLS.map((h, i) => {
    const arms = h.arms.map(a => `<path d="${smooth(a)}" fill="none" stroke-width="${h.w}"/>`).join('')
    const pockets = (lumps[i] ?? []).map(o => `<circle cx="${o.p[0]}" cy="${o.p[1]}" r="${n(o.r)}"/>`).join('')
    return `<g fill="${h.fill}" stroke="${h.fill}" stroke-linecap="round" stroke-linejoin="round">${arms}${pockets}</g>`
  }).join('')

  const dots = [...HULL_NODES, ...LOOSE].map(p => `<circle cx="${p[0]}" cy="${p[1]}" r="2.3"/>`).join('')
  const rings = RINGS.map(([x, y, c]) => `<circle cx="${x}" cy="${y}" r="6" fill="#0d0b16" stroke="${c}" stroke-width="2.2"/><circle cx="${x}" cy="${y}" r="2" fill="#f2efff"/>`).join('')

  // Fine colored lines: most rest, some draw themselves out from their hub and back.
  let drawn = 0
  const lines = FANS.map((s, i) => {
    const d = `M${n(s.a[0])} ${n(s.a[1])}L${n(s.b[0])} ${n(s.b[1])}`
    if (i % 4 === 1 && drawn < 14) {
      drawn++
      const dur = 7 + (i % 5) * 1.3
      return `<path d="${d}" pathLength="1" class="wk-draw" stroke="${s.c}" style="animation-duration:${n(dur)}s;animation-delay:${begin(now, dur, i * 0.9)}"/>`
    }
    return `<path d="${d}" stroke="${s.c}"/>`
  }).join('')

  // Starbursts turning slowly, alternating direction.
  const stars = STARS.map((s, i) => {
    const dur = 46 + (i % 5) * 9
    const dir = i % 2 === 0 ? 360 : -360
    return `<g transform="translate(${s.x} ${s.y})"><g><animateTransform attributeName="transform" type="rotate" from="0" to="${dir}" dur="${dur}s" begin="${begin(now, dur, i * 3.1)}" repeatCount="indefinite"/>`
      + `<path d="${starPath(s.r, s.k, 300 + i)}" fill="url(#wk-star)" stroke="#2f6a2b" stroke-width="1.2"/></g>`
      + `<circle r="${n(s.r * 0.2)}" fill="#efffd8" opacity=".75"/></g>`
  }).join('')

  const thumbs = THUMBS.map(t => `<use href="#wk-t${t.v}" x="${n(t.x - t.s / 2)}" y="${n(t.y - t.s / 2)}" width="${t.s}" height="${t.s}"/>`).join('')
  const centers = THUMBS.map(t => `<circle cx="${t.x}" cy="${t.y}" r="3.4"/>`).join('')

  const links = LINKS.map(l => `<path d="${linkD(l)}"/>`).join('')
  const pulses = LINKS.map((l, i) => {
    const dur = 7 + (i % 4) * 1.6
    return `<path d="${linkD(l)}" pathLength="100" class="wk-pulse" style="animation-duration:${n(dur)}s;animation-delay:${begin(now, dur, i * 1.3)}"/>`
  }).join('')

  // While busy: a bright dot rides the curves from thumbnail to thumbnail.
  const travelers = isBusy
    ? ROUTES.map((ids, i) => {
        const dur = 8 + ids.length * 2.2
        return `<g><animateMotion path="${routeD(ids)}" dur="${n(dur)}s" begin="${begin(now, dur, i * 3)}" repeatCount="indefinite"/>`
          + `<circle r="13" fill="url(#wk-dot)"/><circle r="4" fill="#fff"/></g>`
      }).join('')
    : ''

  return `${open()}
<defs>
<linearGradient id="wk-ir" x1="0" y1="0" x2="1" y2="1">
<stop offset="0" stop-color="#7af2ea"/><stop offset=".45" stop-color="#8d7bff"/><stop offset="1" stop-color="#ff7fd4"/>
<animateTransform attributeName="gradientTransform" type="rotate" values="0 .5 .5;360 .5 .5" dur="24s" begin="${begin(now, 24)}" repeatCount="indefinite"/>
</linearGradient>
<linearGradient id="wk-sheen" x1="0" y1="0" x2="1" y2="1">
<stop offset=".35" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".5"/><stop offset=".65" stop-color="#fff" stop-opacity="0"/>
<animateTransform attributeName="gradientTransform" type="translate" values="-1.2 -1.2;1.2 1.2;1.2 1.2" keyTimes="0;.35;1" dur="9s" begin="${begin(now, 9, 2)}" repeatCount="indefinite"/>
</linearGradient>
<radialGradient id="wk-star"><stop offset="0" stop-color="#d9ff9e"/><stop offset=".55" stop-color="#7fd65a"/><stop offset="1" stop-color="#3f9a3a"/></radialGradient>
<radialGradient id="wk-dot"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset=".4" stop-color="#d8c8ff" stop-opacity=".45"/><stop offset="1" stop-color="#b48cff" stop-opacity="0"/></radialGradient>
<radialGradient id="wk-g1" cx="110" cy="1120" r="520" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#3a1c6e" stop-opacity=".55"/><stop offset="1" stop-color="#3a1c6e" stop-opacity="0"/></radialGradient>
<radialGradient id="wk-g2" cx="1180" cy="620" r="560" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#0f4a5c" stop-opacity=".5"/><stop offset="1" stop-color="#0f4a5c" stop-opacity="0"/></radialGradient>
<radialGradient id="wk-g3" cx="660" cy="720" r="620" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#1c1236" stop-opacity=".7"/><stop offset="1" stop-color="#1c1236" stop-opacity="0"/></radialGradient>
<radialGradient id="wk-g4" cx="1150" cy="80" r="380" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#4a1a4c" stop-opacity=".5"/><stop offset="1" stop-color="#4a1a4c" stop-opacity="0"/></radialGradient>
<filter id="wk-soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="9"/></filter>
<filter id="wk-leaf" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="2.5"/></filter>
<filter id="wk-glow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3.5"/></filter>
${MARBLE}
${VARIANTS.map((tr, i) => `<symbol id="wk-t${i}" viewBox="0 0 100 100"><use href="#wk-m"${tr ? ` transform="${tr}"` : ''}/></symbol>`).join('')}
</defs>
<style>
.wk-br{animation-name:wk-br;animation-timing-function:ease-in-out;animation-iteration-count:infinite}
@keyframes wk-br{0%,100%{opacity:.75}50%{opacity:1}}
.wk-draw{stroke-dasharray:1 1;animation-name:wk-draw;animation-timing-function:ease-in-out;animation-iteration-count:infinite}
@keyframes wk-draw{0%{stroke-dashoffset:1}35%{stroke-dashoffset:0}72%{stroke-dashoffset:0}100%{stroke-dashoffset:-1}}
.wk-pulse{fill:none;stroke:#fff;stroke-width:3;stroke-linecap:round;stroke-dasharray:8 92;animation-name:wk-run;animation-timing-function:linear;animation-iteration-count:infinite}
@keyframes wk-run{from{stroke-dashoffset:100}to{stroke-dashoffset:0}}
</style>
<rect width="${W}" height="${H}" fill="#07060c"/>
<rect width="${W}" height="${H}" fill="url(#wk-g3)"/>
<rect width="${W}" height="${H}" fill="url(#wk-g1)"/>
<rect width="${W}" height="${H}" fill="url(#wk-g2)"/>
<rect width="${W}" height="${H}" fill="url(#wk-g4)"/>
<g fill="#262238" filter="url(#wk-leaf)">${SILHOUETTE}</g>
<g filter="url(#wk-soft)" opacity="${isBusy ? 0.34 : 0.24}">${halos}</g>
<g fill="none" stroke="#d9d2ff" stroke-width="6" filter="url(#wk-glow)" opacity=".28">${links}</g>
<g fill="none" stroke="#a7a2c8" stroke-width="1.2" opacity=".45">
<rect x="-70" y="-70" width="140" height="140" transform="translate(100 1160) rotate(24) scale(1.62)"/>
<rect x="-70" y="-70" width="140" height="140" transform="translate(1196 1232) rotate(-18) scale(1.2)"/>
</g>
<g fill="none" stroke-width="1.5" stroke-linecap="round" opacity=".78">${lines}</g>
${hullOut}
${hullIn}
<g fill="#ece8ff" opacity=".9">${dots}</g>
${rings}
${stars}
${thumbs}
<g fill="none" stroke="#ece9f7" stroke-width="2.2" stroke-linecap="round" opacity=".62">${links}</g>
<g opacity="${isBusy ? 0.95 : 0.6}">${pulses}</g>
<g fill="#fff">${centers}</g>
${travelers}
</svg>`
}
