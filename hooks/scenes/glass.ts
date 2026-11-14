// Glass: cozy and playful on deep blue-black.
// Soft circles drift with yellow, blue and violet motion trails around the edges, a stack of big
// pale lavender orbs rests at the foot of the sidebar, and the right strip is a column of frosted
// glass bricks lit from behind by a breathing purple glow. The chat column only gets dim glow.

import { W, H, ZONES, rng, begin, open } from './kit'

const n = (v: number): string => (Math.round(v * 10) / 10).toString()

// ---------------------------------------------------------------- the drifting orbs

// Core colors (light, edge), trail colors (tail, head) and the rim that peeks out behind the core.
type Kind = 'sky' | 'plum' | 'lilac'
const KINDS: Record<Kind, { core: [string, string]; trail: [string, string]; rim: string }> = {
  sky: { core: ['#e2ebff', '#a7bdf3'], trail: ['#e8ef3a', '#f4f75c'], rim: '#f1f450' },
  plum: { core: ['#d066dc', '#8a2894'], trail: ['#6f8ff2', '#a65ae6'], rim: '#9a6cf0' },
  lilac: { core: ['#f0eaff', '#c0b3f5'], trail: ['#6f8ff2', '#9fb4ff'], rim: '#8fa6ff' },
}

// Center, radius, heading in degrees (0 = right, -90 = up), trail length, drift, seconds.
// A ghost is a smear with no core, like a circle that moved too fast to see.
// Orbs in the right strip pass behind the glass bricks unless marked front.
type Orb = { x: number; y: number; r: number; a: number; l: number; d: number; t: number; k: Kind; ghost?: boolean; front?: boolean }
const ORBS: Orb[] = [
  // under the sidebar
  { x: 84, y: 196, r: 42, a: -100, l: 150, d: 44, t: 26, k: 'sky' },
  { x: 196, y: 452, r: 26, a: -62, l: 96, d: 36, t: 21, k: 'plum' },
  { x: -18, y: 664, r: 70, a: -95, l: 190, d: 40, t: 33, k: 'sky' },
  { x: 150, y: 560, r: 30, a: -112, l: 90, d: 30, t: 28, k: 'sky', ghost: true },
  { x: 160, y: 836, r: 34, a: -122, l: 110, d: 38, t: 24, k: 'lilac' },
  { x: 212, y: 1336, r: 26, a: -76, l: 80, d: 30, t: 19, k: 'plum' },
  // along the top edge
  { x: 520, y: -14, r: 50, a: -100, l: 96, d: 30, t: 29, k: 'sky' },
  { x: 900, y: 62, r: 22, a: 172, l: 110, d: 40, t: 23, k: 'lilac' },
  { x: 700, y: 40, r: 26, a: 160, l: 60, d: 26, t: 27, k: 'plum', ghost: true },
  // along the bottom edge
  { x: 432, y: 1438, r: 68, a: -82, l: 100, d: 30, t: 31, k: 'sky' },
  { x: 800, y: 1392, r: 24, a: 188, l: 120, d: 44, t: 22, k: 'plum' },
  { x: 620, y: 1416, r: 34, a: -70, l: 70, d: 24, t: 25, k: 'sky', ghost: true },
  // in the right strip, among the bricks
  { x: 1150, y: 232, r: 38, a: -100, l: 140, d: 40, t: 27, k: 'sky' },
  { x: 1252, y: 1000, r: 62, a: -110, l: 170, d: 36, t: 34, k: 'plum', front: true },
  { x: 1136, y: 1226, r: 28, a: -70, l: 84, d: 34, t: 20, k: 'lilac' },
]

// Big soft pale orbs stacked at the foot of the sidebar, bobbing slowly: x, y, radius, seconds.
const STACK: Array<[number, number, number, number]> = [
  [44, 1004, 106, 30],
  [178, 1150, 68, 25],
  [24, 1294, 114, 36],
]

