// Sigil: a night-black ground with film grain and a faint cloudy floor. In the
// right strip, half of a hand-drawn instrument: stacked concentric ellipses on one vertical axis,
// numbered nodes, dashed plumb lines, cut off by the window edge. Beads travel the rings, perspective
// hands sweep three of them and two loose orbits precess. Under the sidebar, a tall bone-white
// cybersigil (thorned cells on a spine) breathes. While busy, a light runs down the axis, the nodes
// light up tier by tier as it passes and the base ripples.
import { W, H, ZONES, rng, begin, open } from './kit'

type P = [number, number]
type Tier = { cy: number; rings: number[] }

const AX = 1236 // the diagram's axis, near the right edge so half of it sits off-canvas
const K = 0.2 // ellipse squash (ry / rx)
const RX0 = ZONES.right.x0 + 4 // nothing in the diagram reaches left of this
const SB = ZONES.sidebar.x1

const INK = '#e8e8f0'
const DIM = '#b9b9cc'
const CYAN = '#34e3e3'
const VIOLET = '#8b5cff'
const BG = '#08080c'

const TIERS: Tier[] = [
  { cy: 92, rings: [62] },
  { cy: 274, rings: [128, 62] },
  { cy: 484, rings: [172, 122, 56] },
  { cy: 702, rings: [172, 124, 58] },
  { cy: 918, rings: [146, 98, 46] },
  { cy: 1118, rings: [116, 56] },
  { cy: 1300, rings: [64] },
]

const f = (n: number): string => (Math.round(n * 10) / 10).toString()

function at<T>(xs: readonly T[], i: number): T {
  const v = xs[i]
  if (v === undefined) throw new Error(`index ${i}`)
  return v
}

// A point on a ring; th in degrees, screen orientation (90 = front, 180 = left vertex, 270 = back).
const ept = (rx: number, cy: number, th: number): P => {
  const a = (th * Math.PI) / 180
  return [AX + rx * Math.cos(a), cy + rx * K * Math.sin(a)]
}

const ringPath = (rx: number, cy: number, ccw: boolean): string => {
  const ry = f(rx * K)
  const s = ccw ? 0 : 1
  return `M${f(AX - rx)} ${cy}a${rx} ${ry} 0 1 ${s} ${rx * 2} 0a${rx} ${ry} 0 1 ${s} ${-rx * 2} 0`
}

// --- the sigil -----------------------------------------------------------------------------------

const quad = (a: P, c: P, b: P, t: number): P => {
  const u = 1 - t
  return [u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]]
}
const quadD = (a: P, c: P, b: P, t: number): P => [
  2 * (1 - t) * (c[0] - a[0]) + 2 * t * (b[0] - c[0]),
  2 * (1 - t) * (c[1] - a[1]) + 2 * t * (b[1] - c[1]),
]

// A filled ribbon along a quadratic curve, its width varying along the way.
function ribbon(a: P, c: P, b: P, width: (t: number) => number, n: number): string {
  const left: P[] = []
  const right: P[] = []
  for (let i = 0; i <= n; i++) {
    const t = i / n
    const p = quad(a, c, b, t)
    const d = quadD(a, c, b, t)
    const len = Math.hypot(d[0], d[1]) || 1
    const nx = -d[1] / len
    const ny = d[0] / len
    const h = width(t) / 2
    left.push([p[0] + nx * h, p[1] + ny * h])
    right.push([p[0] - nx * h, p[1] - ny * h])
  }
  const pts = left.concat(right.reverse())
  return `M${pts.map(q => `${f(q[0])} ${f(q[1])}`).join('L')}Z`
}

// A bone between two joints: thick where it meets them, lean in the middle, bowed by `bow`.
function bone(a: P, b: P, bow: number, wEnd: number, wMid: number): string {
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  const len = Math.hypot(dx, dy)
  const c: P = [(a[0] + b[0]) / 2 + (-dy / len) * bow * len, (a[1] + b[1]) / 2 + (dx / len) * bow * len]
  return ribbon(a, c, b, t => wMid + (wEnd - wMid) * Math.pow(Math.abs(2 * t - 1), 3), 14)
}

// A thorn from a joint: wide at the root, curling to a point.
function thorn(p: P, angle: number, len: number, bend: number, w0: number): string {
  const a = (angle * Math.PI) / 180
  const tip: P = [p[0] + Math.cos(a) * len, p[1] + Math.sin(a) * len]
  const c: P = [
    (p[0] + tip[0]) / 2 - Math.sin(a) * bend * len,
    (p[1] + tip[1]) / 2 + Math.cos(a) * bend * len,
  ]
  return ribbon(p, c, tip, t => w0 * Math.pow(1 - t, 1.25) + 0.4, 12)
}

