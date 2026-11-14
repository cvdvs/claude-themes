// Night moths: glowing line-art butterflies on navy-black, a crystal curtain and a stage beam.
// Animated with SMIL (flap, drift, rise, twinkle) so each butterfly keeps its own timing.
// Laid out for the app window: the curtain, beam and most butterflies fill the right column
// (x 1000–1250), a fringe and two small fliers run along the top band, a few rest along the
// bottom band, and a handful of strands hang in the thin left margin. The text column only gets glow.

import { H, W, begin, open, rng } from './kit'

// One wing pair, centered on the body at 0,0, about 120 wide. Solid shapes: they survive the frosted panels.
const WING = `
<path d="M 0 -3 C 6 -26, 34 -52, 62 -54 C 64 -36, 50 -12, 0 0 Z"/>
<path d="M 0 3 C 18 2, 42 12, 42 30 C 40 46, 22 50, 12 40 C 6 30, 2 16, 0 6 Z"/>`

const SYMBOL = `
<symbol id="bf" overflow="visible">
  <g class="wing">${WING}</g>
  <g class="wing" transform="scale(-1 1)">${WING}</g>
  <ellipse class="body" rx="4" ry="15"/>
  <path class="ant" d="M -1 -12 Q -6 -26 -12 -30 M 1 -12 Q 6 -26 12 -30"/>
</symbol>`

type Band = 'right' | 'top' | 'bottom'
type Fly = { x: number; y: number; s: number; r: number; flap: number; drift: number; dx: number; dy: number; band: Band }

const FLIERS: Fly[] = (() => {
  const rand = rng(23)
  // [x, y, size, how far it wanders, band]. The bands keep their fliers small and close to home.
  const spots: Array<[number, number, number, number, Band]> = [
    [1172, 178, 1.05, 1, 'right'],
    [1096, 352, 0.7, 0.8, 'right'],
    [1200, 498, 0.72, 0.8, 'right'],
    [1074, 664, 0.62, 0.7, 'right'],
    [1188, 830, 0.95, 1, 'right'],
    [600, 30, 0.5, 0.3, 'top'],
    [884, 28, 0.56, 0.3, 'top'],
    [430, 1264, 0.58, 0.45, 'bottom'],
    [745, 1390, 0.46, 0.3, 'bottom'],
    [948, 1256, 0.7, 0.5, 'bottom'],
  ]
  return spots.map(([x, y, sz, wander, band]) => ({
    x,
    y,
    s: sz,
    r: (rand() - 0.5) * 70,
    flap: 0.9 + rand() * 0.8,
    drift: 9 + rand() * 9,
    dx: (rand() - 0.5) * 70 * wander,
    dy: (rand() - 0.5) * 50 * wander,
    band,
  }))
})()

function butterfly(f: Fly, now: number, isBusy: boolean, i: number): string {
  const flap = isBusy ? f.flap * 0.55 : f.flap
  return `<g transform="translate(${f.x} ${f.y})">
<g><animateTransform attributeName="transform" type="translate" values="0 0;${f.dx.toFixed(0)} ${f.dy.toFixed(0)};0 0" keyTimes="0;0.5;1" calcMode="spline" keySplines=".45 0 .55 1;.45 0 .55 1" dur="${f.drift.toFixed(1)}s" begin="${begin(now, f.drift, i)}" repeatCount="indefinite"/>
<g transform="rotate(${f.r.toFixed(0)}) scale(${f.s})">
<g><animateTransform attributeName="transform" type="scale" values="1 1;0.22 1;1 1" keyTimes="0;0.5;1" calcMode="spline" keySplines=".5 0 .5 1;.5 0 .5 1" dur="${flap.toFixed(2)}s" begin="${begin(now, flap, i * 0.37)}" repeatCount="indefinite"/>
<use href="#bf"/></g></g></g></g>`
}

// A few that rise from the foot of the right column to the top and fade, like the swarm reference.
function riser(i: number, now: number): string {
  const rand = rng(100 + i)
  const x = [1064, 1150, 1216][i] ?? 1150
  const dur = 34 + rand() * 18
  const drift = (rand() - 0.5) * 120
  const flap = 0.8 + rand() * 0.5
  const b = begin(now, dur, i * 7.3)
  return `<g transform="translate(${x} ${H + 60})">
<g><animateTransform attributeName="transform" type="translate" values="0 0;${(drift / 4).toFixed(0)} -760;${(drift / 2).toFixed(0)} -1560" dur="${dur.toFixed(1)}s" begin="${b}" repeatCount="indefinite"/>
<animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.15;0.75;1" dur="${dur.toFixed(1)}s" begin="${b}" repeatCount="indefinite"/>
<g transform="rotate(${((rand() - 0.5) * 40).toFixed(0)}) scale(${(0.7 + rand() * 0.25).toFixed(2)})">
<g><animateTransform attributeName="transform" type="scale" values="1 1;0.22 1;1 1" dur="${flap.toFixed(2)}s" begin="${begin(now, flap, i)}" repeatCount="indefinite"/>
<use href="#bf"/></g></g></g></g>`
}

