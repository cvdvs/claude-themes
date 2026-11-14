// The first two looks: Night swirl (pitch black, neon ribbons) and Pixel grid (pale paper, black pixels).
// Laid out for the app window: the art frames the chat as a right-hand column (x 1000–1250) joined to
// a top band and a bottom band. Behind the chat text there is only soft color (swirl) or bare paper (grid).

import { H, W, begin, open, rng } from './kit'

// ---------------------------------------------------------------- swirl scene

// The glowing point sits in the right column, about two fifths down. Two ribbons arrive along the top
// band and drop into it; three run along the bottom band and climb the column to it.
const KNOT = { x: 1110, y: 560 }

const RIBBONS = [
  { d: 'M -120 24 C 240 76, 540 -6, 830 34 S 1210 70, 1215 250 S 1150 470, 1110 560', from: '#22e1ff', to: '#8a5cff', x1: 0, y1: 30, dur: 38 },
  { d: 'M -120 92 C 200 12, 700 30, 880 44 S 1020 130, 1030 300 S 1060 545, 1110 560', from: '#7b4dff', to: '#2fd8e8', x1: 0, y1: 60, dur: 47 },
  { d: 'M -120 1250 C 260 1330, 600 1236, 900 1266 S 1210 1180, 1220 1000 S 1040 800, 1050 700 S 1090 590, 1110 560', from: '#ff3fd2', to: '#7b4dff', x1: 0, y1: 1330, dur: 53 },
  { d: 'M 120 1440 C 420 1372, 700 1398, 960 1350 S 1060 1200, 1050 1040 S 1220 820, 1210 720 S 1140 590, 1110 560', from: '#ffd23a', to: '#ff5a2a', x1: 120, y1: 1410, dur: 61 },
  { d: 'M -120 1394 C 280 1422, 640 1352, 880 1396 S 1240 1400, 1236 1180 S 1160 900, 1130 760 S 1110 610, 1110 560', from: '#b6ff3a', to: '#22e1ff', x1: 0, y1: 1390, dur: 70 },
]

export function swirlScene(isBusy: boolean, now: number): string {
  const defs = RIBBONS.map(
    (r, i) =>
      `<linearGradient id="g${i}" gradientUnits="userSpaceOnUse" x1="${r.x1}" y1="${r.y1}" x2="${KNOT.x}" y2="${KNOT.y}"><stop offset="0" stop-color="${r.from}"/><stop offset="1" stop-color="${r.to}"/></linearGradient>`,
  ).join('')

  const sway = RIBBONS.map(
    (r, i) => `.r${i}{animation:sway${i % 2} ${r.dur}s ease-in-out ${begin(now, r.dur * 2)} infinite alternate}`,
  ).join('')

  const layer = (width: number, filter: string, opacity: number) =>
    `<g filter="url(#${filter})" opacity="${opacity}">${RIBBONS.map(
      (r, i) =>
        `<g class="r${i}"><path d="${r.d}" fill="none" stroke="url(#g${i})" stroke-width="${width}" stroke-linecap="round"/></g>`,
    ).join('')}</g>`

  const knotCycle = isBusy ? 2.4 : 9
  const beamCycle = isBusy ? 1.6 : 9

  return `${open()}
<defs>${defs}
<filter id="haze" filterUnits="userSpaceOnUse" x="-200" y="-200" width="${W + 400}" height="${H + 400}"><feGaussianBlur stdDeviation="48"/></filter>
<filter id="soft" filterUnits="userSpaceOnUse" x="-100" y="-100" width="${W + 200}" height="${H + 200}"><feGaussianBlur stdDeviation="9"/></filter>
<filter id="line" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="9"/></filter>
<filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.55 0"/></filter>
<radialGradient id="knot"><stop offset="0" stop-color="#ffffff"/><stop offset="0.35" stop-color="#d9d4ff" stop-opacity="0.6"/><stop offset="1" stop-color="#8a5cff" stop-opacity="0"/></radialGradient>
<linearGradient id="beam" x1="0" x2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></linearGradient>
</defs>
<style>
g[class^=r]{transform-origin:${KNOT.x}px ${KNOT.y}px}
@keyframes sway0{from{transform:rotate(-3deg) translate(-18px,12px)}to{transform:rotate(2.6deg) translate(14px,-16px)}}
@keyframes sway1{from{transform:rotate(3.2deg) translate(12px,-14px)}to{transform:rotate(-2.4deg) translate(-20px,16px)}}
@keyframes breathe{0%,100%{opacity:var(--lo)}50%{opacity:var(--hi)}}
${sway}
.ribbons{transition:opacity 2s}
.knot{--lo:${isBusy ? 0.75 : 0.18};--hi:${isBusy ? 1 : 0.32};animation:breathe ${knotCycle}s ease-in-out ${begin(now, knotCycle)} infinite}
.beam{--lo:${isBusy ? 0.55 : 0.08};--hi:${isBusy ? 0.95 : 0.16};animation:breathe ${beamCycle}s ease-in-out ${begin(now, beamCycle, 1)} infinite}
</style>
<rect width="${W}" height="${H}" fill="#000"/>
<g class="ribbons" opacity="${isBusy ? 1 : 0.78}">
${layer(150, 'haze', 0.55)}
${layer(44, 'soft', 0.85)}
</g>
<g class="beam"><rect x="${KNOT.x}" y="${KNOT.y - 2}" width="${W - KNOT.x + 40}" height="4" fill="url(#beam)" filter="url(#line)"/></g>
<circle class="knot" cx="${KNOT.x}" cy="${KNOT.y}" r="70" fill="url(#knot)"/>
<rect width="${W}" height="${H}" filter="url(#grain)" opacity="0.13"/>
</svg>`
}

