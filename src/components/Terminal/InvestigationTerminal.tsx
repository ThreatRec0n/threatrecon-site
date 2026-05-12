import { useEffect, useRef } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { SearchAddon } from '@xterm/addon-search';
import LocalEchoController from 'local-echo';
import '@xterm/xterm/css/xterm.css';
import type { Difficulty } from '@/types/case.types';
import type { CaseContent } from '@/data/cases/caseData.types';
import {
  createShellSession,
  executeShellLine,
  getShellPrompt,
  shellAutocomplete,
  type ShellSessionState,
} from '@/shell/shellInterpreter';

type Props = {
  caseContent: CaseContent;
  difficulty: Difficulty;
  workstationId: string;
  /** Local login segment used for `C:\\Users\\<segment>` prompts */
  shellUsername: string;
  className?: string;
};

export function InvestigationTerminal({
  caseContent,
  difficulty,
  workstationId,
  shellUsername,
  className,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const shellRef = useRef<ShellSessionState>(
    createShellSession({
      username: shellUsername,
      workstationId,
      caseContent,
      difficulty,
    }),
  );

  useEffect(() => {
    shellRef.current = createShellSession({
      username: shellUsername,
      workstationId,
      caseContent,
      difficulty,
    });
  }, [shellUsername, workstationId, caseContent, difficulty]);

  useEffect(() => {
    if (!containerRef.current) return;
    const term = new XTerm({
      theme: {
        background: '#0d0d0d',
        foreground: '#e8e4dc',
        cursor: '#d4a017',
        cursorAccent: '#0d0d0d',
        selectionBackground: 'rgba(212,160,23,0.3)',
        black: '#1a1612',
        red: '#cc2200',
        green: '#1a6b3a',
        yellow: '#d4a017',
        blue: '#5e9bff',
        magenta: '#b48eff',
        cyan: '#00b4cc',
        white: '#e8e4dc',
        brightBlack: '#5a5248',
        brightRed: '#ff4422',
        brightGreen: '#2d8f52',
        brightYellow: '#f0b429',
        brightBlue: '#7bb2ff',
        brightMagenta: '#c8a8ff',
        brightCyan: '#4de8ff',
        brightWhite: '#f5f0e8',
      },
      fontFamily: "'Geist Mono', 'Cascadia Code', 'Fira Code', monospace",
      fontSize: 13,
      lineHeight: 1.4,
      cursorBlink: true,
      cursorStyle: 'block',
      scrollback: 10000,
      allowTransparency: true,
    });

    const fit = new FitAddon();
    term.loadAddon(fit);
    term.loadAddon(
      new WebLinksAddon((_event, uri) => {
        window.open(uri, '_blank', 'noopener,noreferrer');
      }),
    );
    term.loadAddon(new SearchAddon());

    term.open(containerRef.current);
    fit.fit();

    const localEcho = new LocalEchoController(term, { historySize: 100 });
    localEcho.addAutocompleteHandler((index: number, tokens: string[]) => {
      const shell = shellRef.current;
      if (!shell) return [];
      return shellAutocomplete(shell, index, tokens);
    });

    term.writeln(
      'Microsoft Windows [Version 10.0.22631]\r\n(c) Microsoft Corporation. All rights reserved.',
    );
    term.writeln('');
    term.writeln(`ThreatRecon sandbox shell · workstation image ${workstationId}`);
    term.writeln('Windows CMD semantics — type forensic queries or dir/cd/type.');
    term.writeln('');

    let cancelled = false;

    const loop = async () => {
      while (!cancelled) {
        const shell = shellRef.current;
        if (!shell) break;
        try {
          const input = await localEcho.read(getShellPrompt(shell));
          if (cancelled) break;
          const trimmed = input.trimEnd();
          if (!trimmed) continue;
          const out = executeShellLine(shell, trimmed);
          if (out) term.writeln(out);
        } catch {
          if (!cancelled) term.writeln('^C');
        }
      }
    };

    void loop();

    const onResize = () => fit.fit();
    window.addEventListener('resize', onResize);

    return () => {
      cancelled = true;
      window.removeEventListener('resize', onResize);
      localEcho.abortRead();
      term.dispose();
    };
  }, [caseContent, difficulty, workstationId, shellUsername]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ minHeight: 200, width: '100%' }}
    />
  );
}
