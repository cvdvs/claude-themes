// Clusters: a graph view. Dense multicolored node clusters on pure black, joined
// by fine grey edges, with bundles and a few long links between clusters. Everything sits under the
// sidebar, in the right strip and along the top edge; the chat column only gets a dark glow.
// Motion: nodes twinkle softly; while busy, small pulses of light run along the edges.

import { W, H, ZONES, rng, begin, open } from './kit'

type Region = 'side' | 'right' | 'top' | 'foot'
type Node = { x: number; y: number; s: number; c: number }
type Cluster = { x: number; y: number; rad: number; c: number; region: Region; shape: number; ids: number[] }
type Twinkle = { x: number; y: number; r: number; c: number; d: number }
type Walk = { path: string; d: number; c: number }

// cyan, green, magenta, orange, violet, yellow, blue, red
const PAL = ['#2ed8ec', '#45e27b', '#f24bd0', '#ff8a36', '#9d66ff', '#f4e23e', '#4f7eff', '#ff5569']
// Node radii by size class.
const SIZES = [1.5, 2.2, 3, 4.3]
const T = ZONES.text

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

// A straight link is kept only if no part of it comes near the text zone.
function clear(a: Node, b: Node): boolean {
  const n = Math.max(2, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 5))
  for (let i = 0; i <= n; i++) {
    const t = i / n
    if (inText(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, 12)) return false
  }
  return true
}

const ok = (x: number, y: number): boolean => x > 3 && x < W - 3 && y > 3 && y < H - 3 && !inText(x, y, 14)

const G = (() => {
  const rand = rng(1607)
  const jit = (s: number) => (rand() - 0.5) * 2 * s
  const nodes: Node[] = []
  const clusters: Cluster[] = []

  // Cluster centers: a zigzag down the sidebar, a looser one down the right strip, a row along the top
  // and a sparse one along the very bottom. Sizes vary a lot, like a real graph.
  const sideColors = [0, 2, 1, 4, 3, 6, 5, 7, 0]
  const rightColors = [4, 5, 0, 7, 1, 2, 3, 6]
  const topColors = [3, 1, 6, 2, 5]
  sideColors.forEach((c, i) =>
    clusters.push({ x: (i % 2 ? 175 : 78) + jit(24), y: 70 + i * 160 + jit(40), rad: 26 + rand() * rand() * 34, c, region: 'side', shape: i % 3, ids: [] }),
  )
  rightColors.forEach((c, i) =>
    clusters.push({ x: (i % 2 ? 1132 : 1190) + jit(14), y: 74 + i * 182 + jit(30), rad: 24 + rand() * rand() * 26, c, region: 'right', shape: (i + 1) % 3, ids: [] }),
  )
  topColors.forEach((c, i) =>
    clusters.push({ x: 360 + i * 165 + jit(28), y: 64 + jit(24), rad: 18 + rand() * 10, c, region: 'top', shape: (i + 2) % 3, ids: [] }),
  )
  ;[7, 0, 4].forEach((c, i) =>
    clusters.push({ x: 430 + i * 250 + jit(40), y: 1394 + jit(5), rad: 9 + rand() * 4, c, region: 'foot', shape: 0, ids: [] }),
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
    const theta = rand() * Math.PI
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
    const big = Math.round(cl.rad * (cl.region === 'side' ? 1.9 : cl.region === 'right' ? 2 : 1.1))
    scatter(cl, cl.x, cl.y, cl.rad, cl.shape, big + Math.floor(rand() * 12))
    // One or two tight satellite groups nearby, in a neighboring color.
    const nSat = cl.region === 'foot' ? 0 : cl.region === 'top' ? 1 : 1 + Math.floor(rand() * 2)
    for (let s = 0; s < nSat; s++) {
      const a = rand() * Math.PI * 2
      const d = cl.rad * (1.6 + rand() * 0.9)
      const sx = cl.x + Math.cos(a) * d
      const sy = cl.y + Math.sin(a) * d
      if (!ok(sx, sy)) continue
      const sat: Cluster = { x: sx, y: sy, rad: 9 + rand() * 7, c: rand() < 0.5 ? cl.c : (cl.c + 1 + Math.floor(rand() * 3)) % PAL.length, region: cl.region, shape: 0, ids: [] }
      scatter(sat, sx, sy, sat.rad, 0, 8 + Math.floor(rand() * 10))
      sats.push(sat)
    }
  })
  const groups = [...clusters, ...sats]

  // Loose nodes around the edges, like the strays in a real graph view.
  const strays: number[] = []
  for (let i = 0; i < 110; i++) {
    const p = rand()
    const x = p < 0.43 ? 6 + rand() * 244 : p < 0.8 ? 1072 + rand() * 174 : 270 + rand() * 780
    const y = p < 0.8 ? 8 + rand() * (H - 16) : p < 0.94 ? 8 + rand() * 124 : 1380 + rand() * 24
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
    const host = clusters.slice().sort((p, q) => Math.hypot(p.x - s.x, p.y - s.y) - Math.hypot(q.x - s.x, q.y - s.y))[0]
    if (host) for (let i = 0; i < 4; i++) link(pickId(s.ids), pickId(host.ids), near, true)
  })
  // Bundles of edges between neighboring clusters.
  clusters.forEach((a, ai) => {
    clusters
      .map((b, bi) => ({ b, bi, d: Math.hypot(a.x - b.x, a.y - b.y) }))
      .filter(o => o.bi > ai && o.d < 430)
      .sort((p, q) => p.d - q.d)
      .slice(0, 3)
      .forEach(({ b, d }) => {
        const n = Math.round((d < 250 ? 12 : 7) + rand() * 6)
        for (let i = 0; i < n; i++) link(pickId(a.ids), pickId(b.ids), bundle, true)
      })
  })
  // Long links: down each side, and along the top between the two corners.
  const byRegion = (r: Region) => clusters.filter(c => c.region === r)
  const longPairs: Array<[Cluster | undefined, Cluster | undefined]> = []
  for (const r of ['side', 'right'] as const) {
    const cs = byRegion(r)
    for (let i = 0; i + 2 < cs.length; i++) longPairs.push([cs[i], cs[i + 2 + (i % 3)]])
  }
  const tops = byRegion('top')
  const side0 = byRegion('side')[0]
  const right0 = byRegion('right')[0]
  const feet = byRegion('foot')
  longPairs.push([byRegion('side')[8], feet[0]], [feet[0], feet[1]], [feet[1], feet[2]], [feet[2], byRegion('right')[7]])
  longPairs.push([side0, tops[2]], [tops[0], tops[3]], [tops[1], tops[4]], [tops[2], right0], [side0, right0], [side0, tops[4]])
  longPairs.forEach(([a, b]) => {
    if (!a || !b) return
    for (let i = 0; i < 4; i++) link(pickId(a.ids), pickId(b.ids), long, false)
  })
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

  // A soft colored bloom under each cluster, kept clear of the text zone.
  const halos = clusters
    .map(cl => {
      const room =
        cl.region === 'side' ? T.x0 + 6 - cl.x : cl.region === 'right' ? cl.x - (T.x1 - 6) : cl.region === 'top' ? T.y0 + 6 - cl.y : cl.y - (T.y1 + 30)
      const r = Math.max(cl.rad, Math.min(cl.rad * 2.3, room))
      return `<circle cx="${Math.round(cl.x)}" cy="${Math.round(cl.y)}" r="${Math.round(r)}" fill="url(#h${cl.c})"/>`
    })
    .join('')

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
