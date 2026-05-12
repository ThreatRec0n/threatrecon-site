import type { EmployeeProfile } from '@/types/employee.types';

export type ForensicOs = 'windows11' | 'ubuntu2204';

export type WallpaperKey =
  | 'sarah-hike'
  | 'marcus-dark'
  | 'linda-corp'
  | 'ryan-tech'
  | 'diana-circuit'
  | 'ubuntu-jelly';

/** Section 0 — Case 001 OS assignment; other cases default Windows 11. */
export function getSuspectOs(caseId: string, employeeId: string): ForensicOs {
  if (caseId === 'case-001' && employeeId === 'emp-james-okafor') {
    return 'ubuntu2204';
  }
  return 'windows11';
}

export function getWallpaperKey(
  caseId: string,
  employeeId: string,
): WallpaperKey {
  if (caseId === 'case-001') {
    switch (employeeId) {
      case 'emp-sarah-chen':
        return 'sarah-hike';
      case 'emp-marcus-webb':
        return 'marcus-dark';
      case 'emp-james-okafor':
        return 'ubuntu-jelly';
      case 'emp-linda-park':
        return 'linda-corp';
      case 'emp-ryan-torres':
        return 'ryan-tech';
      case 'emp-diana-reeves':
        return 'diana-circuit';
      default:
        break;
    }
  }
  const n =
    employeeId.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0) %
    4;
  return (['marcus-dark', 'linda-corp', 'ryan-tech', 'diana-circuit'] as const)[
    n
  ];
}

export function formatTrCaseNumber(caseId: string): string {
  const digits = caseId.replace(/\D/g, '').padStart(3, '0');
  return `TR-2026-${digits}`;
}

export function displayMachineName(workstationId: string): string {
  return workstationId.replace(/^WS-/i, 'NEXUS-WS-');
}

export function evidenceBagMeta(
  workstationId: string,
  employeeId: string,
): {
  serial: string;
  md5: string;
  sha256: string;
  imageFile: string;
  collectedUtc: string;
  detective: string;
  deviceModel: string;
  capacityGb: number;
} {
  const seed = [...workstationId, ...employeeId].reduce(
    (a, c) => a + c.charCodeAt(0),
    0,
  );
  const hex = (len: number) =>
    Array.from({ length: len }, (_, i) =>
      ((seed + i * 17) % 16).toString(16),
    ).join('');
  return {
    serial: hex(10).toUpperCase(),
    md5: hex(32),
    sha256: hex(64),
    imageFile: `${workstationId}.E01`,
    collectedUtc: '2026-05-08 00:47:13 UTC',
    detective: 'Det. R. Morrison',
    deviceModel:
      employeeId === 'emp-james-okafor'
        ? 'Lenovo ThinkPad P1 Gen 4'
        : 'Dell OptiPlex 7090',
    capacityGb: 256,
  };
}

export function windowsOsLabel(os: ForensicOs): string {
  return os === 'ubuntu2204'
    ? 'Ubuntu 22.04.4 LTS'
    : 'Windows 11 Pro 22H2';
}

export function employeeShellLogin(emp: EmployeeProfile): string {
  return emp.email.split('@')[0] ?? 'user';
}

export const SARAH_NOTES_TXT = `Things to do:
- Book Yosemite camping spot (June?)
- Mom's birthday card
- Talk to Marcus re: Q4 planning

→ Should I take the Helix offer? Better title. $40k more.
  But what about vesting? 8 months left...
  They'll be sorry they didn't promote me.
`;
