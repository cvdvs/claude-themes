// Halftone: electric purple and indigo glow pooled at the left and right edges, a dark
// diagonal shadow through the middle where the text sits, a soft grey light streak falling across
// the sidebar, all seen through a fine halftone dot screen. Every soft shape is a gradient, not a
// blur filter, so the slow motion stays cheap.
import { W, H, ZONES, rng, begin, open } from './kit'

type Glow = { cx: number; cy: number; rx: number; ry: number; grad: string; lo: number; hi: number }

const SB = ZONES.sidebar.x1
const RS = ZONES.right.x0

// Hand-placed pools of light, hugging the two edges.
const GLOWS: Glow[] = [
  { cx: 10, cy: 860, rx: SB + 45, ry: 820, grad: 'gP', lo: 0.78, hi: 1 },
  { cx: -30, cy: 1200, rx: SB + 15, ry: 380, grad: 'gM', lo: 0.62, hi: 0.92 },
  { cx: 40, cy: 520, rx: SB - 25, ry: 380, grad: 'gV', lo: 0.5, hi: 0.76 },
  { cx: W + 10, cy: 760, rx: W - RS + 70, ry: 760, grad: 'gI', lo: 0.78, hi: 1 },
  { cx: W + 20, cy: 1150, rx: W - RS + 40, ry: 360, grad: 'gP', lo: 0.62, hi: 0.9 },
  { cx: W - 20, cy: 330, rx: W - RS, ry: 300, grad: 'gI', lo: 0.42, hi: 0.64 },
]

const stop = (o: number, c: string, a: number): string =>
  `<stop offset="${o}" stop-color="${c}" stop-opacity="${a}"/>`

const radial = (id: string, c0: string, c1: string, c2: string): string =>
  `<radialGradient id="${id}">${stop(0, c0, 1)}${stop(0.34, c1, 0.85)}${stop(0.66, c2, 0.32)}${stop(1, c2, 0)}</radialGradient>`

export function halftoneScene(isBusy: boolean, now: number): string {
  const rand = rng(1149)
  const breathe = isBusy ? 4.5 : 10
  const drift = isBusy ? 14 : 34
  const sweep = isBusy ? 20 : 48
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
<radialGradient id="gA">${stop(0, '#3a1266', 0.34)}${stop(0.7, '#240a42', 0.2)}${stop(1, '#12051f', 0)}</radialGradient>
<radialGradient id="gD">${stop(0, '#000000', 0.92)}${stop(0.55, '#020105', 0.62)}${stop(1, '#020105', 0)}</radialGradient>
<linearGradient id="gB" x1="0" y1="0" x2="0" y2="1">${stop(0, '#000000', 0.55)}${stop(0.14, '#000000', 0)}${stop(0.8, '#000000', 0)}${stop(1, '#000000', 0.7)}</linearGradient>
<pattern id="dots" width="11" height="11" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
<circle cx="5.5" cy="5.5" r="3.3" fill="#000000"/>
</pattern>
</defs>
<style>
.br{animation:br 10s ease-in-out infinite alternate}
@keyframes br{from{opacity:var(--lo)}to{opacity:var(--hi)}}
.dr{animation:dr ${drift}s ease-in-out infinite alternate;animation-delay:${begin(now, drift * 2, 5)}}
@keyframes dr{from{transform:translate(-34px,-10px)}to{transform:translate(38px,14px)}}
.sw{animation:sw ${sweep}s ease-in-out infinite alternate;animation-delay:${begin(now, sweep * 2, 11)}}
@keyframes sw{from{transform:translate(-60px,0)}to{transform:translate(70px,0)}}
.st{animation:st ${breathe * 1.3}s ease-in-out infinite alternate;animation-delay:${begin(now, breathe * 2.6, 2)}}
@keyframes st{from{opacity:${isBusy ? 0.75 : 0.55}}to{opacity:${isBusy ? 1 : 0.85}}}
</style>
<rect width="${W}" height="${H}" fill="#07030c"/>
<ellipse cx="${W / 2}" cy="700" rx="780" ry="900" fill="url(#gA)"/>
${glows}
<g class="st"><g class="dr">
<g transform="translate(120 360) rotate(27)">
<ellipse rx="175" ry="860" fill="url(#gS)" opacity=".45"/>
<ellipse rx="70" ry="820" fill="url(#gS)"/>
</g>
<g transform="translate(1170 230) rotate(-22)" opacity=".5">
<ellipse rx="130" ry="600" fill="url(#gS)" opacity=".45"/>
<ellipse rx="52" ry="560" fill="url(#gS)"/>
</g>
</g></g>
<g class="sw">
<ellipse rx="300" ry="1250" fill="url(#gD)" transform="translate(650 720) rotate(14)"/>
</g>
<rect width="${W}" height="${H}" fill="url(#gB)"/>
<rect width="${W}" height="${H}" fill="url(#dots)" opacity=".72"/>
</svg>`
}
