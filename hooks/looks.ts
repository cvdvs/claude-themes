// Every look: its scene, its app colors, how the panels frost over it, the reply card,
// and the folder names and words that pick it automatically for a chat.
// To make a look pick itself for your projects, add your folder names to `folders`
// (a chat started inside one leans to that look), your project names to `names`
// and your own topic words to `words`.

import type { ThemeBackdropGlass, ThemeSetArgs } from 'claude-code'

import { makeColors } from './make-colors.js'
import { clustersScene } from './scenes/clusters'
import { glassScene } from './scenes/glass'
import { gridScene, swirlScene } from './scenes/classic'
import { halftoneScene } from './scenes/halftone'
import { honeycombScene } from './scenes/honeycomb'
import { mothScene } from './scenes/moths'
import { networkScene } from './scenes/network'
import { pixelScene } from './scenes/pixel'
import { sigilScene } from './scenes/sigil'
import { smokeScene } from './scenes/smoke'

export type LookId =
  | 'halftone'
  | 'smoke'
  | 'clusters'
  | 'moths'
  | 'sigil'
  | 'network'
  | 'glass'
  | 'pixel'
  | 'honeycomb'
  | 'swirl'
  | 'grid'

type Chrome = {
  page: string
  card: string
  panel: string
  menu: string
  text: string
  text2: string
  muted: string
}

type Roles = { accent: string; danger: string; success: string; warning: string; pro: string }

export type Look = {
  id: LookId
  label: string
  // The app colors the look starts from: page, cards, panels, menus and three text strengths.
  chrome: Chrome
  scene: (isBusy: boolean, now: number) => string
  alt: string
  theme: ThemeSetArgs
  problems: string[]
  // The card each reply sits in: a faint border and a see-through fill.
  card: { border: string; fill: string }
  // Folder names that settle the look for a chat started inside them.
  folders: string[]
  // Project names in a chat's first messages: a strong sign (each counts 4).
  names: string[]
  // General words in a chat's first messages: a weak sign (each counts 1).
  words: string[]
}

function dark(label: string, chrome: Chrome, roles: Roles) {
  return makeColors({
    label,
    only: 'dark',
    roles,
    dark: {
      gray: {
        anchors: {
          'surface-0': chrome.page,
          'surface-1': chrome.card,
          'surface-2': chrome.panel,
          'surface-3': chrome.menu,
          'text-primary': chrome.text,
          'text-secondary': chrome.text2,
          'text-muted': chrome.muted,
        },
      },
    },
  })
}

type Spec = Omit<Look, 'theme' | 'problems'> & {
  chrome: Chrome
  roles: Roles
  glass: ThemeBackdropGlass
  light?: boolean
}

function look(spec: Spec): Look {
  const { roles, glass, light, ...rest } = spec
  const { chrome } = spec
  const made = light
    ? makeColors({
        label: spec.label,
        only: 'light',
        roles,
        light: {
          gray: {
            anchors: {
              'surface-0': chrome.page,
              'surface-1': chrome.card,
              'surface-2': chrome.panel,
              'surface-3': chrome.menu,
              'text-primary': chrome.text,
              'text-secondary': chrome.text2,
              'text-muted': chrome.muted,
            },
          },
        },
      })
    : dark(spec.label, chrome, roles)
  return {
    ...rest,
    chrome,
    theme: { colors: made.theme, backdrop: { scene: spec.id, glass } },
    problems: made.problems,
  }
}