// ---------------------------------------------------------------- grid scene

const CELL = 50
const COLS = Math.ceil(W / CELL)
const ROWS = Math.ceil(H / CELL)

// Dark masses as ellipses, in cells: a cliff down the right column, a heavy bottom-right corner, a low
// run along the bottom band, and a broken frieze along the header strip between the title and the icons.
const BLOBS = [
  { x: 25.8, y: 10.5, rx: 4.6, ry: 2.6 },
  { x: 25.8, y: 15, rx: 5.4, ry: 4.2 },
  { x: 25, y: 19.5, rx: 3.6, ry: 3.6 },
  { x: 25.8, y: 23, rx: 5.2, ry: 3.2 },
  { x: 7.5, y: 25.4, rx: 1.7, ry: 1 },
  { x: 24.5, y: 28.6, rx: 8, ry: 4.6 },
  { x: 10.5, y: 29.3, rx: 7.5, ry: 3.2 },
  { x: 15, y: 25.6, rx: 2.2, ry: 1.2 },
  { x: 18.8, y: -0.6, rx: 2.6, ry: 2 },
  { x: 12, y: -0.4, rx: 1.8, ry: 1.2 },
]

// Cells that may go dark: the right column from x 1050 (below the header icons), the bottom band, and
// the header strip between the title and the icons. Never behind the chat text, never under the sidebar.
const canDarken = (x: number, y: number): boolean =>
  x >= 5 && (y === 0 ? x >= 10 && x <= 19 : x >= 21 || y >= 25)
// Count numbers follow the same zones, plus the empty row just above the bottom band.
const canNumber = (x: number, y: number): boolean => canDarken(x, y) || (x >= 5 && y === 24)

