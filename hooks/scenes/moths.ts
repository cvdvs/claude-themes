// Night moths: glowing line-art butterflies on navy-black, a crystal curtain and a stage beam.
// Animated with SMIL (flap, drift, rise, twinkle) so each butterfly keeps its own timing.

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

type Fly = { x: number; y: number; s: number; r: number; flap: number; drift: number; dx: number; dy: number }

const FLIERS: Fly[] = (() => {
  const rand = rng(23)
  // Kept to the edges and corners: the middle is where the words sit.
  const spots: Array<[number, number, number]> = [
    // Under the sidebar (frosted by it), in the right strip, and small ones at the top and foot.
    [120, 210, 1.4], [195, 590, 0.9], [105, 990, 1.5], [180, 1330, 0.9],
    [1160, 170, 1.2], [1195, 520, 0.85], [1130, 820, 0.8], [640, 62, 0.55],
  ]
  return spots.map(([x, y, sz]) => ({
    x,
    y,
    s: sz,
    r: (rand() - 0.5) * 70,
    flap: 0.9 + rand() * 0.8,
    drift: 9 + rand() * 9,
    dx: (rand() - 0.5) * 70,
    dy: (rand() - 0.5) * 50,
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

// A few that rise from the foot of the screen to the top and fade, like the swarm reference.
function riser(i: number, now: number): string {
  const rand = rng(100 + i)
  const x = [140, 1150, 1215][i] ?? 140
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

// The big line-art butterfly, low on the right, wings breathing slowly.
function hero(now: number, isBusy: boolean): string {
  const dur = isBusy ? 2.6 : 5
  return `<g transform="translate(1150 1150) rotate(-8) scale(2.1)">
<g><animateTransform attributeName="transform" type="scale" values="1 1;0.72 1;1 1" keyTimes="0;0.5;1" calcMode="spline" keySplines=".5 0 .5 1;.5 0 .5 1" dur="${dur}s" begin="${begin(now, dur)}" repeatCount="indefinite"/>
<use href="#bf"/></g></g>`
}

const CURTAIN = (() => {
  const rand = rng(41)
  const strands: string[] = []
  const sparks: string[] = []
  for (let i = 0; i < 46; i++) {
    const x = 1080 + rand() * 150
    const len = 160 + rand() * 320 * (1 - Math.abs(x - 1155) / 90)
    strands.push(`<line x1="${x.toFixed(1)}" y1="0" x2="${x.toFixed(1)}" y2="${len.toFixed(0)}"/>`)
    if (i % 3 === 0) {
      sparks.push(`<circle cx="${x.toFixed(1)}" cy="${(rand() * len).toFixed(0)}" r="${(1 + rand() * 1.6).toFixed(1)}" data-d="${(2 + rand() * 4).toFixed(1)}"/>`)
    }
  }
  return { strands: strands.join(''), sparks }
})()

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

  return `${open()}
<defs>
${SYMBOL}
<radialGradient id="wingfill" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="62">
  <stop offset="0" stop-color="#ffffff"/>
  <stop offset=".35" stop-color="#e6f5ff" stop-opacity=".95"/>
  <stop offset=".72" stop-color="#9fd2ff" stop-opacity=".85"/>
  <stop offset="1" stop-color="#3f86f0" stop-opacity=".4"/>
</radialGradient>
<filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
  <feGaussianBlur in="SourceGraphic" stdDeviation="14" result="b"/>
  <feColorMatrix in="b" values="0 0 0 0 0.35  0 0 0 0 0.7  0 0 0 0 1  0 0 0 1.6 0" result="t"/>
  <feMerge><feMergeNode in="t"/><feMergeNode in="t"/><feMergeNode in="SourceGraphic"/></feMerge>
</filter>
<filter id="haze" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="30"/></filter>
<filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 0.8  0 0 0 0 0.9  0 0 0 0 1  0 0 0 0.5 0"/></filter>
<linearGradient id="strand" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="480"><stop offset="0" stop-color="#ffffff" stop-opacity=".05"/><stop offset=".6" stop-color="#cfe8ff" stop-opacity=".55"/><stop offset="1" stop-color="#cfe8ff" stop-opacity="0"/></linearGradient>
<linearGradient id="beam" x1="1" y1="0" x2="0.3" y2="1"><stop offset="0" stop-color="#e8f4ff" stop-opacity=".9"/><stop offset="1" stop-color="#7fb8ff" stop-opacity="0"/></linearGradient>
<radialGradient id="pool" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#1b3a6b" stop-opacity=".55"/><stop offset="1" stop-color="#05070c" stop-opacity="0"/></radialGradient>
</defs>
<style>
.wing path{fill:url(#wingfill)}
.body{fill:#ffffff}
.ant{fill:none;stroke:#dff0ff;stroke-width:1.1}
.strands{stroke:url(#strand);stroke-width:1.1}
.sparks{fill:#ffffff}
</style>
<rect width="${W}" height="${H}" fill="#04060b"/>
<ellipse cx="1150" cy="1080" rx="380" ry="440" fill="url(#pool)"/>
<ellipse cx="90" cy="700" rx="260" ry="520" fill="url(#pool)"/>
<polygon points="1290,-40 1205,-40 1045,${H} 1290,${H}" fill="url(#beam)" filter="url(#haze)">
  <animate attributeName="opacity" values="${isBusy ? '.38;.6;.38' : '.1;.18;.1'}" dur="${isBusy ? 3 : 10}s" begin="${begin(now, isBusy ? 3 : 10)}" repeatCount="indefinite"/>
</polygon>
<g class="strands" opacity="${isBusy ? 0.95 : 0.7}">${CURTAIN.strands}</g>
<g class="sparks">${sparks}</g>
<g filter="url(#glow)" opacity="${isBusy ? 1 : 0.88}">
${hero(now, isBusy)}
${FLIERS.map((f, i) => butterfly(f, now, isBusy, i)).join('\n')}
${[0, 1, 2].map(i => riser(i, now)).join('\n')}
</g>
<rect width="${W}" height="${H}" filter="url(#grain)" opacity=".09"/>
</svg>`
}