// The big line-art butterfly, where the right column meets the bottom band, wings breathing slowly.
function hero(now: number, isBusy: boolean): string {
  const dur = isBusy ? 2.6 : 5
  return `<g transform="translate(1128 1176) rotate(-8) scale(2.1)">
<g><animateTransform attributeName="transform" type="scale" values="1 1;0.72 1;1 1" keyTimes="0;0.5;1" calcMode="spline" keySplines=".5 0 .5 1;.5 0 .5 1" dur="${dur}s" begin="${begin(now, dur)}" repeatCount="indefinite"/>
<use href="#bf"/></g></g>`
}

// The crystal curtain: long strands down the right column, a short fringe along the top band
// (kept above the first line of text), and a few long strands in the thin left margin.
const CURTAIN = (() => {
  const rand = rng(41)
  const main: string[] = []
  const fringe: string[] = []
  const margin: string[] = []
  const sparks: string[] = []
  const spark = (x: number, y: number) =>
    sparks.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(0)}" r="${(1.6 + rand() * 1.6).toFixed(1)}" data-d="${(2 + rand() * 4).toFixed(1)}"/>`)

  for (let i = 0; i < 46; i++) {
    const x = 1006 + rand() * 240
    const len = 150 + rand() * 300 + 300 * Math.max(0, 1 - Math.abs(x - 1135) / 120)
    main.push(`<line x1="${x.toFixed(1)}" y1="0" x2="${x.toFixed(1)}" y2="${len.toFixed(0)}"/>`)
    if (i % 3 === 0) {
      spark(x, 40 + rand() * (len - 40))
    }
  }
  for (let x = 470; x < 1004; x += 9 + rand() * 7) {
    const t = (x - 470) / 534
    const len = 6 + rand() * 16 + 34 * t * t
    fringe.push(`<line x1="${x.toFixed(1)}" y1="0" x2="${x.toFixed(1)}" y2="${len.toFixed(0)}"/>`)
  }
  for (const [x, len] of [[262, 760], [268, 1180], [274, 520], [280, 980], [286, 1290], [291, 640]] as const) {
    margin.push(`<line x1="${x}" y1="0" x2="${x}" y2="${len}"/>`)
    if (len > 900) {
      spark(x, len * (0.45 + rand() * 0.4))
    }
  }
  return { main: main.join(''), fringe: fringe.join(''), margin: margin.join(''), sparks }
})()

// The glow is filtered per region, so the filter only covers where butterflies are.
const glowFilter = (id: string, x: number, y: number, w: number, h: number): string =>
  `<filter id="${id}" filterUnits="userSpaceOnUse" x="${x}" y="${y}" width="${w}" height="${h}">
  <feGaussianBlur in="SourceGraphic" stdDeviation="14" result="b"/>
  <feColorMatrix in="b" values="0 0 0 0 0.35  0 0 0 0 0.7  0 0 0 0 1  0 0 0 1.6 0" result="t"/>
  <feMerge><feMergeNode in="t"/><feMergeNode in="t"/><feMergeNode in="SourceGraphic"/></feMerge>
</filter>`