const LIST: Look[] = [
  look({
    id: 'halftone',
    label: 'Halftone',
    scene: halftoneScene,
    alt: 'Purple glow behind a fine dot screen, a dark shadow through the middle',
    chrome: { page: '#0b0612', card: '#110a1b', panel: '#160c24', menu: '#1a0f2a', text: '#f3eefa', text2: '#c6b8da', muted: '#9a8cb2' },
    roles: { accent: '#b700ff', danger: '#ff4d6d', success: '#4fd88a', warning: '#ffb547', pro: '#6944ff' },
    glass: { blur: 3, tint: '#0b0614', opacity: 0.42 },
    card: { border: '#b700ff3d', fill: '#110a1b99' },
    folders: [],
    names: [],
    words: ['brand', 'branding', 'logo', 'identity', 'agency', 'client', 'proposal', 'pitch deck', 'pricing', 'seo', 'marketing', 'landing page'],
  }),
  look({
    id: 'smoke',
    label: 'Smoke',
    scene: smokeScene,
    alt: 'A purple smoke ribbon rising out of black',
    chrome: { page: '#050309', card: '#0b0713', panel: '#110a1c', menu: '#150d22', text: '#f1ebf9', text2: '#bfb2d4', muted: '#958aab' },
    roles: { accent: '#a35cff', danger: '#ff4d6d', success: '#4fd88a', warning: '#ffb547', pro: '#c77dff' },
    glass: { blur: 10, tint: '#06030c', opacity: 0.45 },
    card: { border: '#a35cff3d', fill: '#0b071399' },
    folders: [],
    names: [],
    words: ['video', 'film', 'reel', 'promo', 'social post', 'instagram', 'tiktok', 'youtube', 'caption', 'thumbnail', 'storyboard'],
  }),
  look({
    id: 'clusters',
    label: 'Clusters',
    scene: clustersScene,
    alt: 'Clusters of colored nodes joined by fine grey lines on black',
    chrome: { page: '#030305', card: '#0b0c12', panel: '#0f1017', menu: '#13141c', text: '#f5f7fb', text2: '#c4c9d4', muted: '#949aa8' },
    roles: { accent: '#2ed8ec', danger: '#ff5370', success: '#7ee068', warning: '#ffc247', pro: '#9d66ff' },
    glass: { blur: 2, tint: '#000000', opacity: 0.4 },
    card: { border: '#2ed8ec33', fill: '#0b0c1299' },
    folders: [],
    names: [],
    words: ['research', 'audit', 'dataset', 'analysis', 'dashboard', 'metrics', 'report', 'survey', 'benchmark'],
  }),
  look({
    id: 'moths',
    label: 'Night moths',
    scene: mothScene,
    alt: 'Glowing blue butterflies drifting in the dark',
    chrome: { page: '#04060b', card: '#080c14', panel: '#0c111b', menu: '#111724', text: '#eef4ff', text2: '#c2cfe4', muted: '#93a3bf' },
    roles: { accent: '#6fb8ff', danger: '#ff5d73', success: '#5fe0a8', warning: '#ffbf5a', pro: '#a98bff' },
    glass: { blur: 12, tint: '#04060b', opacity: 0.5 },
    card: { border: '#6fb8ff33', fill: '#080c148c' },
    folders: [],
    names: [],
    words: ['astrolog', 'horoscope', 'tarot', 'zodiac', 'birth chart', 'transit', 'moon', 'dream', 'ritual'],
  }),
  look({
    id: 'sigil',
    label: 'Sigil',
    scene: sigilScene,
    alt: 'An occult diagram of stacked rings and a white sigil on grainy black',
    chrome: { page: '#08080c', card: '#0e0e16', panel: '#12121b', menu: '#16161f', text: '#e8e8f0', text2: '#b4b4c6', muted: '#8a8aa0' },
    roles: { accent: '#8b5cff', danger: '#e0555a', success: '#8fcf8a', warning: '#d9b45c', pro: '#34e3e3' },
    glass: { blur: 3, tint: '#08080c', opacity: 0.42 },
    card: { border: '#8b5cff33', fill: '#0e0e1699' },
    folders: [],
    names: [],
    words: ['philosoph', 'consciousness', 'esoteric', 'occult', 'essay', 'mystic', 'myth', 'metaphysic', 'gnostic', 'hermetic'],
  }),
  look({
    id: 'network',
    label: 'Network',
    scene: networkScene,
    alt: 'A colorful network of clusters, starbursts and linked iridescent squares on dark',
    chrome: { page: '#07060c', card: '#0e0c16', panel: '#12101c', menu: '#161421', text: '#ece9f7', text2: '#b3adca', muted: '#8b85a3' },
    roles: { accent: '#9d8cff', danger: '#ff5d8f', success: '#7be06a', warning: '#ffc247', pro: '#6be3e0' },
    glass: { blur: 3, tint: '#07060c', opacity: 0.4 },
    card: { border: '#9d8cff33', fill: '#0e0c1699' },
    folders: [],
    names: [],
    words: ['wiki', 'obsidian', 'notes', 'knowledge base', 'vault', 'zettelkasten', 'library', 'bookmarks', 'second brain'],
  }),
  look({
    id: 'glass',
    label: 'Glass',
    scene: glassScene,
    alt: 'Glass bricks over a purple glow and soft circles drifting with colored trails',
    chrome: { page: '#06061a', card: '#0b0b21', panel: '#0f0f26', menu: '#13132b', text: '#eeecff', text2: '#b5b6dc', muted: '#8d8fb8' },
    roles: { accent: '#b46cff', danger: '#ff5d7a', success: '#5fe0a0', warning: '#eef24a', pro: '#8d6bff' },
    glass: { blur: 4, tint: '#06061a', opacity: 0.42 },
    card: { border: '#b46cff3d', fill: '#0b0b2199' },
    folders: [],
    names: [],
    words: ['habit', 'music', 'playlist', 'recipe', 'journal', 'math', 'side project', 'hobby', 'just for me'],
  }),
  look({
    id: 'pixel',
    label: 'Pixel',
    scene: pixelScene,
    alt: 'Pixel blocks with letters, a red checker and purple line work on dark graph paper',
    chrome: { page: '#0e0e10', card: '#141417', panel: '#17171a', menu: '#1b1b1f', text: '#e8e2d0', text2: '#b8b2a5', muted: '#8f8a80' },
    roles: { accent: '#b46ff5', danger: '#ff4d4d', success: '#8fd16a', warning: '#f0b43c', pro: '#e8e2d0' },
    glass: { blur: 3, tint: '#0e0e10', opacity: 0.45 },
    card: { border: '#b46ff533', fill: '#14141799' },
    folders: [],
    names: [],
    words: ['game', 'godot', 'unity', 'arduino', 'hardware', 'firmware', 'raspberry pi', 'pixel art', 'puzzle', 'e-ink'],
  }),
  look({
    id: 'honeycomb',
    label: 'Honeycomb',
    scene: honeycombScene,
    alt: 'Hexagonal cells with colored vertices and curved links on deep navy',
    chrome: { page: '#070b1d', card: '#0b1026', panel: '#0e1430', menu: '#121835', text: '#eef1fb', text2: '#c3c9e2', muted: '#949cbc' },
    roles: { accent: '#b99bfa', danger: '#ff7a8a', success: '#9be8a8', warning: '#ffd38a', pro: '#9db8ff' },
    glass: { blur: 3, tint: '#0a0e1f', opacity: 0.4 },
    card: { border: '#b99bfa33', fill: '#0b102699' },
    folders: [],
    names: [],
    words: ['portfolio', 'case study', 'resume', 'job application', 'interview', 'linkedin', 'personal site'],
  }),
  look({
    id: 'swirl',
    label: 'Night swirl',
    scene: swirlScene,
    alt: 'Glowing colored ribbons swirling on black',
    chrome: { page: '#050507', card: '#0b0a10', panel: '#110f18', menu: '#16141e', text: '#f2f0f7', text2: '#c6c2d4', muted: '#9a95ad' },
    roles: { accent: '#8a5cff', danger: '#ff4d6d', success: '#5ee38a', warning: '#ffb03a', pro: '#2fd8e8' },
    glass: { blur: 28, tint: '#050507', opacity: 0.6 },
    card: { border: '#8a5cff33', fill: '#0b0a108c' },
    folders: [],
    names: [],
    words: [],
  }),
  look({
    id: 'grid',
    label: 'Pixel grid',
    light: true,
    scene: gridScene,
    alt: 'A pale pixel grid with dark masses and tiny numbers',
    chrome: { page: '#dfdfdc', card: '#e7e7e4', panel: '#efefec', menu: '#efefec', text: '#121212', text2: '#383838', muted: '#575757' },
    roles: { accent: '#2a2fd6', danger: '#c0302a', success: '#2f7a3d', warning: '#a3650c', pro: '#5a3fc0' },
    glass: { blur: 4, tint: '#ececea', opacity: 0.74 },
    card: { border: '#12121226', fill: '#efefecb3' },
    folders: [],
    names: [],
    words: [],
  }),
]

