// Pixel: dark graph paper with pixel-block masses in greys and cream, mono letters
// packed into their cells, stepped contour outlines, a red checker block that turns black where it
// crosses a cream silhouette, and purple ink line work sweeping diagonally with tick marks, bursts
// and a spiral. Art sits under the sidebar, in the right strip and along the top and bottom edges;
// the text column gets only the faint grid. Motion: letter runs glitch, odometer cells count,
// checker cells blink, a cursor block types across the top, a scanline rolls down the art columns.
// Busy: everything ticks faster, the scanline brightens, a pen point rides the purple sweeps.
import { W, H, ZONES, rng, begin, open } from './kit'

type P = [number, number]
type Blob = [number, number, number] // x, y, radius
type Field = (x: number, y: number) => number

const C = 20 // pixel-block cell, snapped to the graph paper
const SB = ZONES.sidebar.x1
const RS = ZONES.right.x0

const BG = '#0e0e10'
const INK = '#1b1a19' // darkest block
const TONES = ['#2b2a28', '#57544e', '#9a958a', '#e2dac4'] // dark grey, mid, light, cream
const RED = '#e2342b'
const PURPLE = '#b46ff5'
const LILAC = '#9a86d6'
const MONO = 'ui-monospace,Menlo,monospace'

const f = (n: number): string => (Math.round(n * 10) / 10).toString()

function at<T>(xs: readonly T[], i: number): T {
  const v = xs[i]
  if (v === undefined) throw new Error(`index ${i}`)
  return v
}

// Smooth value noise, so masses get ragged but coherent edges.
function vnoise(seed: number, scale: number): Field {
  const r = rng(seed)
  const N = 32
  const g = Array.from({ length: N * N }, () => r())
  const v = (i: number, j: number): number => at(g, (((j % N) + N) % N) * N + (((i % N) + N) % N))
  return (x, y) => {
    const fx = x / scale
    const fy = y / scale
    const i = Math.floor(fx)
    const j = Math.floor(fy)
    const tx = fx - i
    const ty = fy - j
    const sx = tx * tx * (3 - 2 * tx)
    const sy = ty * ty * (3 - 2 * ty)
    const a = v(i, j) + (v(i + 1, j) - v(i, j)) * sx
    const b = v(i, j + 1) + (v(i + 1, j + 1) - v(i, j + 1)) * sx
    return a + (b - a) * sy
  }
}

const blobField = (blobs: Blob[], seed: number, rough: number): Field => {
  const n = vnoise(seed, 56)
  return (x, y) => {
    let b = 0
    for (const [bx, by, br] of blobs) b = Math.max(b, 1 - Math.hypot(x - bx, y - by) / br)
    return b + (n(x, y) - 0.5) * rough
  }
}

// Stepped outline of {field > t} on a fine grid, collinear edges merged.
function contour(fd: Field, t: number, x0: number, y0: number, x1: number, y1: number, s: number): string {
  const cols = Math.ceil((x1 - x0) / s)
  const rows = Math.ceil((y1 - y0) / s)
  const grid: boolean[] = []
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) grid.push(fd(x0 + (i + 0.5) * s, y0 + (j + 0.5) * s) > t)
  const inside = (i: number, j: number): boolean => i >= 0 && j >= 0 && i < cols && j < rows && grid[j * cols + i] === true
  let d = ''
  for (let j = 0; j <= rows; j++) {
    let st = -1
    for (let i = 0; i <= cols; i++) {
      const e = i < cols && inside(i, j - 1) !== inside(i, j)
      if (e && st < 0) st = i
      if (!e && st >= 0) {
        d += `M${x0 + st * s} ${y0 + j * s}h${(i - st) * s}`
        st = -1
      }
    }
  }
  for (let i = 0; i <= cols; i++) {
    let st = -1
    for (let j = 0; j <= rows; j++) {
      const e = j < rows && inside(i - 1, j) !== inside(i, j)
      if (e && st < 0) st = j
      if (!e && st >= 0) {
        d += `M${x0 + i * s} ${y0 + st * s}v${(j - st) * s}`
        st = -1
      }
    }
  }
  return d
}

type Run = { x: number; y: number; letters: string }

