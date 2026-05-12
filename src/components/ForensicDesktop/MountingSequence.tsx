import { useEffect, useMemo, useState } from 'react';
import type { ForensicOs } from '@/investigation/suspectWorkstation';
import { displayMachineName } from '@/investigation/suspectWorkstation';

type Props = {
  os: ForensicOs;
  targetLogin: string;
  workstationId: string;
  caseTr: string;
  examinerName: string;
  examinerBadge: string;
  /** Faster animation when switching machines mid-session */
  abbreviated?: boolean;
  onComplete: () => void;
};

export function MountingSequence({
  os,
  targetLogin,
  workstationId,
  caseTr,
  examinerName,
  examinerBadge,
  abbreviated = false,
  onComplete,
}: Props) {
  const lines = useMemo(() => {
    const host = displayMachineName(workstationId);
    const commonHead = [
      `ThreatRecon Forensic Workstation v4.2.1`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      ``,
      `CASE NUMBER:   ${caseTr}`,
      `EXAMINER:      ${examinerName || 'Examiner'} | Badge: ${examinerBadge || 'TR-0000'}`,
      `EVIDENCE ITEM: #4 — Workstation Hard Drive`,
      `TARGET:        ${targetLogin} @ ${host}`,
      ``,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      ``,
      `> Connecting hardware write blocker [Tableau T35es-R2]...`,
      `  STATUS: ACTIVE — Physical write protection ENFORCED ✓`,
      ``,
    ];

    if (abbreviated) {
      return [
        ...commonHead,
        `> Loading evidence image (${os === 'ubuntu2204' ? 'EXT4' : 'NTFS'})…`,
        `  STATUS: VERIFIED ✓`,
        ``,
        `> READ-ONLY FORENSIC MOUNT ACTIVE ✓`,
        ``,
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        `READY — Loading suspect workstation environment...`,
      ];
    }

    const winTail =
      os === 'windows11'
        ? [
            `> Loading evidence image: ${workstationId}.E01`,
            `  Image size: 256,060,514,304 bytes (238.4 GiB)`,
            `  Segments: ${workstationId}.E01 → .E26 (26 files)`,
            ``,
            `> Verifying image integrity...`,
            `  Computing MD5:    ████████████████████████ a1b2c3d4e5f6789012345678901234ab ✓`,
            `  Computing SHA256: ████████████████████████ e3b0c44298fc1c149afb4c8996fb924... ✓`,
            `  Hash verified against chain of custody record ✓`,
            ``,
            `> Detecting partition table...`,
            `  Partition scheme: GPT (GUID Partition Table)`,
            `  Partition 1: EFI System Partition [FAT32] 100 MB`,
            `  Partition 2: Microsoft Reserved [Unknown] 16 MB`,
            `  Partition 3: Basic Data [NTFS] 255.5 GB ← Mounting this`,
            `  Partition 4: Windows Recovery [NTFS] 0.5 GB`,
            ``,
            `> Mounting NTFS volume [READ-ONLY]...`,
            `  Volume label:     OS`,
            `  File system:      NTFS Version 3.1`,
            `  Windows version:  Windows 11 Pro 22H2 Build 22621.3374`,
            `  Volume serial:    3A7F-B291`,
            `  Cluster size:     4,096 bytes`,
            ``,
            `> Indexing file system...`,
            `  [████████████████████████] 100%`,
            ``,
            `> Parsing forensic artifacts...`,
            `  [$MFT]    Master File Table .............. indexed ✓`,
            `  [Prefetch] Windows Prefetch (128 entries) ... parsed ✓`,
            `  [Hives]    NTUSER.DAT (${targetLogin}) .......... loaded ✓`,
            `  [Security] Security.evtx (1,247 events) .... parsed ✓`,
            `  [USB]      USBSTOR artifacts .............. parsed ✓ [2 devices]`,
            ``,
          ]
        : [
            `> Mounting EXT4 volume [READ-ONLY]...`,
            `  Volume label:     ubuntu-root`,
            `  File system:      ext4 (revision 1.0)`,
            `  Linux version:    Ubuntu 22.04.4 LTS (Jammy Jellyfish)`,
            `  Kernel:           5.15.0-107-generic #117-Ubuntu`,
            ``,
            `> Parsing Linux forensic artifacts...`,
            `  [/etc/passwd]  User accounts .............. parsed ✓`,
            `  [.zsh_history] Zsh history (primary) ....... parsed ✓`,
            `  [.bash_history] Shell history .............. parsed ✓`,
            `  [/var/log/auth.log] Auth events ........... parsed ✓`,
            `  [Browser]      Firefox history ............ extracted ✓`,
            ``,
          ];

    const foot = [
      `> READ-ONLY FORENSIC MOUNT ACTIVE ✓`,
      `  No writes will be performed to evidence media.`,
      ``,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `READY — Loading suspect workstation environment...`,
    ];

    return [...commonHead, ...winTail, ...foot];
  }, [
    abbreviated,
    caseTr,
    examinerBadge,
    examinerName,
    os,
    targetLogin,
    workstationId,
  ]);

  const [shown, setShown] = useState(0);
  const delay = abbreviated ? 35 : 70;

  useEffect(() => {
    if (shown >= lines.length) {
      const t = window.setTimeout(onComplete, abbreviated ? 400 : 600);
      return () => window.clearTimeout(t);
    }
    const id = window.setTimeout(() => setShown((s) => s + 1), delay);
    return () => window.clearTimeout(id);
  }, [shown, lines.length, delay, onComplete, abbreviated]);

  const visible = lines.slice(0, shown);

  return (
    <div className="fixed inset-0 z-[10000] overflow-hidden bg-black font-mono text-[13px] leading-snug text-amber">
      <pre className="h-full overflow-y-auto p-10 whitespace-pre-wrap">
        {visible.join('\n')}
      </pre>
    </div>
  );
}
