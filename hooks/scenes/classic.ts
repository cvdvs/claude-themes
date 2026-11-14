// The first two looks: Night swirl (pitch black, neon ribbons) and Pixel grid (pale paper, black pixels).
// Drawn on a 1600 × 1000 canvas; they predate the per-project scenes.

import { begin, rng } from './kit'

// ---------------------------------------------------------------- swirl scene

const KNOT = { x: 1300, y: 520 }

const RIBBONS = [
  { d: 'M -120 170 C 300 70, 520 430, 820 380 S 1150 470, 1300 520', from: '#22e1ff', to: '#8a5cff', dur: 38 },
  { d: 'M -120 430 C 250 300, 600 150, 770 330 S 1060 570, 1300 520', from: '#7b4dff', to: '#2fd8e8', dur: 47 },
  { d: 'M -100 760 C 200 920, 520 640, 700 560 S 1100 420, 1300 520', from: '#ff3fd2', to: '#7b4dff', dur: 53 },
  { d: 'M 180 1120 C 380 820, 700 770, 900 640 S 1200 540, 1300 520', from: '#ffd23a', to: '#ff5a2a', dur: 61 },
  { d: 'M -120 990 C 300 1010, 420 700, 640 720 S 1000 700, 1300 520', from: '#b6ff3a', to: '#22e1ff', dur: 70 },
]