export const LOOKS: Record<LookId, Look> = Object.fromEntries(LIST.map(one => [one.id, one])) as Record<LookId, Look>

export const IDS = LIST.map(one => one.id)

// Other names that also work in /look.
const ALIASES: Record<string, LookId> = { moth: 'moths', agency: 'halftone', research: 'clusters', occult: 'sigil', wiki: 'network', notes: 'network', games: 'pixel', portfolio: 'honeycomb' }

export function findLook(name: string): LookId | undefined {
  const asked = name.trim().toLowerCase()
  return IDS.find(id => id === asked) ?? ALIASES[asked]
}

// The folder a chat started in, when it names a project. The longest match wins,
// so "Website Studio" beats "Website".
export function lookForFolder(cwd: string): LookId | undefined {
  let best: { id: LookId; length: number } | undefined
  for (const one of LIST) {
    for (const folder of one.folders) {
      if (cwd.includes(folder) && (best === undefined || folder.length > best.length)) {
        best = { id: one.id, length: folder.length }
      }
    }
  }
  return best?.id
}

// How strongly a chat's opening points at each look. Names count 4 per word and general
// words 1 per word, each up to three times; a match must start a word, so "art"
// doesn't match inside "start".
function escape(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function count(lower: string, phrase: string) {
  const found = lower.match(new RegExp(`(^|[^a-z0-9])${escape(phrase)}`, 'g'))
  return Math.min(found?.length ?? 0, 3)
}

function scores(text: string): Map<LookId, number> {
  const lower = text.toLowerCase()
  const found = new Map<LookId, number>()
  for (const one of LIST) {
    let score = 0
    for (const name of one.names) {
      score += count(lower, name) * 4 * name.split(' ').length
    }
    for (const word of one.words) {
      score += count(lower, word) * word.split(' ').length
    }
    if (score > 0) {
      found.set(one.id, score)
    }
  }
  return found
}

function top(found: Map<LookId, number>): LookId | undefined {
  let winner: { id: LookId; score: number } | undefined
  for (const [id, score] of found) {
    if (winner === undefined || score > winner.score) {
      winner = { id, score }
    }
  }
  return winner?.id
}

export function lookForWords(text: string): LookId | undefined {
  return top(scores(text))
}

// Folders that hold many kinds of work, so they only lean a little. Add yours, like a
// notes vault that holds every project.
const BROAD: string[] = []

// The look for a chat from its folder and its opening messages. The folder adds 6 to
// its look (1 for a broad folder), then the highest score wins: a project folder holds
// unless the chat plainly talks about another project.
export function pickForChat(cwd: string, opening: string): LookId | undefined {
  const found = opening.trim() === '' ? new Map<LookId, number>() : scores(opening)
  const folder = lookForFolder(cwd)
  if (folder !== undefined) {
    const broad = BROAD.some(one => cwd.includes(one)) && lookForFolderIsBroad(cwd)
    found.set(folder, (found.get(folder) ?? 0) + (broad ? 1 : 6))
  }
  return top(found)
}

// True when the folder match came only from a broad folder name.
function lookForFolderIsBroad(cwd: string): boolean {
  for (const one of LIST) {
    for (const folder of one.folders) {
      if (cwd.includes(folder) && !BROAD.includes(folder)) {
        return false
      }
    }
  }
  return true
}
