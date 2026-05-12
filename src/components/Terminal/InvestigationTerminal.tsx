import { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import type { Difficulty } from '@/types/case.types';
import type { CaseContent } from '@/data/cases/caseData.types';
import { runTerminalLine, type TerminalContext } from '@/utils/terminal/commandRunner';

type Props = {
  caseContent: CaseContent;
  difficulty: Difficulty;
  workstationId: string;
  className?: string;
};

export function InvestigationTerminal({
  caseContent,
  difficulty,
  workstationId,
  className,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<Terminal | null>(null);
  const cwdRef = useRef('');

  useEffect(() => {
    cwdRef.current = '';
  }, [workstationId]);

  useEffect(() => {
    if (!containerRef.current) return;
    const term = new Terminal({
      theme: {
        background: '#0d0d0d',
        foreground: '#e8e4dc',
        cursor: '#d4a017',
      },
      fontFamily: 'Geist Mono, monospace',
      fontSize: 13,
    });
    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(containerRef.current);
    fit.fit();

    term.writeln(
      'ThreatRecon sandbox shell — type forensic queries or Windows-style file commands.',
    );
    term.writeln(`Attached workstation image: ${workstationId}`);
    term.write('$ ');

    let current = '';

    const ctxBase = (): Omit<TerminalContext, 'cwd' | 'setCwd'> => ({
      caseContent,
      difficulty,
      workstationId,
    });

    const dispatch = (line: string) => {
      const ctx: TerminalContext = {
        ...ctxBase(),
        cwd: cwdRef.current,
        setCwd: (s) => {
          cwdRef.current = s;
        },
      };
      const out = runTerminalLine(ctx, line);
      if (out) term.writeln(out);
      term.write('$ ');
    };

    const disposable = term.onData((data) => {
      if (data === '\r') {
        term.writeln('');
        dispatch(current);
        current = '';
        return;
      }
      if (data === '\u007f') {
        if (!current.length) return;
        current = current.slice(0, -1);
        term.write('\b \b');
        return;
      }
      if (data.length === 1 && data >= ' ') {
        current += data;
        term.write(data);
      }
    });

    const onResize = () => fit.fit();
    window.addEventListener('resize', onResize);
    termRef.current = term;

    return () => {
      window.removeEventListener('resize', onResize);
      disposable.dispose();
      term.dispose();
      termRef.current = null;
    };
  }, [caseContent, difficulty, workstationId]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ minHeight: 200, width: '100%' }}
    />
  );
}