// A pixel mass: blocks run-length merged per row, letters for its dark "ink" cells.
type MassOut = { rects: string; runs: Run[]; light: Run[]; cells: Set<string> }
function mass(
  fd: Field,
  ink: Field,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  r: () => number,
  creamy: number,
  lightLetters: number,
): MassOut {
  const rects: string[] = []
  const runs: Run[] = []
  const light: Run[] = []
  const cells = new Set<string>()
  const ABC = 'AAAAABBADAAACAAGAAH'
  const XYZ = 'XYZWVUTSRQPZYXKMN'
  for (let y = y0; y < y1; y += C) {
    let prev = ''
    let st = 0
    let run: Run | null = null
    let lrun: Run | null = null
    const flush = (x: number): void => {
      if (prev && prev !== 'none') rects.push(`<rect x="${st}" y="${y}" width="${x - st}" height="${C}" fill="${prev}"/>`)
    }
    for (let x = x0; x <= x1; x += C) {
      let tone = 'none'
      if (x < x1) {
        const v = fd(x + C / 2, y + C / 2)
        if (v > 0.18) {
          cells.add(`${x},${y}`)
          if (ink(x + C / 2, y + C / 2) > 0.64 && v > 0.22) tone = INK
          else {
            const c = v + creamy
            tone = c > 0.6 ? at(TONES, 3) : c > 0.46 ? at(TONES, 2) : c > 0.32 ? at(TONES, 1) : at(TONES, 0)
          }
        }
      }
      if (tone !== prev) {
        flush(x)
        prev = tone
        st = x
      }
      // letters: dark cells carry a run of mostly A's; some cream cells carry a stray dark letter
      if (tone === INK && r() < 0.86) {
        if (!run) run = { x, y, letters: '' }
        run.letters += at(ABC.split(''), Math.floor(r() * ABC.length))
      } else {
        if (run) runs.push(run)
        run = null
        if (tone === at(TONES, 3) && r() < lightLetters) {
          if (!lrun || lrun.x + lrun.letters.length * C !== x) {
            if (lrun) light.push(lrun)
            lrun = { x, y, letters: '' }
          }
          lrun.letters += at(XYZ.split(''), Math.floor(r() * XYZ.length))
        }
      }
    }
    if (run) runs.push(run)
    if (lrun) light.push(lrun)
  }
  return { rects: rects.join(''), runs, light, cells }
}

// One <text> per run, each glyph centred in its cell.
const textRun = (u: Run, cls = ''): string => {
  const xs = u.letters.split('').map((_c, i) => u.x + C / 2 + i * C)
  return `<text${cls ? ` class="${cls}"` : ''} x="${xs.join(' ')}" y="${u.y + 15}">${u.letters}</text>`
}

// Cubic helpers for the ink strokes.
type Cubic = [P, P, P, P]
const cpt = (c: Cubic, t: number): P => {
  const [a, b, d, e] = c
  const u = 1 - t
  return [
    u * u * u * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * d[0] + t * t * t * e[0],
    u * u * u * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * d[1] + t * t * t * e[1],
  ]
}
const cdir = (c: Cubic, t: number): P => {
  const p = cpt(c, Math.max(0, t - 0.01))
  const q = cpt(c, Math.min(1, t + 0.01))
  const l = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1
  return [(q[0] - p[0]) / l, (q[1] - p[1]) / l]
}
const cpath = (c: Cubic): string =>
  `M${f(c[0][0])} ${f(c[0][1])}C${c
    .slice(1)
    .map(p => `${f(p[0])} ${f(p[1])}`)
    .join(' ')}`

// Tick marks in little clusters along a stroke, like a railway drawn in pen.
function ticks(c: Cubic, from: number, to: number, r: () => number): string {
  let d = ''
  let t = from
  while (t < to) {
    const n = 2 + Math.floor(r() * 4)
    for (let k = 0; k < n && t < to; k++) {
      const p = cpt(c, t)
      const v = cdir(c, t)
      const h = k % 2 ? 5 : 10
      d += `M${f(p[0] - v[1] * h)} ${f(p[1] + v[0] * h)}l${f(v[1] * h * 2)} ${f(-v[0] * h * 2)}`
      t += 0.012
    }
    t += 0.05 + r() * 0.08
  }
  return d
}