function orb(o: Orb, i: number, now: number, streak = false): string {
  const k = KINDS[o.k]
  const r = o.r
  // The trail: a long soft smear reaching back from the core, brightest near the head, plus a
  // shorter halo of the head color hugging the core.
  const trail = `<ellipse cx="${n(-o.l * 0.5)}" rx="${n(o.l * 0.5 + r * 0.9)}" ry="${n(r * 1.18)}" fill="url(#ps-tl-${o.k})"/>`
    + `<ellipse cx="${n(-r * 0.4)}" rx="${n(r * 1.4)}" ry="${n(r * 1.22)}" fill="url(#ps-th-${o.k})"/>`
  const rim = o.ghost === true ? '' : `<circle cx="${n(-r * 0.13)}" cy="${n(-r * 0.07)}" r="${n(r * 1.03)}" fill="${k.rim}" opacity=".9"/>`
  const core = o.ghost === true ? '' : `<circle r="${r}" fill="url(#ps-c-${o.k})"/>`
  const b = begin(now, o.t, i * 2.3)
  // Idle orbs sway gently along their heading; busy streaks fly forward and fade.
  const motion = streak
    ? `<animateTransform attributeName="transform" type="translate" values="0 0;${o.d} 0" dur="${o.t}s" begin="${b}" repeatCount="indefinite"/>`
      + `<animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.8;1" dur="${o.t}s" begin="${b}" repeatCount="indefinite"/>`
    : `<animateTransform attributeName="transform" type="translate" values="${n(-o.d / 2)} 0;${n(o.d / 2)} ${n(o.d * 0.18)};${n(-o.d / 2)} 0" keyTimes="0;.5;1" calcMode="spline" keySplines=".45 0 .55 1;.45 0 .55 1" dur="${o.t}s" begin="${b}" repeatCount="indefinite"/>`
  // Orbs under the sidebar's list of chats are a touch dimmer, so the list stays easy to read.
  const dim = o.ghost === true ? 0.7 : o.x < ZONES.sidebar.x1 && o.y < 830 ? 0.8 : 1
  return `<g transform="translate(${o.x} ${o.y}) rotate(${o.a})"${dim < 1 ? ` opacity="${dim}"` : ''}><g>${motion}${trail}${rim}${core}</g></g>`
}

// Quick little streaks that only fly while the assistant is busy.
const STREAKS: Orb[] = [
  { x: 120, y: 1000, r: 14, a: -88, l: 64, d: 580, t: 7, k: 'sky' },
  { x: 1010, y: 110, r: 12, a: 180, l: 60, d: 380, t: 6, k: 'lilac' },
  { x: 290, y: 1394, r: 13, a: 0, l: 60, d: 520, t: 8, k: 'plum' },
]

// ---------------------------------------------------------------- the glass bricks

const STRIP = ZONES.right.x0 + 6 // first brick column starts just inside the free strip
const PITCH = 86
const BRICK = 78

// A few bricks catch the light now and then: column, row.
const GLINTS: Array<[number, number]> = [[0, 3], [1, 6], [0, 9], [1, 12], [0, 14]]

// ---------------------------------------------------------------- the scene

