import { useEffect, useRef } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { SearchAddon } from '@xterm/addon-search';
import LocalEchoController from 'local-echo';
import '@xterm/xterm/css/xterm.css';
import type { Difficulty } from '@/types/case.types';
import type { CaseContent } from '@/data/cases/caseData.types';
import type { ShellHost } from '@/shell/shellSession.types';
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
  shellHost?: ShellHost;
  employeeId?: string;
};

function makeShellSession(p: {
  shellUsername: string;
  workstationId: string;
  caseContent: CaseContent;
  difficulty: Difficulty;
  variant: InvestigationTerminalVariant;
  shellHost?: ShellHost;
  employeeId?: string;
}): ShellSessionState {
  const host: ShellHost =
    p.shellHost ??
    (p.variant === 'ubuntu' ? 'linux_workstation' : 'windows');
  const s = createShellSession({
    username: p.shellUsername,
    workstationId: p.workstationId,
    caseContent: p.caseContent,
    difficulty: p.difficulty,
    employeeId: p.employeeId ?? '',
    shellHost: host,
  });
  if (s.host === 'windows') {
    s.mode = p.variant === 'powershell' ? 'powershell' : 'cmd';
  }
  return s;
}

export function InvestigationTerminal({
  caseContent,
  difficulty,
  workstationId,
  shellUsername,
  className,
  variant = 'investigation',
  shellHost,
  employeeId,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const shellRef = useRef<ShellSessionState>(
    makeShellSession({
      shellUsername,
      workstationId,
      caseContent,
      difficulty,
      variant,
      shellHost,
      employeeId,
    }),
  );

  useEffect(() => {
    shellRef.current = makeShellSession({
      shellUsername,
      workstationId,
      caseContent,
      difficulty,
      variant,
      shellHost,
      employeeId,
    });
  }, [
    shellUsername,
    workstationId,
    caseContent,
    difficulty,
    variant,
    shellHost,
    employeeId,
  ]);

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
      term.writeln(
        'Forensic routing — Windows CMD/PowerShell plus Linux parity where mounted.',
      );
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
        'Ubuntu 22.04.4 LTS (GNU/Linux 5.15.0-107-generic x86_64)',
      );
      term.writeln(
        'GNOME Terminal snapshot · zsh-style prompt · read-only forensic routing.',
      );
      term.writeln('');
    }

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
  }, [caseContent, difficulty, workstationId, shellUsername, variant, shellHost, employeeId]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ minHeight: 200, width: '100%', height: '100%' }}
    />
  );
}