export function mothScene(isBusy: boolean, now: number): string {
  const sparks = CURTAIN.sparks
    .map((c, i) => {
      const d = Number(/data-d="([\d.]+)"/.exec(c)?.[1] ?? 3)
      return c.replace(
        '/>',
        `><animate attributeName="opacity" values=".15;1;.15" dur="${d}s" begin="${begin(now, d, i)}" repeatCount="indefinite"/></circle>`,
      )
    })
    .join('')
  const fly = (band: Band) =>
    FLIERS.map((f, i) => (f.band === band ? butterfly(f, now, isBusy, i) : ''))
      .filter(s => s !== '')
      .join('\n')

  return `${open()}
<defs>
${SYMBOL}
<radialGradient id="wingfill" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="62">
  <stop offset="0" stop-color="#ffffff"/>
  <stop offset=".35" stop-color="#e6f5ff" stop-opacity=".95"/>
  <stop offset=".72" stop-color="#9fd2ff" stop-opacity=".85"/>
  <stop offset="1" stop-color="#3f86f0" stop-opacity=".4"/>
</radialGradient>
${glowFilter('glowR', 900, -160, 450, H + 320)}
${glowFilter('glowT', 430, -40, 600, 170)}
${glowFilter('glowB', 300, 1170, 780, H - 1170 + 60)}
<filter id="haze" filterUnits="userSpaceOnUse" x="960" y="-120" width="${W - 960 + 120}" height="${H + 240}"><feGaussianBlur stdDeviation="30"/></filter>
<filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 0.8  0 0 0 0 0.9  0 0 0 0 1  0 0 0 0.5 0"/></filter>
<linearGradient id="strand" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="760"><stop offset="0" stop-color="#ffffff" stop-opacity=".05"/><stop offset=".55" stop-color="#cfe8ff" stop-opacity=".55"/><stop offset="1" stop-color="#cfe8ff" stop-opacity="0"/></linearGradient>
<linearGradient id="fringe" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="62"><stop offset="0" stop-color="#ffffff" stop-opacity=".1"/><stop offset=".6" stop-color="#cfe8ff" stop-opacity=".6"/><stop offset="1" stop-color="#cfe8ff" stop-opacity="0"/></linearGradient>
<linearGradient id="hang" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="1300"><stop offset="0" stop-color="#ffffff" stop-opacity=".05"/><stop offset=".5" stop-color="#cfe8ff" stop-opacity=".5"/><stop offset="1" stop-color="#cfe8ff" stop-opacity="0"/></linearGradient>
<linearGradient id="beam" x1="1" y1="0" x2="0.3" y2="1"><stop offset="0" stop-color="#e8f4ff" stop-opacity=".9"/><stop offset="1" stop-color="#7fb8ff" stop-opacity="0"/></linearGradient>
<radialGradient id="pool" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#1b3a6b" stop-opacity=".55"/><stop offset="1" stop-color="#05070c" stop-opacity="0"/></radialGradient>
</defs>
<style>
.wing path{fill:url(#wingfill)}
.body{fill:#ffffff}
.ant{fill:none;stroke:#dff0ff;stroke-width:1.1}
.strands{stroke:url(#strand);stroke-width:1.8}
.fringe{stroke:url(#fringe);stroke-width:2.2}
.hang{stroke:url(#hang);stroke-width:2.4}
.sparks{fill:#ffffff}
</style>
<rect width="${W}" height="${H}" fill="#04060b"/>
<ellipse cx="1170" cy="1040" rx="340" ry="540" fill="url(#pool)"/>
<ellipse cx="720" cy="${H + 30}" rx="560" ry="170" fill="url(#pool)"/>
<ellipse cx="760" cy="-30" rx="420" ry="110" fill="url(#pool)" opacity=".7"/>
<ellipse cx="130" cy="720" rx="240" ry="560" fill="url(#pool)" opacity=".5"/>
<g opacity="${isBusy ? 0.38 : 0.1}">
  <animate attributeName="opacity" values="${isBusy ? '.38;.6;.38' : '.1;.18;.1'}" dur="${isBusy ? 3 : 10}s" begin="${begin(now, isBusy ? 3 : 10)}" repeatCount="indefinite"/>
  <polygon points="1290,-40 1205,-40 1045,${H} 1290,${H}" fill="url(#beam)" filter="url(#haze)"/>
</g>
<g class="strands" opacity="${isBusy ? 0.95 : 0.7}">${CURTAIN.main}</g>
<g class="fringe" opacity="${isBusy ? 0.95 : 0.7}">${CURTAIN.fringe}</g>
<g class="hang" opacity="${isBusy ? 0.9 : 0.65}">${CURTAIN.margin}</g>
<g class="sparks">${sparks}</g>
<g filter="url(#glowR)" opacity="${isBusy ? 1 : 0.88}">
${hero(now, isBusy)}
${fly('right')}
${[0, 1, 2].map(i => riser(i, now)).join('\n')}
</g>
<g filter="url(#glowT)" opacity="${isBusy ? 1 : 0.88}">
${fly('top')}
</g>
<g filter="url(#glowB)" opacity="${isBusy ? 1 : 0.88}">
${fly('bottom')}
</g>
<rect width="${W}" height="${H}" filter="url(#grain)" opacity=".09"/>
</svg>`
}