// A hatched hub with rays, the knot where sweeps cross.
function burst(cx: number, cy: number, rad: number, rays: number, len: number, r: () => number, clipX: [number, number]): string {
  let d = `M${cx - rad} ${cy}a${rad} ${rad} 0 1 0 ${rad * 2} 0a${rad} ${rad} 0 1 0 ${-rad * 2} 0`
  for (let k = -2; k <= 2; k++) {
    const o = k * rad * 0.36
    const h = Math.sqrt(Math.max(0, rad * rad - o * o * 2)) * 0.7
    d += `M${f(cx + o - h * 0.7)} ${f(cy + o + h * 0.7)}l${f(h * 1.4)} ${f(-h * 1.4)}`
  }
  for (let k = 0; k < rays; k++) {
    const a = (k / rays) * Math.PI * 2 + r() * 0.2
    const r0 = rad + 6 + r() * 6
    const r1 = r0 + len * (0.4 + r() * 0.8)
    const x0 = cx + Math.cos(a) * r0
    let x1 = cx + Math.cos(a) * r1
    let y1 = cy + Math.sin(a) * r1
    if (x1 < clipX[0] || x1 > clipX[1]) {
      const lim = x1 < clipX[0] ? clipX[0] : clipX[1]
      const s = (lim - x0) / (x1 - x0)
      x1 = lim
      y1 = cy + Math.sin(a) * r0 + (y1 - cy - Math.sin(a) * r0) * s
    }
    d += `M${f(x0)} ${f(cy + Math.sin(a) * r0)}L${f(x1)} ${f(y1)}`
  }
  return d
}

