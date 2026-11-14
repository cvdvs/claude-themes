// Clusters: a graph view. Dense multicolored node clusters on pure black, joined
// by fine grey edges, with bundles and a few long links between clusters. The graph stands in a
// column down the right of the window, where reply lines end, and is framed by a band along the top
// and one along the bottom that thin out toward the left; a fine chain of nodes runs down the narrow
// margin left of the replies. The sidebar only gets a faint glow, the chat text a dark one.
// Motion: nodes twinkle softly; while busy, small pulses of light run along the edges.

import { W, H, rng, begin, open } from './kit'

type Region = 'right' | 'top' | 'foot' | 'edge'
type Node = { x: number; y: number; s: number; c: number }
type Cluster = { x: number; y: number; rad: number; c: number; region: Region; shape: number; ids: number[] }
type Twinkle = { x: number; y: number; r: number; c: number; d: number }
type Walk = { path: string; d: number; c: number }

// cyan, green, magenta, orange, violet, yellow, blue, red
const PAL = ['#2ed8ec', '#45e27b', '#f24bd0', '#ff8a36', '#9d66ff', '#f4e23e', '#4f7eff', '#ff5569']
// Node radii by size class.
const SIZES = [1.5, 2.2, 3, 4.3]
// Where the reply text sits in the app window: nothing but a dark glow goes here. Left of it is a
// thin margin (x 256 to 298) and the sidebar, which is drawn almost solid.
const T = { x0: 298, x1: 992, y0: 104, y1: 1244 }
const SIDE = 258

const col = (i: number): string => PAL[i % PAL.length] ?? '#ffffff'
const rad = (s: number): number => SIZES[s] ?? 2

// Most of the way to white, for the twinkle cores and the pulses.
function light(hex: string): string {
  const n = parseInt(hex.slice(1), 16)
  const ch = (s: number) => Math.round(((n >> s) & 255) * 0.45 + 255 * 0.55)
  return `#${((ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).padStart(6, '0')}`
}

const inText = (x: number, y: number, m: number): boolean =>
  x > T.x0 - m && x < T.x1 + m && y > T.y0 - m && y < T.y1 + m

// A straight link is kept only if no part of it comes near the text zone or goes under the sidebar.
function clear(a: Node, b: Node): boolean {
  const n = Math.max(2, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 5))
  for (let i = 0; i <= n; i++) {
    const t = i / n
    const x = a.x + (b.x - a.x) * t
    if (x < SIDE || inText(x, a.y + (b.y - a.y) * t, 12)) return false
  }
  return true
}

const ok = (x: number, y: number): boolean => x > SIDE && x < W - 3 && y > 3 && y < H - 3 && !inText(x, y, 14)

// How far a point is from the text zone.
const roomOf = (x: number, y: number): number =>
  Math.hypot(Math.max(T.x0 - x, 0, x - T.x1), Math.max(T.y0 - y, 0, y - T.y1))

