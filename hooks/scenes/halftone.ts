// Halftone: electric purple and indigo glow stacked down the right edge of the window, with
// arms of light reaching left along the header and under the input box, so the chat sits inside a
// lit bracket. Soft grey light beams fall through the right column, a dark diagonal shadow drifts
// up and down across it, and everything is seen through a fine halftone dot screen. The text column
// keeps only a dim ambient wash. Every soft shape is a gradient, not a blur filter, so the slow
// motion stays cheap.
import { W, H, rng, begin, open } from './kit'

type Glow = { cx: number; cy: number; rx: number; ry: number; grad: string; lo: number; hi: number }

// Hand-placed pools of light: a column down the right edge, arms along the top and bottom bands,
// a thin seam in the margin left of the cards and a faint wash under the sidebar.
const GLOWS: Glow[] = [
  { cx: W + 40, cy: 660, rx: 310, ry: 580, grad: 'gI', lo: 0.85, hi: 1 },
  { cx: W + 20, cy: 1050, rx: 280, ry: 340, grad: 'gP', lo: 0.72, hi: 0.98 },
  { cx: W - 20, cy: 230, rx: 240, ry: 250, grad: 'gV', lo: 0.55, hi: 0.8 },
  { cx: 920, cy: -30, rx: 640, ry: 210, grad: 'gI', lo: 0.55, hi: 0.82 },
  { cx: 800, cy: H + 30, rx: 700, ry: 270, grad: 'gP', lo: 0.62, hi: 0.92 },
  { cx: W - 30, cy: H - 40, rx: 320, ry: 280, grad: 'gM', lo: 0.72, hi: 1 },
  { cx: 273, cy: 880, rx: 22, ry: 600, grad: 'gP', lo: 0.4, hi: 0.72 },
  { cx: -60, cy: 1160, rx: 330, ry: 540, grad: 'gV', lo: 0.24, hi: 0.38 },
]

const stop = (o: number, c: string, a: number): string =>
  `<stop offset="${o}" stop-color="${c}" stop-opacity="${a}"/>`

const radial = (id: string, c0: string, c1: string, c2: string): string =>
  `<radialGradient id="${id}">${stop(0, c0, 1)}${stop(0.34, c1, 0.85)}${stop(0.66, c2, 0.32)}${stop(1, c2, 0)}</radialGradient>`

// A soft grey light beam: wide faint halo plus a narrow brighter core.
const beam = (x: number, y: number, deg: number, rx: number, ry: number, o = 1): string =>
  `<g transform="translate(${x} ${y}) rotate(${deg})" opacity="${o}"><ellipse rx="${rx * 2.5}" ry="${ry}" fill="url(#gS)" opacity=".45"/><ellipse rx="${rx}" ry="${ry * 0.95}" fill="url(#gS)"/></g>`

export function halftoneScene(isBusy: boolean, now: number): string {
  const rand = rng(1149)
  const breathe = isBusy ? 4.5 : 10
  const drift = isBusy ? 14 : 34
  const sweep = isBusy ? 20 : 48
  const slide = isBusy ? 17 : 40
  const lift = isBusy ? 1.18 : 1

  const glows = GLOWS.map((g, i) => {
    const lo = Math.min(1, g.lo * lift).toFixed(2)
    const hi = Math.min(1, g.hi * lift).toFixed(2)
    const dur = breathe * (0.8 + rand() * 0.5)
    return `<ellipse class="br" cx="${g.cx}" cy="${g.cy}" rx="${g.rx}" ry="${g.ry}" fill="url(#${g.grad})" style="--lo:${lo};--hi:${hi};animation-duration:${dur.toFixed(1)}s;animation-delay:${begin(now, dur * 2, i * 3.7)}"/>`
  }).join('')

  return `${open()}
<defs>
${radial('gP', '#d052ff', '#b700ff', '#4d0a85')}
${radial('gM', '#c63cf0', '#9314d9', '#3c0870')}
${radial('gV', '#a77bd6', '#6d3aa8', '#2a1245')}
${radial('gI', '#8f74ff', '#6944ff', '#2b1a7a')}
<radialGradient id="gS">${stop(0, '#d2ccdc', 0.7)}${stop(0.45, '#958ea2', 0.32)}${stop(1, '#5c5666', 0)}</radialGradient>
<radialGradient id="gA">${stop(0, '#3a1266', 0.3)}${stop(0.7, '#240a42', 0.16)}${stop(1, '#12051f', 0)}</radialGradient>
<radialGradient id="gD">${stop(0, '#000000', 0.92)}${stop(0.55, '#020105', 0.62)}${stop(1, '#020105', 0)}</radialGradient>
<pattern id="dots" width="11" height="11" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
<circle cx="5.5" cy="5.5" r="3.3" fill="#000000"/>
</pattern>
</defs>
<style>
.br{animation:br 10s ease-in-out infinite alternate}
@keyframes br{from{opacity:var(--lo)}to{opacity:var(--hi)}}
.dr{animation:dr ${drift}s ease-in-out infinite alternate;animation-delay:${begin(now, drift * 2, 5)}}
@keyframes dr{from{transform:translate(-18px,-40px)}to{transform:translate(20px,44px)}}
.hz{animation:hz ${slide}s ease-in-out infinite alternate;animation-delay:${begin(now, slide * 2, 17)}}
@keyframes hz{from{transform:translate(-90px,0)}to{transform:translate(80px,0)}}
.sw{animation:sw ${sweep}s ease-in-out infinite alternate;animation-delay:${begin(now, sweep * 2, 11)}}
@keyframes sw{from{transform:translate(0,-260px)}to{transform:translate(0,300px)}}
.st{animation:st ${breathe * 1.3}s ease-in-out infinite alternate;animation-delay:${begin(now, breathe * 2.6, 2)}}
@keyframes st{from{opacity:${isBusy ? 0.75 : 0.55}}to{opacity:${isBusy ? 1 : 0.85}}}
</style>
<rect width="${W}" height="${H}" fill="#07030c"/>
<ellipse cx="660" cy="700" rx="640" ry="820" fill="url(#gA)"/>
${glows}
<g class="st">
<g class="dr">
${beam(1150, 640, -5, 64, 760)}
${beam(1205, 960, 7, 34, 520, 0.7)}
</g>
<g class="hz">
${beam(880, 54, 87, 34, 560, 0.75)}
${beam(840, 1300, 92, 34, 600, 0.75)}
</g>
</g>
<g class="sw">
<ellipse rx="70" ry="300" fill="url(#gD)" transform="translate(1130 700) rotate(52)"/>
</g>
<rect width="${W}" height="${H}" fill="url(#dots)" opacity=".72"/>
</svg>`
}