function sigil(): { body: string; joints: string; holes: string } {
  const r = rng(4417)
  const parts: string[] = []
  const joints: string[] = []
  const holes: string[] = []

  // A winding ladder of joints: each rung pair bounds one stone-like cell.
  const L: P[] = []
  const R: P[] = []
  const N = 10
  let y = 262
  for (let i = 0; i < N; i++) {
    const cx = 126 + 34 * Math.sin(i * 1.3 + 0.4)
    const hw = 40 + r() * 30
    const tilt = (i % 2 ? 1 : -1) * (24 + r() * 36)
    L.push([Math.max(30, cx - hw), y - tilt / 2])
    R.push([Math.min(SB - 30, cx + hw), y + tilt / 2])
    y += 72 + r() * 52
  }
  const top: P = [134, 146]
  const last = at(L, N - 1)
  const lastR = at(R, N - 1)
  const bot: P = [(last[0] + lastR[0]) / 2 - 8, Math.max(last[1], lastR[1]) + 84]

  // Rails bow outward, rungs wobble; two rungs left out so cells merge into taller ones.
  parts.push(bone(top, at(L, 0), 0.18, 26, 12))
  parts.push(bone(top, at(R, 0), -0.18, 26, 12))
  for (let i = 0; i < N - 1; i++) {
    parts.push(bone(at(L, i), at(L, i + 1), 0.16 + r() * 0.12, 28, 11 + r() * 4))
    parts.push(bone(at(R, i), at(R, i + 1), -(0.16 + r() * 0.12), 28, 11 + r() * 4))
  }
  // h: straight across, d / e: a diagonal down to the next level, -: open (cells merge)
  const RUNGS = 'hhd-heh-dh'
  for (let i = 0; i < N; i++) {
    const k = RUNGS[i]
    const w = 8 + r() * 4
    const bow = (r() - 0.5) * 0.36
    if (k === 'h') parts.push(bone(at(L, i), at(R, i), bow, 25, w))
    else if (k === 'd' && i + 1 < N) parts.push(bone(at(L, i), at(R, i + 1), bow, 25, w))
    else if (k === 'e' && i + 1 < N) parts.push(bone(at(R, i), at(L, i + 1), bow, 25, w))
  }
  parts.push(bone(last, bot, 0.2, 26, 11))
  parts.push(bone(lastR, bot, -0.2, 26, 11))

  // Joints: webbed lumps, some pierced by a small dark hole.
  const all: P[] = [top, ...L, ...R, bot]
  all.forEach((p, i) => {
    const rot = Math.floor(r() * 180)
    joints.push(
      `<ellipse cx="${f(p[0])}" cy="${f(p[1])}" rx="${16 + (i % 3) * 2}" ry="${11 + (i % 2) * 3}" transform="rotate(${rot} ${f(p[0])} ${f(p[1])})"/>`,
    )
    if (i % 3 !== 1) {
      const hx = p[0] + (r() - 0.5) * 10
      const hy = p[1] + (r() - 0.5) * 8
      holes.push(`<ellipse cx="${f(hx)}" cy="${f(hy)}" rx="${f(2.6 + r() * 3)}" ry="${f(1.8 + r() * 2)}" transform="rotate(${Math.floor(r() * 180)} ${f(hx)} ${f(hy)})"/>`)
    }
  })

  // Thorns: outward from every joint, mostly sweeping up, some hooked down, a few fins inward.
  const spike = (p: P, s: number, i: number): void => {
    const up = s < 0 ? 198 + r() * 42 : 342 - r() * 42
    const room = s < 0 ? p[0] - 8 : SB - 6 - p[0]
    const len = Math.min(room / Math.max(0.3, Math.abs(Math.cos((up * Math.PI) / 180))), 62 + r() * 80)
    if (r() < 0.72) parts.push(thorn(p, up, len, s * (0.12 + r() * 0.2), 16 + r() * 8))
    if (i % 2 === 1) {
      const dn = s < 0 ? 148 - r() * 26 : 32 + r() * 26
      parts.push(thorn(p, dn, 38 + r() * 36, -s * 0.2, 14))
    }
    if (i % 3 === 2) parts.push(thorn(p, s < 0 ? 24 + r() * 30 : 156 - r() * 30, 20 + r() * 10, s * 0.2, 11))
  }
  L.forEach((p, i) => spike(p, -1, i))
  R.forEach((p, i) => spike(p, 1, i + 1))

  // The crown: two long antlers and a short side spur.
  parts.push(thorn(top, 250, 126, -0.24, 24))
  parts.push(thorn(top, 291, 112, 0.22, 21))
  parts.push(thorn([top[0] - 8, top[1] + 10], 198, 74, -0.26, 15))

  // The tail: one long spike curling down, with spurs.
  parts.push(thorn(bot, 99, 1410 - bot[1] + 10, 0.1, 26))
  parts.push(thorn([bot[0] - 3, bot[1] + 70], 150, 58, -0.3, 12))
  parts.push(thorn(bot, 34, 66, -0.25, 15))

  return { body: parts.join(''), joints: joints.join(''), holes: holes.join('') }
}

