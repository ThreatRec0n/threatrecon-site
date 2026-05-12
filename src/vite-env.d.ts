/// <reference types="vite/client" />

declare module 'local-echo' {
  export default class LocalEchoController {
    constructor(term: import('@xterm/xterm').Terminal, options?: { historySize?: number });
    read(prompt: string, continuationPrompt?: string): Promise<string>;
    abortRead(reason?: string): void;
    addAutocompleteHandler(
      fn: (index: number, tokens: string[], ...args: unknown[]) => string[],
      ...args: unknown[]
    ): void;
    println(message: string): void;
  }
}