function buildGrid(): boolean[][] {
  const rand = rng(7)
  const dark: boolean[][] = []
  for (let y = 0; y < ROWS; y++) {
    dark.push([])
    for (let x = 0; x < COLS; x++) {
      let v = 0
      for (const b of BLOBS) {
        v = Math.max(v, 1 - Math.hypot((x - b.x) / b.rx, (y - b.y) / b.ry))
      }
      const jitter = (rand() - 0.5) * 0.42
      const on = v + jitter > 0.32 || (v < 0.05 && rand() < 0.025)
      dark[y]!.push(on && canDarken(x, y))
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
      if (n > 0 && canNumber(x, y)) {
        numbers.push(`<text x="${x * CELL + CELL / 2}" y="${y * CELL + CELL / 2 + 4.5}">${n}</text>`)
        if (canDarken(x, y)) frontier.push([x, y])
      }
    }
  }

  // Dot-matrix heart, faint, near the top of the right column under the frame (tracing-paper layer).
  const dots: string[] = []
  for (let gy = 0; gy < 15; gy++) {
    for (let gx = 0; gx < 17; gx++) {
      const u = (gx - 8) / 6.2
      const v = -(gy - 6) / 6.2
      if ((u * u + v * v - 1) ** 3 - u * u * v ** 3 <= 0) {
        dots.push(`<circle cx="${1021 + gx * 13}" cy="${204 + gy * 13}" r="4.2"/>`)
      }
    }
  }

  // Cells that flip on and off now and then, only where dark cells are allowed.
  const blink = Array.from({ length: 14 }, () => frontier[Math.floor(rand() * frontier.length)]!)
  // The blue cell's stops: dark cells that stay in view (not under the input box at rows 26–27).
  const options: Array<[number, number]> = []
  for (let y = 0; y <= 25; y++) {
    for (let x = 5; x < COLS; x++) {
      if (DARK[y]![x]) options.push([x, y])
    }
  }
  const glowPath = Array.from({ length: 8 }, () => options[Math.floor(rand() * options.length)]!)

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
      return `<rect class="b" style="animation-duration:${dur}s;animation-delay:${begin(now, dur, i)}" x="${x * CELL}" y="${y * CELL}" width="${CELL}" height="${CELL}"/>`
    })
    .join('')

  const steps = g.glowPath
    .map(([x, y], i) => `${((i / g.glowPath.length) * 100).toFixed(1)}%{transform:translate(${x * CELL}px,${y * CELL}px)}`)
    .join('')
  const [gx, gy] = g.glowPath[0]!
  const glowCycle = 7
  const humCycle = 6

  return `${open()}
<defs><filter id="glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="11"/></filter></defs>
<style>
.cells{fill:#1e1e1e}
.nums{font:500 13px ui-monospace,Menlo,monospace;fill:#6a6a6a;text-anchor:middle}
.dots{fill:none;stroke:#9a9a96;stroke-width:1.3;opacity:.45}
.rules{stroke:#9a9a96;stroke-width:1;fill:none}
.b{fill:#1e1e1e;opacity:0;animation-name:flip;animation-iteration-count:infinite;animation-timing-function:steps(1)}
@keyframes flip{0%{opacity:0}70%{opacity:1}85%{opacity:0}}
@keyframes walk{${steps}100%{transform:translate(${gx * CELL}px,${gy * CELL}px)}}
@keyframes hum{0%,100%{opacity:.35}50%{opacity:.6}}
.glow{${
    isBusy
      ? `animation:walk ${glowCycle}s steps(1) ${begin(now, glowCycle)} infinite`
      : `transform:translate(${gx * CELL}px,${gy * CELL}px);animation:hum ${humCycle}s ease-in-out ${begin(now, humCycle)} infinite`
  }}
</style>
<rect width="${W}" height="${H}" fill="#e3e3e0"/>
<g class="dots">${g.dots}</g>
<g class="cells">${g.cells}${blinkCells}</g>
<g class="nums">${g.numbers}</g>
<g class="rules">
<path d="M 0 40.5 H ${W} M 0 48.5 H ${W} M 0 1240.5 H ${W} M 262.5 0 V ${H} M 270.5 0 V ${H}"/>
${cross(266, 330)}${cross(266, 1060)}${cross(580, 1274)}${cross(1028, 640)}
<rect x="1045.5" y="76.5" width="160" height="96"/><rect x="1053.5" y="84.5" width="144" height="80"/>
</g>
<g class="glow"><rect x="5" y="5" width="40" height="40" fill="#2b2fd9" filter="url(#glow)"/><rect x="12.5" y="12.5" width="25" height="25" fill="#3a3ff0" opacity=".85"/></g>
</svg>`
}
