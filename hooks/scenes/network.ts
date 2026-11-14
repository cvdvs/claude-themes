// Network: a note map on near-black. Lumpy hull blobs outline clusters, green
// starburst hubs fan fine colored lines out to their notes, and a few iridescent thumbnails are
// linked by white curves, over a faint dark botanical silhouette. The map is a column down the right
// edge, framed by a band along the top (between the chat title and the icons) and a band along the
// bottom (around the input box), with one thin thread of notes down the margin left of the replies.
// The sidebar and the reply text only get dim glow.

import { W, H, rng, begin, open } from './kit'

type P = [number, number]

const n = (v: number): string => (Math.round(v * 10) / 10).toString()
const at = <T>(a: readonly T[], i: number): T => a[Math.max(0, Math.min(i, a.length - 1))]!

// The app window: the sidebar is drawn almost solid up to x 256, reply text runs from x 310 to
// about x 1000 between the header (y 0–50) and the bottom band (y 1236 down, input box included).
const SIDE = 256
const TEXT = { x0: 298, x1: 1000, y0: 58, y1: 1236 }
// The input box, where the fine lines would sit behind the placeholder text.
const INPUT = { x0: 270, x1: 1000, y0: 1316, y1: 1364 }

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
  // top band, between the chat title and the icons
  { arms: [[[690, 22], [740, 40], [800, 24], [858, 42]], [[800, 24], [826, 6]]], w: 8, ...VIOLET },
  // right column, top to bottom
  { arms: [[[1128, 196], [1154, 232], [1140, 274], [1172, 306]], [[1154, 232], [1186, 214]]], w: 9, ...VIOLET },
  { arms: [[[1252, 560], [1222, 596], [1240, 642]]], w: 9, ...GREEN },
  { arms: [[[1018, 760], [1050, 792], [1040, 836], [1074, 866]], [[1050, 792], [1084, 770]]], w: 10, ...PINK },
  { arms: [[[1160, 920], [1196, 946], [1180, 990], [1226, 1012], [1256, 1000]]], w: 11, ...BLUE },
  // the main cluster, where the column meets the bottom band
  { arms: [[[1052, 1212], [1098, 1236], [1146, 1220], [1186, 1258], [1254, 1262]], [[1146, 1220], [1158, 1178]], [[1098, 1236], [1090, 1282]]], w: 12, ...PINK },
  { arms: [[[1090, 1388], [1138, 1368], [1186, 1396], [1238, 1380]], [[1186, 1396], [1206, 1420]]], w: 13, ...BLUE },
  // bottom band, around the input box
  { arms: [[[556, 1262], [606, 1282], [656, 1266], [700, 1290]], [[606, 1282], [618, 1306]]], w: 9, ...GREEN },
  { arms: [[[330, 1398], [390, 1388], [450, 1400], [520, 1390]]], w: 8, ...PINK },
  { arms: [[[900, 1396], [950, 1384], [1004, 1400]]], w: 8, ...VIOLET },
  // the thin thread in the left margin
  { arms: [[[270, 420], [282, 468], [268, 518], [280, 566]]], w: 6, ...BLUE },
  { arms: [[[282, 944], [268, 994], [280, 1050]]], w: 6, ...PINK },
]