export function swirlScene(isBusy: boolean, now: number): string {
  const defs = RIBBONS.map(
    (r, i) =>
      `<linearGradient id="g${i}" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${KNOT.x}" y2="${KNOT.y}"><stop offset="0" stop-color="${r.from}"/><stop offset="1" stop-color="${r.to}"/></linearGradient>`,
  ).join('')

  const sway = RIBBONS.map(
    (r, i) => `.r${i}{animation:sway${i % 2} ${r.dur}s ease-in-out ${begin(now, r.dur * 2)} infinite alternate}`,
  ).join('')

  const layer = (width: number, filter: string, opacity: number) =>
    `<g filter="url(#${filter})" opacity="${opacity}">${RIBBONS.map(
      (r, i) =>
        `<g class="r${i}"><path d="${r.d}" fill="none" stroke="url(#g${i})" stroke-width="${width}" stroke-linecap="round"/></g>`,
    ).join('')}</g>`

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">
<defs>${defs}
<filter id="haze" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="48"/></filter>
<filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="9"/></filter>
<filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.55 0"/></filter>
<radialGradient id="knot"><stop offset="0" stop-color="#ffffff"/><stop offset="0.35" stop-color="#d9d4ff" stop-opacity="0.6"/><stop offset="1" stop-color="#8a5cff" stop-opacity="0"/></radialGradient>
<linearGradient id="beam" x1="0" x2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></linearGradient>
</defs>
<style>
g[class^=r]{transform-origin:${KNOT.x}px ${KNOT.y}px}
@keyframes sway0{from{transform:rotate(-7deg) translate(-30px,20px)}to{transform:rotate(6deg) translate(25px,-30px)}}
@keyframes sway1{from{transform:rotate(8deg) translate(20px,-25px)}to{transform:rotate(-5deg) translate(-35px,30px)}}
@keyframes breathe{0%,100%{opacity:var(--lo)}50%{opacity:var(--hi)}}
${sway}
.ribbons{transition:opacity 2s}
.knot{--lo:${isBusy ? 0.75 : 0.18};--hi:${isBusy ? 1 : 0.32};animation:breathe ${isBusy ? 2.4 : 9}s ease-in-out infinite}
.beam{--lo:${isBusy ? 0.55 : 0.08};--hi:${isBusy ? 0.95 : 0.16};animation:breathe ${isBusy ? 1.6 : 9}s ease-in-out infinite}
</style>
<rect width="1600" height="1000" fill="#000"/>
<g class="ribbons" opacity="${isBusy ? 1 : 0.78}">
${layer(150, 'haze', 0.55)}
${layer(44, 'soft', 0.85)}
</g>
<rect class="beam" x="${KNOT.x}" y="${KNOT.y - 2}" width="${1600 - KNOT.x}" height="4" fill="url(#beam)" filter="url(#soft)"/>
<circle class="knot" cx="${KNOT.x}" cy="${KNOT.y}" r="70" fill="url(#knot)"/>
<rect width="1600" height="1000" filter="url(#grain)" opacity="0.13"/>
</svg>`
}

// ---------------------------------------------------------------- grid scene

const CELL = 40
const COLS = 40
const ROWS = 25

const BLOBS = [
  { x: 5, y: 25, r: 10 },
  { x: 18, y: 27, r: 9 },
  { x: 35, y: 12, r: 8.5 },
  { x: 39, y: 2, r: 5 },
  { x: 29, y: 21, r: 5.5 },
  { x: 14, y: 2, r: 2.2 },
]

function buildGrid(): boolean[][] {
  const rand = rng(7)
  const dark: boolean[][] = []
  for (let y = 0; y < ROWS; y++) {
    dark.push([])
    for (let x = 0; x < COLS; x++) {
      let v = 0
      for (const b of BLOBS) {
        v = Math.max(v, 1 - Math.hypot(x - b.x, y - b.y) / b.r)
      }
      const jitter = (rand() - 0.5) * 0.42
      dark[y]!.push(v + jitter > 0.32 || (v < 0.05 && rand() < 0.012))
    }
  }
  return dark
}

const DARK = buildGrid()

function neighbors(x: number, y: number): number {
  let n = 0
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if ((dx !== 0 || dy !== 0) && DARK[y + dy]?.[x + dx]) {
        n++
      }
    }
  }
  return n
}

// The still part of the grid, built once.
const GRID_STILL = (() => {
  const rand = rng(11)
  const cells: string[] = []
  const numbers: string[] = []
  const frontier: Array<[number, number]> = []
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (DARK[y]![x]) {
        cells.push(`<rect x="${x * CELL}" y="${y * CELL}" width="${CELL}" height="${CELL}"/>`)
        continue
      }
      const n = neighbors(x, y)
      if (n > 0) {
        frontier.push([x, y])
        numbers.push(`<text x="${x * CELL + 20}" y="${y * CELL + 24}">${n}</text>`)
      }
    }
  }

  // Dot-matrix heart, faint, top left (tracing-paper layer).
  const dots: string[] = []
  for (let gy = 0; gy < 15; gy++) {
    for (let gx = 0; gx < 17; gx++) {
      const u = (gx - 8) / 6.2
      const v = -(gy - 6) / 6.2
      if ((u * u + v * v - 1) ** 3 - u * u * v ** 3 <= 0) {
        dots.push(`<circle cx="${250 + gx * 16}" cy="${150 + gy * 16}" r="5"/>`)
      }
    }
  }

  // Cells that flip on and off now and then.
  const blink = Array.from({ length: 14 }, () => frontier[Math.floor(rand() * frontier.length)]!)
  const glowPath = Array.from({ length: 8 }, () => {
    const options: Array<[number, number]> = []
    for (let y = 2; y < ROWS - 2; y++) {
      for (let x = 20; x < COLS - 2; x++) {
        if (DARK[y]![x]) options.push([x, y])
      }
    }
    return options[Math.floor(rand() * options.length)]!
  })

  return { cells: cells.join(''), numbers: numbers.join(''), dots: dots.join(''), blink, glowPath }
})()

function cross(x: number, y: number) {
  return `<path d="M ${x - 14} ${y} H ${x + 14} M ${x} ${y - 14} V ${y + 14}"/>`
}

export function gridScene(isBusy: boolean, now: number): string {
  const g = GRID_STILL
  const blinkCells = g.blink
    .map(([x, y], i) => {
      const dur = 7 + (i % 5) * 1.7
      return `<rect class="b" style="animation-duration:${dur}s;animation-delay:${begin(now, dur)}" x="${x * CELL}" y="${y * CELL}" width="${CELL}" height="${CELL}"/>`
    })
    .join('')

  const steps = g.glowPath
    .map(([x, y], i) => `${((i / g.glowPath.length) * 100).toFixed(1)}%{transform:translate(${x * CELL}px,${y * CELL}px)}`)
    .join('')
  const [gx, gy] = g.glowPath[0]!
  const glowCycle = 7

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">
<defs><filter id="glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="9"/></filter></defs>
<style>
.cells{fill:#1e1e1e}
.nums{font:500 11px ui-monospace,Menlo,monospace;fill:#6a6a6a;text-anchor:middle}
.dots{fill:none;stroke:#9a9a96;stroke-width:1.3;opacity:.45}
.rules{stroke:#9a9a96;stroke-width:1;fill:none}
.b{fill:#1e1e1e;opacity:0;animation-name:flip;animation-iteration-count:infinite;animation-timing-function:steps(1)}
@keyframes flip{0%{opacity:0}70%{opacity:1}85%{opacity:0}}
@keyframes walk{${steps}100%{transform:translate(${gx * CELL}px,${gy * CELL}px)}}
@keyframes hum{0%,100%{opacity:.35}50%{opacity:.6}}
.glow{${
    isBusy
      ? `animation:walk ${glowCycle}s steps(1) ${begin(now, glowCycle)} infinite`
      : `transform:translate(${gx * CELL}px,${gy * CELL}px);animation:hum 6s ease-in-out infinite`
  }}
</style>
<rect width="1600" height="1000" fill="#e3e3e0"/>
<g class="dots">${g.dots}</g>
<g class="cells">${g.cells}${blinkCells}</g>
<g class="nums">${g.numbers}</g>
<g class="rules">
<path d="M 0 40.5 H 1600 M 0 48.5 H 1600 M 0 960.5 H 1600"/>
${cross(400, 440)}${cross(1120, 120)}${cross(760, 800)}${cross(240, 640)}
<rect x="1360.5" y="680.5" width="160" height="96"/><rect x="1368.5" y="688.5" width="144" height="80"/>
</g>
<g class="glow"><rect x="4" y="4" width="32" height="32" fill="#2b2fd9" filter="url(#glow)"/><rect x="10" y="10" width="20" height="20" fill="#3a3ff0" opacity=".85"/></g>
</svg>`
}