export function glassScene(isBusy: boolean, now: number): string {
  const rand = rng(9)

  const stack = STACK.map(([x, y, r, t], i) => {
    const dy = 10 + rand() * 8
    return `<g transform="translate(${x} ${y})"><g><animateTransform attributeName="transform" type="translate" values="0 ${n(-dy)};0 ${n(dy)};0 ${n(-dy)}" keyTimes="0;.5;1" calcMode="spline" keySplines=".45 0 .55 1;.45 0 .55 1" dur="${t}s" begin="${begin(now, t, i * 5)}" repeatCount="indefinite"/>`
      + `<circle r="${r}" fill="url(#ps-pale)"/></g></g>`
  }).join('')

  const isBehind = (o: Orb): boolean => o.x > ZONES.right.x0 && o.front !== true
  const behind = ORBS.map((o, i) => (isBehind(o) ? orb(o, i, now) : '')).join('')
  const orbs = ORBS.map((o, i) => (isBehind(o) ? '' : orb(o, i, now))).join('')
  const streaks = isBusy ? STREAKS.map((o, i) => orb(o, i + 20, now, true)).join('') : ''

  const glints = GLINTS.map(([c, r], i) => {
    const dur = 9 + i * 1.7
    return `<rect x="${STRIP + c * PITCH + 4}" y="${r * PITCH - 40 + 4}" width="${BRICK}" height="${BRICK}" rx="8" fill="url(#ps-glint)" class="ps-gl" style="animation-duration:${n(dur)}s;animation-delay:${begin(now, dur, i * 2.9)}"/>`
  }).join('')

  // While busy, a band of light slides down behind the bricks.
  const sweep = isBusy
    ? `<rect x="${STRIP}" y="-320" width="${W - STRIP}" height="320" fill="url(#ps-sweep)"><animateTransform attributeName="transform" type="translate" values="0 0;0 ${H + 320}" dur="7s" begin="${begin(now, 7)}" repeatCount="indefinite"/></rect>`
    : ''

  const grads = (Object.keys(KINDS) as Kind[]).map(id => {
    const k = KINDS[id]
    return `<radialGradient id="ps-tl-${id}" fx=".8"><stop offset="0" stop-color="${k.trail[0]}" stop-opacity=".95"/><stop offset=".4" stop-color="${k.trail[0]}" stop-opacity=".72"/><stop offset=".75" stop-color="${k.trail[0]}" stop-opacity=".3"/><stop offset="1" stop-color="${k.trail[0]}" stop-opacity="0"/></radialGradient>`
      + `<radialGradient id="ps-th-${id}"><stop offset="0" stop-color="${k.trail[1]}" stop-opacity=".95"/><stop offset=".55" stop-color="${k.trail[1]}" stop-opacity=".62"/><stop offset="1" stop-color="${k.trail[1]}" stop-opacity="0"/></radialGradient>`
      + `<radialGradient id="ps-c-${id}" cx=".42" cy=".4" r=".6"><stop offset="0" stop-color="${k.core[0]}"/><stop offset=".74" stop-color="${k.core[1]}"/><stop offset=".86" stop-color="${k.core[1]}" stop-opacity=".9"/><stop offset="1" stop-color="${k.core[1]}" stop-opacity="0"/></radialGradient>`
  }).join('')

  return `${open()}
<defs>
${grads}
<radialGradient id="ps-pale" cx=".45" cy=".42" r=".55"><stop offset="0" stop-color="#e6e4ff" stop-opacity=".84"/><stop offset=".6" stop-color="#a3a9f2" stop-opacity=".64"/><stop offset=".86" stop-color="#727de0" stop-opacity=".3"/><stop offset="1" stop-color="#727de0" stop-opacity="0"/></radialGradient>
<radialGradient id="ps-glow" cx="1190" cy="690" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(1190 690) scale(175 560) translate(-1190 -690)"><stop offset="0" stop-color="#c86cff"/><stop offset=".4" stop-color="#9a3cff" stop-opacity=".95"/><stop offset=".75" stop-color="#6224c8" stop-opacity=".45"/><stop offset="1" stop-color="#3a1580" stop-opacity="0"/></radialGradient>
<radialGradient id="ps-hot" cx="1186" cy="430" r="175" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#f3e6ff" stop-opacity=".95"/><stop offset=".45" stop-color="#d4a8ff" stop-opacity=".6"/><stop offset="1" stop-color="#b07cff" stop-opacity="0"/></radialGradient>
<radialGradient id="ps-deep" cx="1172" cy="1080" r="180" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#9a44ff" stop-opacity=".95"/><stop offset="1" stop-color="#4a1aa0" stop-opacity="0"/></radialGradient>
<radialGradient id="ps-wash" cx="0" cy="1060" r="760" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#18237a" stop-opacity=".75"/><stop offset="1" stop-color="#18237a" stop-opacity="0"/></radialGradient>
<radialGradient id="ps-amb" cx="640" cy="700" r="640" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#140f38" stop-opacity=".8"/><stop offset="1" stop-color="#140f38" stop-opacity="0"/></radialGradient>
<radialGradient id="ps-top" cx="700" cy="0" r="420" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#241a5c" stop-opacity=".6"/><stop offset="1" stop-color="#241a5c" stop-opacity="0"/></radialGradient>
<linearGradient id="ps-brick" x1="0" y1="0" x2=".3" y2="1"><stop offset="0" stop-color="#efe6ff" stop-opacity=".28"/><stop offset=".22" stop-color="#e2d4ff" stop-opacity=".12"/><stop offset=".7" stop-color="#e2d4ff" stop-opacity=".09"/><stop offset="1" stop-color="#efe6ff" stop-opacity=".18"/></linearGradient>
<linearGradient id="ps-glint" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".4"/><stop offset=".6" stop-color="#fff" stop-opacity=".06"/><stop offset="1" stop-color="#fff" stop-opacity=".18"/></linearGradient>
<linearGradient id="ps-sweep" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e6d6ff" stop-opacity="0"/><stop offset=".5" stop-color="#e6d6ff" stop-opacity=".42"/><stop offset="1" stop-color="#e6d6ff" stop-opacity="0"/></linearGradient>
<linearGradient id="ps-fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".25"/><stop offset=".16" stop-color="#fff"/><stop offset=".86" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity=".2"/></linearGradient>
<mask id="ps-mask" maskUnits="userSpaceOnUse" x="${STRIP}" y="0" width="${W - STRIP}" height="${H}"><rect x="${STRIP}" width="${W - STRIP}" height="${H}" fill="url(#ps-fade)"/></mask>
<pattern id="ps-bricks" x="${STRIP}" y="-40" width="${PITCH}" height="${PITCH}" patternUnits="userSpaceOnUse">
<rect width="${PITCH}" height="${PITCH}" fill="#000" fill-opacity=".38"/>
<rect x="4" y="4" width="${BRICK}" height="${BRICK}" rx="8" fill="url(#ps-brick)" stroke="#fff" stroke-opacity=".3" stroke-width="1.6"/>
<path d="M12 6.5H${BRICK - 4}" stroke="#fff" stroke-opacity=".55" stroke-width="3" stroke-linecap="round"/>
<path d="M6.5 12V${BRICK - 6}" stroke="#fff" stroke-opacity=".18" stroke-width="2" stroke-linecap="round"/>
</pattern>
</defs>
<style>
.ps-br{transform-box:fill-box;transform-origin:center;animation-name:ps-br;animation-timing-function:ease-in-out;animation-iteration-count:infinite}
@keyframes ps-br{0%,100%{opacity:.68;transform:scale(.94)}50%{opacity:1;transform:scale(1.05)}}
.ps-gl{opacity:0;animation-name:ps-gl;animation-timing-function:ease-in-out;animation-iteration-count:infinite}
@keyframes ps-gl{0%,100%{opacity:0}45%{opacity:0}62%{opacity:1}80%{opacity:0}}
</style>
<rect width="${W}" height="${H}" fill="#05050f"/>
<rect width="${W}" height="${H}" fill="url(#ps-amb)"/>
<rect width="${W}" height="${H}" fill="url(#ps-wash)"/>
<rect width="${W}" height="${H}" fill="url(#ps-top)"/>
<g opacity="${isBusy ? 1 : 0.92}">
<g class="ps-br" style="animation-duration:12s;animation-delay:${begin(now, 12)}"><rect x="900" y="0" width="${W - 900}" height="${H}" fill="url(#ps-glow)"/></g>
<g class="ps-br" style="animation-duration:17s;animation-delay:${begin(now, 17, 6)}"><circle cx="1186" cy="430" r="175" fill="url(#ps-hot)"/><circle cx="1172" cy="1080" r="180" fill="url(#ps-deep)"/></g>
</g>
${behind}
${sweep}
<g mask="url(#ps-mask)"><rect x="${STRIP}" y="0" width="${W - STRIP}" height="${H}" fill="url(#ps-bricks)"/></g>
${glints}
${stack}
${orbs}
${streaks}
</svg>`
}