const G = (() => {
  const rand = rng(1607)
  const jit = (s: number) => (rand() - 0.5) * 2 * s
  const nodes: Node[] = []
  const clusters: Cluster[] = []

  // The right column: three loose lanes from the top corner to the bottom one, the outer lane
  // carrying the biggest clusters. [x, radius, color]
  const rightSpec: Array<[number, number, number]> = [
    [1180, 30, 4], [1090, 20, 5], [1206, 40, 0], [1048, 17, 7], [1158, 34, 1], [1214, 28, 2], [1074, 22, 3],
    [1184, 42, 6], [1046, 17, 5], [1206, 32, 7], [1110, 26, 0], [1196, 38, 4], [1130, 30, 1],
  ]
  rightSpec.forEach(([x, r, c], i) =>
    clusters.push({ x: x + jit(10), y: 58 + i * 108 + jit(16), rad: r + jit(3), c, region: 'right', shape: i % 3, ids: [] }),
  )
  // The top band, right of the chat title, thinning out toward the left. [x, y, radius, color]
  const topSpec: Array<[number, number, number, number]> = [
    [950, 46, 26, 3], [830, 64, 22, 1], [712, 40, 19, 6], [598, 62, 15, 2], [492, 48, 12, 5],
  ]
  topSpec.forEach(([x, y, r, c], i) =>
    clusters.push({ x: x + jit(12), y: y + jit(6), rad: r, c, region: 'top', shape: (i + 2) % 3, ids: [] }),
  )
  // The bottom band: one row between the last reply and the input box, one under the input box.
  const footSpec: Array<[number, number, number, number]> = [
    [924, 1284, 27, 7], [800, 1386, 20, 0], [676, 1282, 22, 4], [548, 1388, 16, 3], [430, 1284, 15, 6], [330, 1390, 11, 2],
  ]
  footSpec.forEach(([x, y, r, c], i) =>
    clusters.push({ x: x + jit(12), y: y + jit(4), rad: r, c, region: 'foot', shape: i % 2 ? 0 : 1, ids: [] }),
  )

  const addNode = (x: number, y: number, s: number, c: number): number => {
    nodes.push({ x, y, s, c })
    return nodes.length - 1
  }
  const nodeColor = (main: number) => (rand() < 0.7 ? main : Math.floor(rand() * PAL.length))
  const nodeSize = () => {
    const p = rand()
    return p < 0.36 ? 0 : p < 0.72 ? 1 : p < 0.93 ? 2 : 3
  }

  // Scatter one cluster's nodes around (cx, cy) in its shape.
  const scatter = (cl: Cluster, cx: number, cy: number, r: number, shape: number, count: number) => {
    const theta = cl.region === 'right' ? rand() * Math.PI : jit(0.35)
    const dx = Math.cos(theta)
    const dy = Math.sin(theta)
    if (shape === 2 && ok(cx, cy)) cl.ids.push(addNode(cx, cy, 3, cl.c))
    for (let i = 0; i < count; i++) {
      for (let tries = 0; tries < 8; tries++) {
        let x = cx
        let y = cy
        if (shape === 0) {
          // Blob: dense core, thinning out.
          const a = rand() * Math.PI * 2
          const d = r * Math.min(1.4, Math.sqrt(-2 * Math.log(1 - rand() * 0.97)) * 0.48)
          x += Math.cos(a) * d
          y += Math.sin(a) * d
        } else if (shape === 1) {
          // Filament: a bent chain, thick in the middle.
          const t = rand() * 2 - 1
          const bend = Math.sin(t * 2.2) * r * 0.4
          const w = (1 - Math.abs(t)) * r * 0.22 + 2
          x += dx * t * r * 1.5 - dy * (bend + jit(w))
          y += dy * t * r * 1.5 + dx * (bend + jit(w))
        } else {
          // Star: rays out of a hub.
          const ray = Math.floor(rand() * 7)
          const a = theta + (ray / 7) * Math.PI * 2 + jit(0.1)
          const d = r * (0.2 + rand() * rand() * 1.1)
          x += Math.cos(a) * d + jit(3)
          y += Math.sin(a) * d + jit(3)
        }
        if (ok(x, y)) {
          cl.ids.push(addNode(x, y, nodeSize(), nodeColor(cl.c)))
          break
        }
      }
    }
  }

  const sats: Cluster[] = []
  clusters.forEach(cl => {
    const big = Math.round(cl.rad * (cl.region === 'right' ? 2.1 : 1.7))
    scatter(cl, cl.x, cl.y, cl.rad, cl.shape, big + Math.floor(rand() * 12))
    // One or two tight satellite groups nearby, in a neighboring color.
    const nSat = cl.region === 'right' ? 1 + Math.floor(rand() * 2) : cl.rad > 13 ? 1 : 0
    for (let s = 0; s < nSat; s++) {
      const a = cl.region === 'right' ? rand() * Math.PI * 2 : rand() < 0.5 ? jit(0.5) : Math.PI + jit(0.5)
      const d = cl.rad * (1.6 + rand() * 0.9)
      const sx = cl.x + Math.cos(a) * d
      const sy = cl.y + Math.sin(a) * d
      if (!ok(sx, sy)) continue
      const sat: Cluster = { x: sx, y: sy, rad: 9 + rand() * 7, c: rand() < 0.5 ? cl.c : (cl.c + 1 + Math.floor(rand() * 3)) % PAL.length, region: cl.region, shape: 0, ids: [] }
      scatter(sat, sx, sy, sat.rad, 0, 8 + Math.floor(rand() * 10))
      sats.push(sat)
    }
  })

  // The margin chain: small nodes down the thin strip between the sidebar and the replies, its color
  // drifting slowly from top to bottom.
  // Every so often a small bead of three or four nodes sits on it.
  const edge: Cluster = { x: 271, y: 680, rad: 0, c: 4, region: 'edge', shape: 0, ids: [] }
  for (let y = 70 + rand() * 10, k = 0; y < 1266; y += 22 + rand() * 14, k++) {
    const x = 271 + Math.sin(y / 170 + 1) * 6 + jit(2.5)
    const p = rand()
    const c = rand() < 0.7 ? (Math.floor(y / 190) + 4) % PAL.length : Math.floor(rand() * PAL.length)
    if (!ok(x, y)) continue
    edge.ids.push(addNode(x, y, p < 0.35 ? 0 : p < 0.82 ? 1 : 2, c))
    if (k % 6 === 3) for (let b = 0; b < 3; b++) if (ok(x + jit(7), y)) edge.ids.push(addNode(x + jit(7), y + jit(9), rand() < 0.5 ? 0 : 1, nodeColor(c)))
  }
  const mains = clusters.slice()
  clusters.push(edge)
  const groups = [...clusters, ...sats]

  // Loose nodes around the frame, like the strays in a real graph view.
  const strays: number[] = []
  for (let i = 0; i < 120; i++) {
    const p = rand()
    const x = p < 0.55 ? 1004 + rand() * 242 : p < 0.78 ? 480 + rand() * 520 : 300 + rand() * 700
    const y = p < 0.55 ? 8 + rand() * (H - 16) : p < 0.78 ? 6 + rand() * 84 : 1258 + rand() * 146
    if (ok(x, y)) strays.push(addNode(x, y, rand() < 0.7 ? 0 : 1, Math.floor(rand() * PAL.length)))
  }

  const nodeAt = (i: number): Node => nodes[i] ?? { x: 0, y: 0, s: 0, c: 0 }
  const dist = (i: number, j: number) => Math.hypot(nodeAt(i).x - nodeAt(j).x, nodeAt(i).y - nodeAt(j).y)
  const seen = new Set<string>()
  const adj = new Map<number, number[]>()
  const near: string[] = []
  const bundle: string[] = []
  const long: string[] = []
  const pt = (n: Node) => `${Math.round(n.x)} ${Math.round(n.y)}`
  const link = (i: number, j: number, into: string[], walkable: boolean): void => {
    if (i === j) return
    const key = i < j ? `${i}-${j}` : `${j}-${i}`
    if (seen.has(key)) return
    const a = nodeAt(i)
    const b = nodeAt(j)
    if (!clear(a, b)) return
    seen.add(key)
    into.push(`M${pt(a)}l${Math.round(b.x) - Math.round(a.x)} ${Math.round(b.y) - Math.round(a.y)}`)
    if (walkable) {
      adj.set(i, [...(adj.get(i) ?? []), j])
      adj.set(j, [...(adj.get(j) ?? []), i])
    }
  }
  const nearest = (i: number, pool: number[], n: number): number[] =>
    pool
      .filter(j => j !== i)
      .sort((p, q) => dist(i, p) - dist(i, q))
      .slice(0, n)
  const pickId = (ids: number[]): number => ids[Math.floor(rand() * ids.length)] ?? 0

  // Inside each group: every node to its nearest two or three; star clusters wired to their hub.
  groups.forEach(g => {
    g.ids.forEach(i => nearest(i, g.ids, rand() < 0.2 ? 3 : 2).forEach(j => link(i, j, near, true)))
    const hub = g.ids[0]
    if (g.shape === 2 && hub !== undefined) g.ids.forEach(j => rand() < 0.4 && link(hub, j, near, true))
  })
  // Satellites hang off their nearest main cluster.
  sats.forEach(s => {
    const host = mains.slice().sort((p, q) => Math.hypot(p.x - s.x, p.y - s.y) - Math.hypot(q.x - s.x, q.y - s.y))[0]
    if (host) for (let i = 0; i < 4; i++) link(pickId(s.ids), pickId(host.ids), near, true)
  })
  // Bundles of edges between neighboring clusters.
  mains.forEach((a, ai) => {
    mains
      .map((b, bi) => ({ b, bi, d: Math.hypot(a.x - b.x, a.y - b.y) }))
      .filter(o => o.bi > ai && o.d < 430)
      .sort((p, q) => p.d - q.d)
      .slice(0, 3)
      .forEach(({ b, d }) => {
        // Lighter between the small clusters of the two bands.
        const n = a.region !== 'right' && b.region !== 'right' ? Math.round(3 + rand() * 4) : Math.round((d < 250 ? 12 : 7) + rand() * 6)
        for (let i = 0; i < n; i++) link(pickId(a.ids), pickId(b.ids), bundle, true)
      })
  })
  // Long links: down the right column, along each band, and round the two corners.
  const byRegion = (r: Region) => mains.filter(c => c.region === r)
  const rights = byRegion('right')
  const tops = byRegion('top')
  const feet = byRegion('foot')
  const longPairs: Array<[Cluster | undefined, Cluster | undefined]> = []
  for (let i = 0; i + 2 < rights.length; i++) longPairs.push([rights[i], rights[i + 2 + (i % 3)]])
  for (let i = 0; i + 2 < tops.length; i++) longPairs.push([tops[i], tops[i + 2]])
  for (let i = 0; i + 2 < feet.length; i++) longPairs.push([feet[i], feet[i + 2]])
  const lastRight = rights[rights.length - 1]
  longPairs.push([tops[0], rights[0]], [tops[0], rights[2]], [tops[1], rights[0]], [tops[1], rights[1]])
  longPairs.push([feet[0], lastRight], [feet[1], lastRight], [feet[0], rights[rights.length - 2]], [feet[1], rights[rights.length - 3]])
  longPairs.forEach(([a, b]) => {
    if (!a || !b) return
    for (let i = 0; i < 4; i++) link(pickId(a.ids), pickId(b.ids), long, false)
  })
  // The margin chain ties into the far ends of both bands.
  const chainEnds = edge.ids.slice().sort((p, q) => nodeAt(p).y - nodeAt(q).y)
  const tieIn = (ends: number[], cl: Cluster | undefined) => {
    if (cl) ends.forEach(e => nearest(e, cl.ids, 2).forEach(j => link(e, j, long, true)))
  }
  tieIn(chainEnds.slice(0, 2), tops[tops.length - 1])
  tieIn(chainEnds.slice(-2), feet[feet.length - 1])
  tieIn(chainEnds.slice(-1), feet[feet.length - 2])
  // Strays hang off their nearest node.
  const all = nodes.map((_, i) => i)
  strays.forEach(i => nearest(i, all, 1 + Math.floor(rand() * 2)).forEach(j => link(i, j, near, false)))

  // Nodes that twinkle: spread across the clusters, favoring the bigger ones.
  const twinkles: Twinkle[] = []
  for (let round = 0; twinkles.length < 40 && round < 6; round++) {
    clusters.forEach(cl => {
      if (twinkles.length >= 40) return
      const id = cl.ids.filter(i => nodeAt(i).s >= 1)[Math.floor(rand() * 30)]
      if (id === undefined) return
      const n = nodeAt(id)
      if (twinkles.some(t => Math.hypot(t.x - n.x, t.y - n.y) < 16)) return
      twinkles.push({ x: n.x, y: n.y, r: rad(n.s), c: n.c, d: 3.4 + rand() * 4.6 })
    })
  }

  // Walks for the busy pulses: a few hops along edges, starting in different clusters.
  const walks: Walk[] = []
  for (let w = 0; walks.length < 14 && w < 80; w++) {
    const cl = clusters[(w * 5) % clusters.length]
    if (!cl) continue
    let cur = pickId(cl.ids)
    let prev = -1
    const pts: Node[] = [nodeAt(cur)]
    let len = 0
    for (let step = 0; step < 8 && len < 420; step++) {
      const options = (adj.get(cur) ?? []).filter(j => j !== prev).sort((p, q) => dist(cur, q) - dist(cur, p))
      const next = options[Math.floor(rand() * Math.min(2, options.length))]
      if (next === undefined) break
      len += dist(cur, next)
      prev = cur
      cur = next
      pts.push(nodeAt(cur))
    }
    if (len < 140) continue
    walks.push({ path: pts.map((p, i) => `${i ? 'L' : 'M'}${pt(p)}`).join(''), d: Math.min(6.5, Math.max(2.6, len / 80)), c: cl.c })
  }

  // Static nodes: one path per color and size, each node a zero-length round-capped stroke,
  // written as relative moves from the one before to keep the markup small.
  const dots = SIZES.map((r, s) =>
    PAL.map((hex, c) => {
      let px = 0
      let py = 0
      const d = nodes
        .filter(n => n.s === s && n.c === c)
        .sort((p, q) => p.y - q.y)
        .map((n, i) => {
          const x = Math.round(n.x)
          const y = Math.round(n.y)
          const out = i ? `m${x - px} ${y - py}h0` : `M${x} ${y}h0`
          px = x
          py = y
          return out
        })
        .join('')
      return d ? `<path stroke="${hex}" stroke-width="${r * 2}" d="${d}"/>` : ''
    }).join(''),
  ).join('')

  // A soft colored bloom under each cluster, its bright part kept clear of the text zone; and two
  // large faint glows under the sidebar, the only thing that shows through it.
  const halos =
    mains
      .map(cl => {
        const r = Math.max(cl.rad, Math.min(cl.rad * 2.3, roomOf(cl.x, cl.y) + 22))
        return `<circle cx="${Math.round(cl.x)}" cy="${Math.round(cl.y)}" r="${Math.round(r)}" fill="url(#h${cl.c})"/>`
      })
      .join('') + `<circle cx="96" cy="430" r="250" fill="url(#h4)" opacity=".5"/><circle cx="120" cy="1120" r="270" fill="url(#h0)" opacity=".42"/>`

  return { dots, halos, near: near.join(''), bundle: bundle.join(''), long: long.join(''), twinkles, walks }
})()