// --- the scene -----------------------------------------------------------------------------------

export function sigilScene(isBusy: boolean, now: number): string {
  const r = rng(7121)
  const lines: string[] = [] // static ring and plumb-line work
  const dots: string[] = [] // static nodes
  const nums: string[] = [] // numerals beside nodes
  const tierDots: string[][] = TIERS.map(() => []) // node positions per tier, for the busy glow
  let n = 1

  const node = (p: P, tier: number, label: boolean): void => {
    dots.push(`<circle cx="${f(p[0])}" cy="${f(p[1])}" r="3"/>`)
    at(tierDots, tier).push(`<circle cx="${f(p[0])}" cy="${f(p[1])}" r="7"/>`)
    if (!label) return
    const right = p[0] < 1214
    const x = right ? p[0] + 5 : p[0] - 5
    nums.push(`<text x="${f(Math.max(RX0, x))}" y="${f(p[1] - 5)}"${right ? '' : ' text-anchor="end"'}>${n++}</text>`)
  }

  // Number from the base up, like the reference drawing.
  const order = TIERS.map((_t, i) => i).reverse()
  for (const ti of order) {
    const t = at(TIERS, ti)
    t.rings.forEach(rx => {
      lines.push(`<ellipse cx="${AX}" cy="${t.cy}" rx="${rx}" ry="${f(rx * K)}"/>`)
      const count = rx > 100 ? 3 : 2
      for (let k = 0; k < count; k++) {
        const th = 98 + k * (150 / count) + r() * 30
        node(ept(rx, t.cy, th), ti, true)
      }
    })
    const outer = at(t.rings, 0)
    if (outer > 90) {
      // a radius to the front-left and a dashed chord through the centre
      const p = ept(outer, t.cy, 132 + r() * 20)
      lines.push(`<path d="M${AX} ${t.cy}L${f(p[0])} ${f(p[1])}"/>`)
      const a = ept(outer, t.cy, 204)
      const b = ept(outer, t.cy, 24)
      lines.push(`<path class="ds" d="M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}"/>`)
    }
  }

  // Plumb lines between tiers: from the front of a ring above to the back of a ring below.
  const plumbs: string[] = []
  const plumb = (ia: number, ib: number, d: number): void => {
    const a = at(TIERS, ia)
    const b = at(TIERS, ib)
    const ra = a.rings.filter(x => x > d + 4)
    const rb = b.rings.filter(x => x > d + 4)
    if (!ra.length || !rb.length) return
    const rxa = at(ra, Math.floor(r() * ra.length))
    const rxb = at(rb, Math.floor(r() * rb.length))
    const x = AX - d
    const y0 = a.cy + K * Math.sqrt(rxa * rxa - d * d)
    const y1 = b.cy - K * Math.sqrt(rxb * rxb - d * d)
    plumbs.push(`<path${r() < 0.55 ? ' class="ds"' : ''} d="M${f(x)} ${f(y0)}V${f(y1)}"/>`)
    dots.push(`<circle cx="${f(x)}" cy="${f(y0)}" r="2.1"/><circle cx="${f(x)}" cy="${f(y1)}" r="2.1"/>`)
    at(tierDots, ib).push(`<circle cx="${f(x)}" cy="${f(y1)}" r="6"/>`)
  }
  for (let i = 1; i < TIERS.length - 1; i++) {
    const lim = Math.min(at(at(TIERS, i).rings, 0), at(at(TIERS, i + 1).rings, 0)) - 8
    for (let k = 0; k < 4; k++) plumb(i, i + 1, 10 + r() * (lim - 10))
  }
  plumb(2, 4, 150)
  plumb(1, 3, 112)
  plumb(3, 5, 104)
  plumb(2, 5, 70)

  // The base: rays fanning left over the lit ground, with signed numerals.
  const base = at(TIERS, TIERS.length - 1)
  let rays = ''
  ;[-1, -2, -3].forEach((s, i) => {
    const y = base.cy - 14 + i * 14
    const x1 = AX - 78 - i * 8
    rays += `<path d="M${x1} ${y}L${x1 - 60 + i * 6} ${y + 4 - i * 6}"/>`
    nums.push(`<text x="${x1 - 66 + i * 6}" y="${y + 8 - i * 6}" text-anchor="end">${s}</text>`)
  })

  // --- motion -----------------------------------------------------------------------------------
  // Beads travelling the rings (half of each loop runs off the right edge).
  const beads: string[] = []
  TIERS.forEach((t, ti) => {
    t.rings.forEach((rx, ri) => {
      if ((ti + ri) % 2 === 1 && rx < 100) return
      const dur = 40 + rx * 0.35 + r() * 30
      beads.push(
        `<circle r="${rx > 100 ? 3.2 : 2.6}"><animateMotion dur="${f(dur)}s" begin="${begin(now, dur, r() * dur)}" repeatCount="indefinite" path="${ringPath(rx, t.cy, ti % 2 === 0)}"/></circle>`,
      )
    })
  })

  // Perspective hands sweeping three rings, a bead riding each tip.
  const hands = [2, 3, 4]
    .map((ti, k) => {
      const t = at(TIERS, ti)
      const rx = at(t.rings, 0)
      const dur = 56 + k * 22
      const dir = k === 1 ? -1 : 1
      const xs: string[] = []
      const ys: string[] = []
      for (let s = 0; s <= 36; s++) {
        const p = ept(rx, t.cy, dir * s * 10 + 90)
        xs.push(f(p[0]))
        ys.push(f(p[1]))
      }
      const b = begin(now, dur, k * 17.3)
      const anim = (attr: string, v: string[]): string =>
        `<animate attributeName="${attr}" values="${v.join(';')}" dur="${dur}s" begin="${b}" repeatCount="indefinite"/>`
      return `<line x1="${AX}" y1="${t.cy}" x2="${at(xs, 0)}" y2="${at(ys, 0)}">${anim('x2', xs)}${anim('y2', ys)}</line><circle class="tip" r="3.6" cx="${at(xs, 0)}" cy="${at(ys, 0)}">${anim('cx', xs)}${anim('cy', ys)}</circle>`
    })
    .join('')

  // Two loose orbits between the big tiers, slowly precessing.
  const orbits = [
    { cy: 594, rx: 150, dur: 46, o: 0 },
    { cy: 1018, rx: 118, dur: 62, o: 21 },
  ]
    .map(
      o =>
        `<ellipse class="pr" cx="${AX}" cy="${o.cy}" rx="${o.rx}" ry="${f(o.rx * K)}" style="transform-origin:${AX}px ${o.cy}px;animation-duration:${o.dur}s;animation-delay:${begin(now, o.dur * 2, o.o)}"/>`,
    )
    .join('')

  // Busy: a light running down the axis, nodes lighting tier by tier, a ripple at the base.
  const PULSE = 2.8
  const pulseTop = -70
  const pulseSpan = 1440
  let busy = ''
  if (isBusy) {
    const glow = tierDots
      .map((ds, ti) => {
        const cy = at(TIERS, ti).cy
        const tc = ((cy - (pulseTop + 70)) / pulseSpan) * PULSE
        const off = (((0.34 - tc) % PULSE) + PULSE) % PULSE
        return `<g class="gl" style="animation-delay:${begin(now, PULSE, off)}">${ds.join('')}</g>`
      })
      .join('')
    const tcBase = ((base.cy - (pulseTop + 70)) / pulseSpan) * PULSE
    const rip = begin(now, PULSE, (((-tcBase) % PULSE) + PULSE) % PULSE)
    busy = `<g fill="${CYAN}">${glow}</g>
<rect x="${AX - 2.5}" y="${pulseTop}" width="5" height="140" fill="url(#pl)"><animate attributeName="y" from="${pulseTop}" to="${pulseTop + pulseSpan}" dur="${PULSE}s" begin="${begin(now, PULSE)}" repeatCount="indefinite"/></rect>
<ellipse cx="${AX}" cy="${base.cy}" rx="40" ry="8" fill="none" stroke="${CYAN}" stroke-width="1.6"><animate attributeName="rx" values="40;170" dur="${PULSE}s" begin="${rip}" repeatCount="indefinite"/><animate attributeName="ry" values="8;34" dur="${PULSE}s" begin="${rip}" repeatCount="indefinite"/><animate attributeName="opacity" values=".9;0" dur="${PULSE}s" begin="${rip}" repeatCount="indefinite"/></ellipse>`
  }

  const sg = sigil()
  const breathe = 10

  return `${open()}
<defs>
<filter id="gr" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".62" numOctaves="2" seed="11" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 .92 0 0 0 0 .92 0 0 0 0 .96 2.6 0 0 0 -1.15"/></filter>
<filter id="cl" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".0032 .009" numOctaves="4" seed="5"/><feColorMatrix values="0 0 0 0 .62 0 0 0 0 .63 0 0 0 0 .7 1.9 0 0 0 -.78"/></filter>
<linearGradient id="fl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".45" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="1"/></linearGradient>
<mask id="fm"><rect y="760" width="${W}" height="${H - 760}" fill="url(#fl)"/></mask>
<radialGradient id="pool"><stop offset="0" stop-color="#d8dbe6" stop-opacity=".34"/><stop offset=".5" stop-color="#9aa0b4" stop-opacity=".12"/><stop offset="1" stop-color="#9aa0b4" stop-opacity="0"/></radialGradient>
<radialGradient id="aura"><stop offset="0" stop-color="${VIOLET}" stop-opacity=".22"/><stop offset=".6" stop-color="${VIOLET}" stop-opacity=".07"/><stop offset="1" stop-color="${VIOLET}" stop-opacity="0"/></radialGradient>
<linearGradient id="pl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${CYAN}" stop-opacity="0"/><stop offset=".8" stop-color="#e6fffd" stop-opacity="1"/><stop offset="1" stop-color="${CYAN}" stop-opacity="0"/></linearGradient>
</defs>
<style>
.ln{fill:none;stroke:${INK};stroke-width:1.9;stroke-linecap:round}
.ln .ds{stroke-dasharray:5 6;stroke:${DIM};stroke-width:1.3}
.pl{fill:none;stroke:${DIM};stroke-width:1.3;opacity:.9}
.pl .ds{stroke-dasharray:4 5}
.nm{font:13px ui-monospace,Menlo,monospace;fill:${INK};opacity:.82}
.pr{fill:none;stroke:${DIM};stroke-width:1.4;stroke-dasharray:3 7;opacity:.85;animation-name:prec;animation-timing-function:ease-in-out;animation-iteration-count:infinite;animation-direction:alternate}
@keyframes prec{from{transform:rotate(-7deg) scaleY(.8)}to{transform:rotate(6deg) scaleY(1.3)}}
.sg{animation:br ${breathe}s ease-in-out infinite;animation-delay:${begin(now, breathe)}}
@keyframes br{0%,100%{opacity:${isBusy ? 0.72 : 0.64}}50%{opacity:${isBusy ? 0.95 : 0.8}}}
.au{animation:br2 ${breathe}s ease-in-out infinite;animation-delay:${begin(now, breathe)}}
@keyframes br2{0%,100%{opacity:${isBusy ? 0.7 : 0.45}}50%{opacity:${isBusy ? 1 : 0.7}}}
.hd line{stroke:${INK};stroke-width:1.15;opacity:${isBusy ? 0.9 : 0.6}}
.hd .tip{fill:${isBusy ? CYAN : INK}}
.gl{opacity:.1;animation:gl ${PULSE}s linear infinite}
@keyframes gl{0%{opacity:.1}12%{opacity:.85}45%{opacity:.18}100%{opacity:.1}}
</style>
<rect width="${W}" height="${H}" fill="${BG}"/>
<rect width="${W}" height="${H}" filter="url(#cl)" mask="url(#fm)" opacity=".34"/>
<ellipse cx="${AX - 20}" cy="${base.cy + 26}" rx="300" ry="96" fill="url(#pool)"/>
<ellipse cx="128" cy="740" rx="170" ry="640" fill="url(#aura)" class="au"/>
<g fill="#ecebf4" class="sg"><path d="${sg.body}"/>${sg.joints}</g>
<g fill="${BG}" opacity=".85">${sg.holes}</g>
<path d="M${AX} ${at(TIERS, 0).cy}V${base.cy}" stroke="${INK}" stroke-width="2.4"/>
<path d="M${AX - 7} ${at(TIERS, 1).cy + 14}V${base.cy - 14}" stroke="${DIM}" stroke-width="1" stroke-dasharray="6 7" opacity=".7"/>
<g class="ln">${lines.join('')}${rays}</g>
<g class="pl">${plumbs.join('')}</g>
${orbits}
<g fill="${INK}">${dots.join('')}</g>
<g class="nm">${nums.join('')}</g>
<g class="ln hd">${hands}</g>
<g fill="${INK}" opacity="${isBusy ? 0.95 : 0.8}">${beads.join('')}</g>
${busy}
<rect width="${W}" height="${H}" filter="url(#gr)" opacity=".2"/>
</svg>`
}
