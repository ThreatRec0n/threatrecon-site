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

export type InvestigationTerminalVariant =
  | 'investigation'
  | 'cmd'
  | 'powershell'
  | 'ubuntu';

type Props = {
  caseContent: CaseContent;
  difficulty: Difficulty;
  workstationId: string;
  shellUsername: string;
  className?: string;
  variant?: InvestigationTerminalVariant;
  ubuntuHost?: string;
};

function promptFor(
  variant: InvestigationTerminalVariant,
  shell: ShellSessionState,
  shellUsername: string,
  ubuntuHost: string,
): string {
  if (variant === 'ubuntu') {
    return `${shellUsername}@${ubuntuHost || 'workstation'}:~$ `;
  }
  return getShellPrompt(shell);
}

export function InvestigationTerminal({
  caseContent,
  difficulty,
  workstationId,
  shellUsername,
  className,
  variant = 'investigation',
  ubuntuHost = 'nexus-ws',
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
    const s = createShellSession({
      username: shellUsername,
      workstationId,
      caseContent,
      difficulty,
    });
    if (variant === 'powershell') s.mode = 'powershell';
    else s.mode = 'cmd';
    shellRef.current = s;
  }, [shellUsername, workstationId, caseContent, difficulty, variant]);

  useEffect(() => {
    if (!containerRef.current) return;

    const themes: Record<
      InvestigationTerminalVariant,
      { bg: string; fg: string; fontSize: number; fontFamily: string }
    > = {
      investigation: {
        bg: '#0d0d0d',
        fg: '#e8e4dc',
        fontSize: 13,
        fontFamily: "'Geist Mono', 'Cascadia Code', 'Fira Code', monospace",
      },
      cmd: {
        bg: '#0c0c0c',
        fg: '#cccccc',
        fontSize: 14,
        fontFamily: "'Cascadia Mono', Consolas, monospace",
      },
      powershell: {
        bg: '#012456',
        fg: '#ffffff',
        fontSize: 14,
        fontFamily: "'Cascadia Mono', Consolas, monospace",
      },
      ubuntu: {
        bg: '#300a24',
        fg: '#ffffff',
        fontSize: 13,
        fontFamily: "'Ubuntu Mono', 'Geist Mono', monospace",
      },
    };

    const th = themes[variant];

    const term = new XTerm({
      theme: {
        background: th.bg,
        foreground: th.fg,
        cursor: variant === 'powershell' ? '#ffffff' : '#d4a017',
        cursorAccent: th.bg,
        selectionBackground: 'rgba(212,160,23,0.25)',
      },
      fontFamily: th.fontFamily,
      fontSize: th.fontSize,
      lineHeight: 1.35,
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

    if (variant === 'investigation') {
      term.writeln(
        'Microsoft Windows [Version 10.0.22631]\r\n(c) Microsoft Corporation. All rights reserved.',
      );
      term.writeln('');
      term.writeln(
        `ThreatRecon sandbox shell · workstation image ${workstationId}`,
      );
      term.writeln('Windows CMD semantics — type forensic queries or dir/cd/type.');
      term.writeln('');
    } else if (variant === 'cmd') {
      term.writeln(
        'Microsoft Windows [Version 10.0.22621.3374]\r\n(c) Microsoft Corporation. All rights reserved.',
      );
      term.writeln('');
    } else if (variant === 'powershell') {
      term.writeln('Windows PowerShell');
      term.writeln('Copyright (C) Microsoft Corporation. All rights reserved.');
      term.writeln('');
      term.writeln(
        'Install the latest PowerShell for new features and improvements! https://aka.ms/PSWindows',
      );
      term.writeln('');
    } else if (variant === 'ubuntu') {
      term.writeln(
        'Ubuntu 22.04.4 LTS — forensic terminal shim (read-only image)',
      );
      term.writeln(
        'Bash-style prompts; investigation commands route to training sandbox.',
      );
      term.writeln('');
    }

    let cancelled = false;

    const loop = async () => {
      while (!cancelled) {
        const shell = shellRef.current;
        if (!shell) break;
        try {
          const input = await localEcho.read(
            promptFor(variant, shell, shellUsername, ubuntuHost),
          );
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
  }, [
    caseContent,
    difficulty,
    workstationId,
    shellUsername,
    variant,
    ubuntuHost,
  ]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ minHeight: 200, width: '100%', height: '100%' }}
    />
  );
}