export function pixelScene(isBusy: boolean, now: number): string {
  const r = rng(2606)
  const ink = vnoise(77, 46)

  // --- masses ------------------------------------------------------------------------------------
  const fA = blobField(
    [
      [110, 1150, 168],
      [60, 960, 128],
      [160, 806, 108],
      [204, 640, 84],
      [226, 500, 62],
      [50, 724, 82],
      [30, 1320, 112],
      [150, 372, 58],
      [64, 300, 50],
    ],
    11,
    0.44,
  )
  const fB = blobField(
    [
      [1210, 330, 128],
      [1104, 250, 64],
      [1250, 470, 92],
    ],
    23,
    0.6,
  )
  const fC = blobField(
    [
      [1176, 1010, 104],
      [1100, 916, 56],
      [1232, 1112, 88],
      [1130, 1110, 50],
    ],
    37,
    0.32,
  )
  const A = mass(fA, ink, 0, 240, 240, 1400, r, 0.06, 0.05)
  const B = mass(fB, ink, RS, 160, 1260, 560, r, -0.02, 0.06)
  const Cm = mass(fC, () => 0, RS, 840, 1260, 1200, r, 0.3, 0.45)

  // Low dark blocks along the bottom edge, rising higher at the two art columns.
  const nb = vnoise(91, 40)
  const floor: string[] = []
  for (let x = 0; x < W; x += C) {
    const art = x < SB || x >= RS
    const top = art ? 1250 : 1340
    for (let y = top; y < H; y += C) {
      const v = nb(x, y) + (y - top) / 260
      if (v > 0.72) floor.push(`<rect x="${x}" y="${y}" width="${C}" height="${C}" fill="${art ? at(TONES, (x + y) % 3 === 0 ? 1 : 0) : '#1f1f22'}"/>`)
    }
  }

  // Sparse grey blocks in the top band.
  const nt = vnoise(5, 34)
  const topBlocks: string[] = []
  for (let x = 260; x < W; x += C) {
    for (let y = 0; y < 140; y += C) {
      const v = nt(x, y) - y / 500
      if (v > 0.7) topBlocks.push(`<rect x="${x}" y="${y}" width="${C}" height="${C}" fill="${at(TONES, v > 0.78 ? 1 : 0)}"/>`)
    }
  }

  // Contours: outer outlines of each mass plus loose islands drifting off them.
  const fI = blobField(
    [
      [80, 250, 70],
      [190, 330, 46],
      [1120, 640, 40],
      [1220, 1290, 70],
    ],
    51,
    0.7,
  )
  const contours =
    contour(fA, 0.05, 0, 200, 250, 1410, 10) +
    contour(fB, 0.04, RS, 120, 1250, 620, 10) +
    contour(fC, 0.0, RS, 800, 1250, 1240, 10) +
    contour(fI, 0.12, 0, 160, 250, 420, 10) +
    contour(fI, 0.12, RS, 580, 1250, 700, 10) +
    contour(fI, 0.12, RS, 1200, 1250, 1410, 10)

  // --- red checker, black where it crosses the cream silhouette ----------------------------------
  const nc = vnoise(63, 30)
  const red: string[] = []
  const blk: string[] = []
  const blinkers: P[] = []
  const invA: string[] = []
  const invB: string[] = []
  for (let j = 0; j < 18; j++) {
    for (let i = 0; i < 8; i++) {
      const x = 1080 + i * C
      const y = 680 + j * C
      const edge = i === 0 || i === 7 || j < 2 || j > 15
      if (edge && nc(x, y) < 0.45) continue
      const inv = i >= 2 && i < 6 && j >= 3 && j < 8
      const on = (i + j) % 2 === 0
      const cell = `<rect x="${x}" y="${y}" width="${C}" height="${C}"/>`
      if (inv) {
        ;(on ? invA : invB).push(cell)
        continue
      }
      if (!on) continue
      if (Cm.cells.has(`${x},${y}`)) blk.push(cell)
      else {
        red.push(cell)
        if (blinkers.length < 5 && red.length % 6 === 2) blinkers.push([x, y])
      }
    }
  }

  // --- letters, some of them glitching -----------------------------------------------------------
  const G = 6
  const gA: string[][] = Array.from({ length: G }, () => [])
  const gB: string[][] = Array.from({ length: G }, () => [])
  const quiet: string[] = []
  let gi = 0
  const scramble = (s: string): string =>
    s
      .split('')
      .map(() => at('#%$@*0123456789XZQ+'.split(''), Math.floor(r() * 19)))
      .join('')
  for (const u of [...A.runs, ...B.runs]) {
    if (u.letters.length >= 3 && r() < 0.42) {
      at(gA, gi % G).push(textRun(u))
      at(gB, gi % G).push(textRun({ ...u, letters: scramble(u.letters) }))
      gi++
    } else quiet.push(textRun(u))
  }
  const darkLetters = [...A.light, ...B.light, ...Cm.light].map(u => textRun(u)).join('')

  // Lilac letter clouds in the top band and the right strip.
  const cloud = (x0: number, y0: number, rows: number, cols: number, seed: number): string => {
    const rr = rng(seed)
    const nz = vnoise(seed, 22)
    const LET = 'YZXWVUTSRQPZZYYX'
    let s = ''
    for (let j = 0; j < rows; j++) {
      let line = ''
      for (let i = 0; i < cols; i++) {
        const v = nz(i * 9, j * 14) - Math.abs(j - rows / 2) / (rows * 1.6)
        line += v > 0.42 ? at(LET.split(''), Math.floor(rr() * LET.length)) : ' '
      }
      if (line.trim()) s += `<text x="${x0}" y="${y0 + j * 15}" xml:space="preserve">${line}</text>`
    }
    return s
  }
  const clouds = cloud(300, 26, 7, 30, 17) + cloud(720, 40, 6, 26, 29) + cloud(RS + 4, 590, 5, 17, 41) + cloud(8, 170, 6, 22, 53)

  // --- purple ink ----------------------------------------------------------------------------------
  const S1: Cubic = [[-10, 1412], [60, 1250], [140, 1120], [252, 960]]
  const S2: Cubic = [[0, 1000], [90, 1090], [170, 1230], [250, 1392]]
  const S3: Cubic = [[RS + 2, 660], [1120, 600], [1180, 520], [1256, 430]]
  const S4: Cubic = [[RS + 4, 420], [1130, 462], [1196, 556], [1256, 640]]
  const S5: Cubic = [[262, 148], [330, 104], [420, 46], [530, -6]]
  const S6: Cubic = [[300, 150], [372, 104], [470, 44], [590, -6]]
  const S7: Cubic = [[RS + 4, 1188], [1120, 1120], [1190, 1104], [1256, 1132]]
  const spiral = (() => {
    const cx = 1186
    const cy = 92
    const pts: string[] = []
    for (let k = 0; k <= 46; k++) {
      const a = k * 0.42
      const rad = 3 + k * 0.9
      pts.push(`${f(cx + Math.cos(a) * rad)} ${f(cy + Math.sin(a) * rad * 0.9)}`)
    }
    return `M${pts.join('L')}l26 18`
  })()
  const nudge = (c: Cubic, dx: number, dy: number): Cubic => c.map(([x, y], i) => [x + dx * (i % 3 ? 1.6 : 1), y + dy]) as Cubic
  const inkMain = [S1, S2, S3, S4, S5].map(cpath).join('') + spiral
  const inkTwin = [nudge(S1, 9, 5), nudge(S3, 4, 9), nudge(S2, -8, 6)].map(cpath).join('')
  const inkFine =
    cpath(S7) +
    ticks(S1, 0.08, 0.95, r) +
    ticks(S3, 0.05, 0.9, r) +
    ticks(S5, 0.05, 0.9, r) +
    ticks(S7, 0.1, 0.9, r) +
    burst(132, 1176, 16, 14, 46, r, [2, SB - 4]) +
    burst(1166, 538, 13, 12, 40, r, [RS + 2, W]) +
    burst(1160, 1262, 11, 10, 36, r, [RS + 2, W]) +
    burst(196, 262, 9, 9, 28, r, [2, SB - 4]) +
    `M${RS + 10} 1350q60 -40 120 -8t110 -30` +
    `M14 560q40 -60 110 -50t96 -64`
  const dots = [
    [118, 1060],
    [214, 1210],
    [1092, 512],
    [1232, 590],
    [612, 18],
    [1100, 1236],
  ]
    .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.2"/>`)
    .join('')
  const glyphs = [
    [180, 1110, '∂'],
    [30, 1060, 'φ'],
    [1198, 486, 'ψ'],
    [1076, 560, 'Σ'],
    [1206, 1222, '∫'],
    [560, 92, 'λ'],
  ]
    .map(([x, y, g]) => `<text x="${x}" y="${y}">${g}</text>`)
    .join('')

  // --- motion --------------------------------------------------------------------------------------
  const sp = isBusy ? 0.45 : 1 // busy runs everything faster
  const glitch = gA
    .map((runs, k) => {
      const dur = (6 + k * 1.7) * sp
      const d = begin(now, dur, k * 2.3)
      return `<g class="ga" style="animation-duration:${f(dur)}s;animation-delay:${d}">${runs.join('')}</g><g class="gb" fill="#efe6cf" style="animation-duration:${f(dur)}s;animation-delay:${d}">${at(gB, k).join('')}</g>`
    })
    .join('')

  const blinks = blinkers
    .map(([x, y], k) => {
      const dur = (2.2 + k * 0.9) * sp
      return `<rect class="bk" x="${x}" y="${y}" width="${C}" height="${C}" style="animation-duration:${f(dur)}s;animation-delay:${begin(now, dur, k * 0.7)}"/>`
    })
    .join('')
  const invDur = 9 * sp
  const inv = `<g class="ia" style="animation-duration:${f(invDur)}s;animation-delay:${begin(now, invDur, 1.3)}">${invA.join('')}</g><g class="ib" style="animation-duration:${f(invDur)}s;animation-delay:${begin(now, invDur, 1.3)}">${invB.join('')}</g>`

  // Odometer cells: a column of digits rolled through a one-cell window.
  const odoCells: [number, number, number][] = [
    [1100, 300, 10],
    [1120, 300, 1],
    [1140, 300, 0.1],
  ]
  const odo = odoCells
    .map(([x, y, per], k) => {
      const dur = per * 10 * sp
      const digits = '0123456789'
        .split('')
        .map((d, i) => `<tspan x="${x + C / 2}" y="${y + 15 + i * C}">${d}</tspan>`)
        .join('')
      return `<clipPath id="oc${k}"><rect x="${x}" y="${y}" width="${C}" height="${C}"/></clipPath><rect x="${x}" y="${y}" width="${C}" height="${C}" fill="${INK}"/><g clip-path="url(#oc${k})"><text class="od" style="animation-duration:${f(Math.max(0.6, dur))}s;animation-delay:${begin(now, Math.max(0.6, dur), k * 3.1)}">${digits}</text></g>`
    })
    .join('')

  const curDur = 18 * sp
  const cursor = `<rect class="cu" x="300" y="98" width="12" height="20" style="animation-duration:${f(curDur)}s,${isBusy ? 0.5 : 1.1}s;animation-delay:${begin(now, curDur)},${begin(now, 1.1)}"/>`

  const scanDur = isBusy ? 3.6 : 8
  const scan = [
    [0, SB],
    [RS, W - RS],
  ]
    .map(([x, w]) => `<rect class="sc" x="${x}" y="-80" width="${w}" height="80" fill="url(#sl)" style="animation-duration:${scanDur}s;animation-delay:${begin(now, scanDur)}"/>`)
    .join('')

  const drawDur = 14
  const pen = isBusy
    ? [S1, S3]
        .map(
          (c, k) =>
            `<circle r="4.5" fill="#e9d9ff"><animateMotion dur="${2.6 + k}s" begin="${begin(now, 2.6 + k, k)}" repeatCount="indefinite" path="${cpath(c)}"/></circle>`,
        )
        .join('')
    : ''

  return `${open()}
<defs>
<pattern id="gp" width="100" height="100" patternUnits="userSpaceOnUse"><path d="M0 .5H100M0 20.5H100M0 40.5H100M0 60.5H100M0 80.5H100M.5 0V100M20.5 0V100M40.5 0V100M60.5 0V100M80.5 0V100" stroke="#fff" stroke-opacity=".045" fill="none"/><path d="M0 .5H100M.5 0V100" stroke="#fff" stroke-opacity=".06" fill="none"/></pattern>
<linearGradient id="sl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e2dac4" stop-opacity="0"/><stop offset=".9" stop-color="#e2dac4" stop-opacity="${isBusy ? 0.16 : 0.08}"/><stop offset="1" stop-color="#fff" stop-opacity="${isBusy ? 0.5 : 0.28}"/></linearGradient>
</defs>
<style>
text{font-family:${MONO}}
.lt text{font-size:15px;font-weight:600;text-anchor:middle}
.ga{animation-name:ga;animation-iteration-count:infinite;animation-timing-function:steps(1)}
.gb{opacity:0;animation-name:gb;animation-iteration-count:infinite;animation-timing-function:steps(1)}
@keyframes ga{0%,78%{opacity:1}80%,86%{opacity:0}88%,100%{opacity:1}}
@keyframes gb{0%,78%{opacity:0}80%,86%{opacity:1}88%,100%{opacity:0}}
.bk{fill:${RED};animation-name:bk;animation-iteration-count:infinite;animation-timing-function:steps(1)}
@keyframes bk{0%,55%{fill:${RED}}56%,100%{fill:${BG}}}
.ia{animation-name:ga;animation-iteration-count:infinite;animation-timing-function:steps(1)}
.ib{opacity:0;animation-name:gb;animation-iteration-count:infinite;animation-timing-function:steps(1)}
.od{font-size:15px;font-weight:600;text-anchor:middle;fill:#e2dac4;animation-name:od;animation-iteration-count:infinite;animation-timing-function:steps(10)}
@keyframes od{from{transform:translateY(0)}to{transform:translateY(-200px)}}
.cu{fill:#e2dac4;opacity:.75;animation-name:cm,cb;animation-iteration-count:infinite;animation-timing-function:steps(36),steps(1)}
@keyframes cm{from{transform:translateX(0)}to{transform:translateX(720px)}}
@keyframes cb{0%,50%{opacity:.75}51%,100%{opacity:0}}
.sc{animation-name:sc;animation-iteration-count:infinite;animation-timing-function:linear}
@keyframes sc{from{transform:translateY(0)}to{transform:translateY(${H + 80}px)}}
.dr{stroke-dasharray:1 1;animation:dr ${drawDur}s ease-in-out infinite;animation-delay:${begin(now, drawDur)}}
@keyframes dr{0%{stroke-dashoffset:1}45%,70%{stroke-dashoffset:0}100%{stroke-dashoffset:-1}}
</style>
<rect width="${W}" height="${H}" fill="${BG}"/>
<rect width="${W}" height="${H}" fill="url(#gp)"/>
<g>${topBlocks.join('')}${floor.join('')}</g>
<g opacity=".82">${A.rects}</g>
<g>${B.rects}${Cm.rects}</g>
<g fill="${RED}">${red.join('')}</g>
<g fill="#121212">${blk.join('')}</g>
<g fill="${RED}">${inv}</g>
${blinks}
<path d="${contours}" fill="none" stroke="#e2dac4" stroke-width="1.2" stroke-opacity=".55"/>
<g class="lt" fill="#8d887c">${quiet.join('')}${glitch}</g>
<g class="lt" fill="${INK}">${darkLetters}</g>
<g fill="${LILAC}" opacity=".62" style="font-size:13px;font-weight:700">${clouds}</g>
${odo}
<g fill="none" stroke="${PURPLE}" stroke-linecap="round" stroke-linejoin="round" opacity=".88"><path d="${inkMain}" stroke-width="3.6"/><path d="${inkTwin}" stroke-width="1.6"/><path d="${inkFine}" stroke-width="1.9"/><path class="dr" d="${cpath(S6)}" pathLength="1" stroke-width="2"/></g>
<g fill="${PURPLE}" opacity=".9">${dots}</g>
<g fill="${PURPLE}" opacity=".8" style="font-size:18px">${glyphs}</g>
${cursor}
${scan}
${pen}
</svg>`
}
