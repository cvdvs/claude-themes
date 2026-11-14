export type Busy = boolean

declare module 'claude-code' {
  interface PluginState {
    'chat-looks': { busy: Shaped<Busy>; look: Shaped<string>; cards: Shaped<boolean> }
  }
}
