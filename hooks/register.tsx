import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import { IDS, LOOKS, findLook, pickForChat } from './looks'
import type { LookId } from './looks'

const PLUGIN = 'chat-looks'
const FALLBACK: LookId = 'swirl'

// True while Claude is working on a turn. The scenes liven up while it is.
const busy = atom({ plugin: 'chat-looks', key: 'busy' } as const, false, { shape: 'busy-1' })
// This chat's look, so the reply cards can match it.
const current = atom({ plugin: 'chat-looks', key: 'look' } as const, FALLBACK as string, { shape: 'look-1' })
// Whether replies sit in cards.
const cards = atom({ plugin: 'chat-looks', key: 'cards' } as const, true, { shape: 'cards-1' })

// Store keys: `chose:<session id>` is a look picked by hand for a chat; `look` is the last one
// picked by hand, which chats that match nothing start with. Automatic picks aren't stored:
// they're worked out again each time a chat opens.
const chatKey = async ($: EngineInterface) => `chose:${await $.session.id()}`

async function apply($: EngineInterface, id: LookId) {
  const one = LOOKS[id]
  const unpainted = one.problems.find(line => line.startsWith("Desktop won't paint"))
  if (unpainted !== undefined) {
    $.ui.toast(unpainted)
  }
  await update($, current, () => id)
  // Before the app's window attaches nothing draws it yet; session.attach sets it again then.
  await $.theme.set(one.theme)
}

async function saved($: EngineInterface, key: string): Promise<LookId | undefined> {
  const value = await $.store.get(key)
  return typeof value === 'string' ? findLook(value) : undefined
}

const LIST_TEXT = [
  'Looks: ' + IDS.join(', ') + '.',
  '/look <name> sets this chat (and new chats that match nothing).',
  '/look cards turns the reply cards on or off.',
].join('\n')

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'look',
      description: 'Theme for this chat: /look moths, swirl, halftone, smoke, clusters, sigil, network, glass, pixel, honeycomb, grid',
    })
    let chosen = await saved($, await chatKey($))
    if (chosen === undefined) {
      // A chat opened again: its folder and first messages say what it is about.
      const history = await $.session.messages()
      const opening = history
        .filter(message => message.role === 'user' && message.text.trim() !== '')
        .slice(0, 3)
        .map(message => message.text)
        .join('\n')
        .slice(0, 4000)
      chosen = pickForChat(e.cwd, opening)
    }
    chosen = chosen ?? (await saved($, 'look')) ?? FALLBACK
    await update($, cards, () => true)
    if ((await $.store.get('cards')) === false) {
      await update($, cards, () => false)
    }
    await apply($, chosen)

    return next(e)
  })

  // A new chat with no look picked by hand takes one from its folder and first message.
  on('prompt.submit', async ($, e, next) => {
    if (e.command === undefined && (await $.session.turns()) === 0 && (await saved($, await chatKey($))) === undefined) {
      const picked = pickForChat(await $.session.cwd(), e.text)
      if (picked !== undefined && picked !== findLook(await read($, current))) {
        await apply($, picked)
      }
    }

    return next(e)
  })

  on('command.run', { command: 'look' }, async ($, e) => {
    const asked = e.args.trim().toLowerCase()
    if (asked === '') {
      return { text: `This chat: ${await read($, current)}.\n${LIST_TEXT}` }
    }
    if (asked === 'cards') {
      const isOn = !(await read($, cards))
      await update($, cards, () => isOn)
      await $.store.set('cards', isOn)
      return { text: isOn ? 'Reply cards on.' : 'Reply cards off.' }
    }
    const id = findLook(asked)
    if (id === undefined) {
      return { text: `No look called "${asked}".\n${LIST_TEXT}` }
    }
    await $.store.set(await chatKey($), id)
    await $.store.set('look', id)
    await apply($, id)

    return { text: `${LOOKS[id].label} on for this chat.` }
  })

  // A chat opened before the app's window attached: set the look again now that it can draw.
  on('session.attach', async ($, e, next) => {
    const attached = await next(e)
    if (e.surface === 'desktop' || e.surface === 'mobile') {
      await apply($, findLook(await read($, current)) ?? FALLBACK)
    }

    return attached
  })

  on('turn.start', async ($, e, next) => {
    if (e.agentId === undefined) {
      await update($, busy, () => true)
    }
    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    if (e.agentId === undefined) {
      await update($, busy, () => false)
    }
    return next(e)
  })

  on('ui.render', { component: 'Backdrop' }, async ($, e, next) => {
    if ((e.surface !== 'desktop' && e.surface !== 'mobile') || e.props.plugin !== PLUGIN) {
      return next(e)
    }
    const { Svg } = $.ui.resolve(e)
    const one = LOOKS[findLook(e.props.scene) ?? FALLBACK]
    const isBusy = await read($, busy)

    return <Svg source={one.scene(isBusy, Date.now())} alt={one.alt} isInteractive />
  })

  // Each reply sits in a faint card in the look's colors.
  on('ui.render', { component: 'AssistantMessage' }, async ($, e, next) => {
    if (e.surface !== 'desktop' || !(await read($, cards))) {
      return next(e)
    }
    const { Box } = $.ui.resolve(e)
    const id = findLook(await read($, current)) ?? FALLBACK
    const { border, fill } = LOOKS[id].card
    const inner = await next(e)

    return (
      <Box borderStyle="round" borderColor={border} backgroundColor={fill} paddingX="md" paddingY="sm">
        {inner}
      </Box>
    )
  })
}