const GRADS = PAL.map(
  (hex, c) =>
    `<radialGradient id="h${c}"><stop offset="0" stop-color="${hex}" stop-opacity=".5"/><stop offset=".45" stop-color="${hex}" stop-opacity=".15"/><stop offset="1" stop-color="${hex}" stop-opacity="0"/></radialGradient>`,
).join('')

export function clustersScene(isBusy: boolean, now: number): string {
  const pace = isBusy ? 0.55 : 1
  const twinkles = G.twinkles
    .map((t, i) => {
      const d = t.d * pace
      const x = t.x.toFixed(1)
      const y = t.y.toFixed(1)
      return `<g class="tw" style="animation:tw ${d.toFixed(2)}s ${begin(now, d, i * 1.37)} infinite ease-in-out"><circle cx="${x}" cy="${y}" r="${(t.r * 4.5).toFixed(1)}" fill="url(#h${t.c})"/><circle cx="${x}" cy="${y}" r="${(t.r + 0.8).toFixed(1)}" fill="${light(col(t.c))}"/></g>`
    })
    .join('')

  const pulses = isBusy
    ? G.walks
        .map((w, i) => {
          const b = begin(now, w.d, i * 0.83)
          const d = `${w.d.toFixed(2)}s`
          return `<g opacity="0"><circle r="8" fill="url(#h${w.c})"/><circle r="2.2" fill="${light(col(w.c))}"/><animateMotion dur="${d}" begin="${b}" repeatCount="indefinite" path="${w.path}"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.12;.82;1" dur="${d}" begin="${b}" repeatCount="indefinite"/></g>`
        })
        .join('')
    : ''

  return `${open()}<defs>${GRADS}<radialGradient id="amb" gradientUnits="userSpaceOnUse" cx="${(T.x0 + T.x1) / 2}" cy="${(T.y0 + T.y1) / 2}" r="720"><stop offset="0" stop-color="#0a0a18"/><stop offset=".6" stop-color="#04040a"/><stop offset="1" stop-color="#000"/></radialGradient></defs>
<style>.tw{opacity:0}@keyframes tw{0%,100%{opacity:0}45%{opacity:1}60%{opacity:.8}}</style>
<rect width="${W}" height="${H}" fill="url(#amb)"/>
<g>${G.halos}</g>
<g fill="none" stroke="#a3aab6" stroke-linecap="round" opacity="${isBusy ? 1 : 0.85}"><path d="${G.long}" stroke-width=".8" stroke-opacity=".28"/><path d="${G.bundle}" stroke-width=".8" stroke-opacity=".34"/><path d="${G.near}" stroke-width="1" stroke-opacity=".55"/></g>
<g fill="none" stroke-linecap="round">${G.dots}</g>
${twinkles}${pulses}</svg>`
}