// Starburst hubs. Big ones fan out to many notes.
type Star = { x: number; y: number; r: number; k: number; big?: boolean }
const STARS: Star[] = [
  { x: 1236, y: 300, r: 23, k: 12, big: true },
  { x: 1032, y: 470, r: 12, k: 9 },
  { x: 1244, y: 720, r: 14, k: 10 },
  { x: 1238, y: 1084, r: 19, k: 11, big: true },
  { x: 1046, y: 1134, r: 11, k: 9 },
  { x: 1240, y: 1402, r: 22, k: 12, big: true },
  { x: 940, y: 28, r: 14, k: 10 },
  { x: 612, y: 1404, r: 18, k: 11 },
  { x: 762, y: 1252, r: 12, k: 9 },
  { x: 418, y: 1268, r: 15, k: 10, big: true },
  { x: 276, y: 66, r: 9, k: 8 },
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

// The thread of notes down the left margin, from the top star to the bottom-left thumbnail.
const THREAD: P[] = [[276, 66], [280, 150], [272, 260], [278, 380], [274, 520], [282, 660], [270, 800], [278, 940], [272, 1080], [284, 1190], [300, 1284]]

// Notes that sit on no hull, for the fans to reach.
const LOOSE: P[] = [
  // right column
  [1062, 150], [1120, 168], [1150, 372], [1040, 556], [1166, 540], [1232, 420], [1072, 612],
  [1238, 960], [1080, 906], [1240, 1180], [1110, 1100], [1026, 1006], [1170, 760], [1020, 330],
  // top band
  [660, 48], [880, 52], [990, 14], [760, 8], [1010, 48],
  // bottom band
  [470, 1376], [700, 1394], [780, 1380], [540, 1250], [680, 1244], [960, 1262], [1010, 1302],
  [372, 1250], [840, 1400],
  // margin thread
  ...THREAD.slice(1, -1),
]

// Ringed notes, like flagged pages.
const RINGS: Array<[number, number, string]> = [
  [1150, 372, '#ff6a7a'], [1166, 540, '#b07bff'], [1232, 420, '#ff5fc1'], [1080, 906, '#ff6a7a'],
  [880, 52, '#4fd6d0'], [700, 1394, '#ffa24f'], [278, 380, '#ffb067'], [270, 800, '#4fd6d0'],
]

const HULL_NODES: P[] = HULLS.flatMap(h => h.arms.flatMap(a => a.slice(a === h.arms[0] ? 0 : 1)))

const LINE_COLORS = ['#ff5fc1', '#6f8dff', '#4fd6d0', '#ffb067', '#7be06a', '#b48cff', '#ff8f6b']

// A segment is allowed only if it stays out of the sidebar and out from behind the text.
function clear(a: P, b: P): boolean {
  for (let t = 0; t <= 1; t += 0.02) {
    const x = a[0] + (b[0] - a[0]) * t
    const y = a[1] + (b[1] - a[1]) * t
    if (x < SIDE + 6) return false
    if (x > TEXT.x0 - 4 && x < TEXT.x1 + 4 && y > TEXT.y0 - 4 && y < TEXT.y1 + 4) return false
    if (x > INPUT.x0 && x < INPUT.x1 && y > INPUT.y0 && y < INPUT.y1) return false
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

// Iridescent thumbnails: center, size, variant. A zigzag down the right column, one in each band.
type Thumb = { x: number; y: number; s: number; v: number }
const THUMBS: Thumb[] = [
  { x: 1192, y: 104, s: 56, v: 3 },
  { x: 1088, y: 300, s: 44, v: 1 },
  { x: 1206, y: 470, s: 50, v: 0 },
  { x: 1100, y: 664, s: 54, v: 2 },
  { x: 1214, y: 836, s: 44, v: 3 },
  { x: 1092, y: 1004, s: 48, v: 1 },
  { x: 1200, y: 1160, s: 52, v: 0 },
  { x: 862, y: 1284, s: 40, v: 2 },
  { x: 604, y: 28, s: 36, v: 1 },
  { x: 300, y: 1284, s: 36, v: 3 },
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
  { a: 8, b: 0, c1: [800, 50], c2: [1070, 26] }, // along the top band into the column
  mk(0, 1, 0.6, -40),
  mk(1, 2, 0.6, 30),
  mk(2, 3, 0.58, -30),
  mk(3, 4, 0.6, 30),
  mk(4, 5, 0.6, -30),
  mk(5, 6, 0.55, 30),
  { a: 6, b: 7, c1: [1196, 1262], c2: [990, 1302] }, // out of the column into the bottom band
  { a: 7, b: 9, c1: [700, 1252], c2: [450, 1310] }, // along the bottom band to the margin
  mk(1, 3, 0.5, -60),
  mk(2, 4, 0.5, 40),
]
function linkD(l: Link, move = true): string {
  const a = thumb(l.a)
  const b = thumb(l.b)
  return `${move ? `M${n(a.x)} ${n(a.y)}` : ''}C${n(l.c1[0])} ${n(l.c1[1])} ${n(l.c2[0])} ${n(l.c2[1])} ${n(b.x)} ${n(b.y)}`
}
// The busy dots ride chains of links end to end.
const ROUTES: number[][] = [[0, 1, 2, 3], [4, 5, 6, 7, 8], [10, 5, 6]]
const routeD = (ids: number[]): string => ids.map((id, i) => linkD(at(LINKS, id), i === 0)).join('')

// The thread is drawn upward, from the bottom-left thumbnail to the star at the top of the margin.
const THREAD_D = smooth([...THREAD].reverse())

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
  // down the right column
  sprig([[1262, 150], [1210, 330], [1236, 520], [1150, 720], [1190, 930], [1098, 1140], [1130, 1330]], 26, 54, 7),
  sprig([[1262, 640], [1200, 760], [1226, 900], [1170, 1040]], 10, 42, 8),
  sprig([[1076, 230], [1120, 380], [1090, 520]], 7, 34, 9),
  // along the bottom band and the top band
  sprig([[262, 1424], [410, 1372], [570, 1404], [730, 1364], [900, 1414], [1040, 1380]], 16, 40, 10),
  sprig([[480, -16], [630, 20], [790, -4], [930, 22], [1060, -8]], 11, 28, 11),
].join('')

// ---------------------------------------------------------------- the scene

export function networkScene(isBusy: boolean, now: number): string {
  const rand = rng(77)

  // Static glow behind the hubs and thumbnails, so the art survives the frosted panels.
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
  const thread = `<path d="${THREAD_D}" stroke-width="1.4"/>`
  const pulses = LINKS.map((l, i) => {
    const dur = 7 + (i % 4) * 1.6
    return `<path d="${linkD(l)}" pathLength="100" class="wk-pulse" style="animation-duration:${n(dur)}s;animation-delay:${begin(now, dur, i * 1.3)}"/>`
  }).join('')
    + `<path d="${THREAD_D}" pathLength="100" class="wk-pulse" style="stroke-width:2;animation-duration:16s;animation-delay:${begin(now, 16, 5)}"/>`

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
<radialGradient id="wk-g1" cx="560" cy="1460" r="620" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#3a1c6e" stop-opacity=".6"/><stop offset="1" stop-color="#3a1c6e" stop-opacity="0"/></radialGradient>
<radialGradient id="wk-g2" cx="1190" cy="660" r="600" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#0f4a5c" stop-opacity=".55"/><stop offset="1" stop-color="#0f4a5c" stop-opacity="0"/></radialGradient>
<radialGradient id="wk-g3" cx="660" cy="720" r="620" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#1c1236" stop-opacity=".7"/><stop offset="1" stop-color="#1c1236" stop-opacity="0"/></radialGradient>
<radialGradient id="wk-g4" cx="1060" cy="20" r="460" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#4a1a4c" stop-opacity=".5"/><stop offset="1" stop-color="#4a1a4c" stop-opacity="0"/></radialGradient>
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
<g fill="none" stroke="#d9d2ff" stroke-width="6" filter="url(#wk-glow)" opacity=".28">${links}${thread}</g>
<g fill="none" stroke="#a7a2c8" stroke-width="1.2" opacity=".45">
<rect x="-70" y="-70" width="140" height="140" transform="translate(1150 560) rotate(24)"/>
<rect x="-70" y="-70" width="140" height="140" transform="translate(1180 1236) rotate(-18) scale(1.3)"/>
</g>
<g fill="none" stroke-width="1.5" stroke-linecap="round" opacity=".78">${lines}</g>
${hullOut}
${hullIn}
<g fill="#ece8ff" opacity=".9">${dots}</g>
${rings}
${stars}
${thumbs}
<g fill="none" stroke="#ece9f7" stroke-width="2.2" stroke-linecap="round" opacity=".62">${links}${thread}</g>
<g opacity="${isBusy ? 0.95 : 0.6}">${pulses}</g>
<g fill="#fff">${centers}</g>
${travelers}
</svg>`
}
