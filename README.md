# Claude themes

Animated dark themes for the Claude desktop app. Each chat gets a look that fits the work in it, and the background livens up while Claude is working.

<p>
  <img src="docs/motion/moths.gif" width="32%" alt="Night moths: glowing blue butterflies at the edges of a dark chat window">
  <img src="docs/motion/sigil.gif" width="32%" alt="Sigil: a white thorned sigil under the sidebar and a ring diagram at the right edge">
  <img src="docs/motion/honeycomb.gif" width="32%" alt="Honeycomb: pastel hexagon cells and curved links framing the chat">
</p>

## Install

At the prompt of a terminal session:

```
/plugin install chat-looks --marketplace cvdvs/claude-themes
```

From a shell:

```bash
claude plugin install chat-looks --marketplace cvdvs/claude-themes
```

In the desktop app: click + next to the prompt box, then Plugins, Add marketplace with `cvdvs/claude-themes`, then Add plugin.

The themes show in the Claude desktop app. The terminal and code editors don't draw themes, so nothing changes there.

## The looks

Click a picture to see it move.

| | Look | What it is | Picked by words like |
|---|---|---|---|
| [<img src="docs/stills/moths.jpg" width="220">](docs/motion/moths.gif) | `moths` | Glowing blue butterflies drift and flap at the edges, a crystal curtain sparkles, a stage beam slants in from the top. | astrology, tarot, moon, dream |
| [<img src="docs/stills/swirl.jpg" width="220">](docs/motion/swirl.gif) | `swirl` | Neon ribbons in cyan, violet, magenta, orange and lime meet in a glowing knot on pitch black. | (pick it with `/look swirl`) |
| [<img src="docs/stills/halftone.jpg" width="220">](docs/motion/halftone.gif) | `halftone` | Electric purple glow behind a fine dot screen down the right edge, with a dark shadow drifting through it. | brand, logo, client, proposal |
| [<img src="docs/stills/smoke.jpg" width="220">](docs/motion/smoke.gif) | `smoke` | A purple smoke ribbon rising up the right edge from smoke pooled along the bottom. | video, reel, social post, thumbnail |
| [<img src="docs/stills/clusters.jpg" width="220">](docs/motion/clusters.gif) | `clusters` | A graph view: colored node clusters joined by fine grey lines on black. Pulses run along the lines while Claude works. | research, audit, dataset, report |
| [<img src="docs/stills/sigil.jpg" width="220">](docs/motion/sigil.gif) | `sigil` | A white thorned sigil wrapped around the message box, a diagram of stacked rings cut off by the right edge, film grain. | philosophy, essay, myth, occult |
| [<img src="docs/stills/network.jpg" width="220">](docs/motion/network.gif) | `network` | A note map: soft hull shapes, green starburst hubs and iridescent squares linked by white curves. | wiki, notes, obsidian, second brain |
| [<img src="docs/stills/glass.jpg" width="220">](docs/motion/glass.gif) | `glass` | Glass bricks over a purple glow, soft circles drifting with yellow, blue and violet trails. | habit, music, journal, side project |
| [<img src="docs/stills/pixel.jpg" width="220">](docs/motion/pixel.gif) | `pixel` | Pixel blocks packed with letters, a red checker, purple ink sweeps on dark graph paper. | game, arduino, firmware, pixel art |
| [<img src="docs/stills/honeycomb.jpg" width="220">](docs/motion/honeycomb.gif) | `honeycomb` | Hexagon cells with colored corners and curved lines that draw themselves in, on deep navy. | portfolio, case study, resume |
| [<img src="docs/stills/grid.jpg" width="220">](docs/motion/grid.gif) | `grid` | The one light look: black pixel masses and tiny numbers on pale paper. | (pick it with `/look grid`) |

## How a chat picks its look

You don't have to do anything. When a chat opens:

1. If you set a look in that chat with `/look`, it keeps it.
2. Otherwise the chat's first messages are matched against each look's words. Project names you've added count four times as much as general words, and a chat started in a folder you've listed for a look gives that look a head start. The highest score wins.
3. If nothing matches, the chat gets the last look you picked.

A new chat picks its look from your first message. An older chat picks again each time you open it, so changes you make to the words reach old chats too.

To change it, type `/look` and a name, like `/look sigil`. That chat keeps it, and new chats that match nothing start with it too.

- `/look` on its own shows the chat's current look and the full list.
- `/look cards` turns the reply cards on or off. With cards on, each reply sits in a faint card in the look's colors.

## Make it yours

Everything lives in `hooks/looks.ts`. For each look you can:

- add your own project folders to `folders`, so a chat started in one leans to that look;
- add your project names to `names`, so a chat that mentions one picks that look;
- add your own words to `words`, so a chat about that topic picks it;
- change the app colors, how much the panels blur over the art, and the reply card colors.

Each scene is one file in `hooks/scenes/`, a function that returns an SVG. The app draws the sidebar almost solid, so the art sits in a column on the right, behind the ragged ends of lines, and in bands along the top and bottom. The middle of the window stays quiet for reading. The scenes are drawn for a tall window, about 1250 × 1410, with the sidebar open; on a wider window they're cropped at the top and bottom.

Made by Claudia Vaduvescu with Claude Code.

## License

MIT, see [LICENSE](LICENSE). `hooks/make-colors.js` and `hooks/make-colors.d.ts` come from Claude Code's kit for building mods and aren't covered by this license.
