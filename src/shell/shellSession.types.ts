import type { CaseContent } from '@/data/cases/caseData.types';
import type { Difficulty } from '@/types/case.types';
import type { VfsDirNode } from './vfs';

export type ShellHost = 'windows' | 'linux_workstation';

export interface ShellSessionState {
  host: ShellHost;
  mode: 'cmd' | 'powershell';
  inWsl: boolean;
  cwdWin: string;
  cwdUnix: string;
  vfsWin: VfsDirNode | null;
  vfsUnix: VfsDirNode | null;
  username: string;
  workstationId: string;
  employeeId: string;
  caseContent: CaseContent;
  difficulty: Difficulty;
  shellHostname: string;
  linuxHomeDir: string;
}
