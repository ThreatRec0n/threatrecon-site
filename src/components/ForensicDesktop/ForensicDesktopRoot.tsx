import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { CaseContent } from '@/data/cases/caseData.types';
import type { Difficulty } from '@/types/case.types';
import type { EmployeeProfile } from '@/types/employee.types';
import type { ForensicOs, WallpaperKey } from '@/investigation/suspectWorkstation';
import {
  SARAH_NOTES_TXT,
  displayMachineName,
  windowsOsLabel,
} from '@/investigation/suspectWorkstation';
import { SARAH_WSL_EXPLORER_TREE } from '@/data/cases/case001LinuxFs';
import { InvestigationTerminal } from '@/components/Terminal/InvestigationTerminal';
import { FileTreeView } from '@/components/shared/FileTreeView';
import { ForensicChrome } from './ForensicChrome';
import { WallpaperLayer } from './WallpaperLayer';
import { DesktopIconGrid } from './DesktopIconGrid';
import {
  DesktopWindows,
  type DeskWindowKind,
  type DeskWindowState,
} from './DesktopWindows';
import { WindowsTaskbar } from './WindowsTaskbar';
import { UbuntuDockChrome, UBUNTU_DOCK_APPS } from './UbuntuDockChrome';
import { EvidenceDrawer } from './EvidenceDrawer';
import { ActivitiesOverview } from './ActivitiesOverview';
import clsx from 'clsx';

export type ToolkitPanelId = string;

type Props = {
  wallpaperKey: WallpaperKey;
  os: ForensicOs;
  employee: EmployeeProfile;
  caseContent: CaseContent;
  difficulty: Difficulty;
  caseTr: string;
  examinerName: string;
  examinerBadge: string;
  elapsedSeconds: number;
  taggedCount: number;
  caseLabel: string;
  screenshots: import('@/types/evidence.types').ScreenshotEvidence[];
  gateOk: boolean;
  gateReasons: string[];
  onAccuse: () => void;
  onExit: () => void;
  onRequestMountMachine: (empId: string) => void;
  employeesList: EmployeeProfile[];
  suspectOsLabel: (empId: string) => string;
  taggedSummaries: { evidenceId: string; title: string; suspectName: string }[];
  navItems: { id: ToolkitPanelId; label: string }[];
  toolkitPanel: ToolkitPanelId;
  setToolkitPanel: (id: ToolkitPanelId) => void;
  toolkitTaggingDeck: ReactNode;
  toolkitMain: ReactNode;
  openNotebook: () => void;
  snippingOpen: boolean;
  onSnippingOpen: () => void;
  drawerOpen: boolean;
  setDrawerOpen: (v: boolean) => void;
};

function defaultSize(kind: DeskWindowKind): { w: number; h: number } {
  switch (kind) {
    case 'cmd':
    case 'powershell':
      return { w: 800, h: 450 };
    case 'explorer':
      return { w: 1000, h: 650 };
    case 'outlook':
      return { w: 1200, h: 750 };
    case 'edge':
      return { w: 1200, h: 750 };
    case 'taskmgr':
      return { w: 700, h: 550 };
    default:
      return { w: 700, h: 500 };
  }
}

function windowTitle(
  kind: DeskWindowKind,
  shellUser: string,
  email: string,
  os: ForensicOs,
  ubuntuHost: string,
): string {
  switch (kind) {
    case 'cmd':
      return os === 'ubuntu2204'
        ? `${shellUser}@${ubuntuHost}: ~/projects`
        : `C:\\Users\\${shellUser} - Command Prompt`;
    case 'powershell':
      return 'Windows PowerShell';
    case 'explorer':
      return 'File Explorer';
    case 'notepad':
      return 'Notes.txt - Notepad';
    case 'outlook':
      return `Inbox - ${email} - Outlook`;
    case 'edge':
      return 'History - Microsoft Edge';
    case 'taskmgr':
      return 'Task Manager';
    default:
      return 'Window';
  }
}

export function ForensicDesktopRoot(props: Props) {
  const {
    wallpaperKey,
    os,
    employee,
    caseContent,
    difficulty,
    caseTr,
    examinerName,
    examinerBadge,
    elapsedSeconds,
    taggedCount,
    caseLabel,
    screenshots,
    gateOk,
    gateReasons,
    onAccuse,
    onRequestMountMachine,
    employeesList,
    suspectOsLabel,
    taggedSummaries,
    navItems,
    toolkitPanel,
    setToolkitPanel,
    toolkitTaggingDeck,
    toolkitMain,
    openNotebook,
    onSnippingOpen,
    drawerOpen,
    setDrawerOpen,
  } = props;

  const shellUser = employee.email.split('@')[0] ?? 'user';
  const wsId = employee.workstationId;
  const ubuntuHost = displayMachineName(wsId).toLowerCase();

  const zRef = useRef(4200);
  const [windows, setWindows] = useState<DeskWindowState[]>([]);
  const [activeWindowId, setActiveWindowId] = useState<string | null>(null);
  const [iconSel, setIconSel] = useState<string | null>(null);
  const [activitiesOpen, setActivitiesOpen] = useState(false);

  const openWindow = useCallback(
    (kind: DeskWindowKind, title?: string) => {
      const t = title ?? windowTitle(kind, shellUser, employee.email, os, ubuntuHost);
      const { w, h } = defaultSize(kind);
      const id = crypto.randomUUID();
      zRef.current += 1;
      const z = zRef.current;
      setWindows((prev) => {
        const n = prev.length;
        return [
          ...prev,
          {
            id,
            kind,
            title: t,
            x: 60 + (n % 5) * 36,
            y: 48 + (n % 5) * 28,
            w,
            h,
            z,
            minimized: false,
          },
        ];
      });
      setActiveWindowId(id);
    },
    [employee.email, shellUser, os, ubuntuHost],
  );

  const bringFront = (id: string) => {
    zRef.current += 1;
    const z = zRef.current;
    setWindows((prev) =>
      prev.map((w) =>
        w.id === id ? { ...w, z, minimized: false } : w,
      ),
    );
    setActiveWindowId(id);
  };

  const closeWindow = (id: string) => {
    setWindows((prev) => prev.filter((w) => w.id !== id));
    setActiveWindowId((cur) => (cur === id ? null : cur));
  };

  const minimizeWindow = (id: string) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, minimized: true } : w)),
    );
    setActiveWindowId((cur) => (cur === id ? null : cur));
  };

  const toggleTaskWindow = (id: string) => {
    const w = windows.find((x) => x.id === id);
    if (!w) return;
    if (w.minimized) bringFront(id);
    else minimizeWindow(id);
  };

  const onDragStop = (id: string, x: number, y: number) => {
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, x, y } : w)));
  };

  const onResizeStop = (
    id: string,
    w: number,
    h: number,
    x: number,
    y: number,
  ) => {
    setWindows((prev) =>
      prev.map((win) =>
        win.id === id ? { ...win, w, h, x, y } : win,
      ),
    );
  };

  const activateIcon = useCallback(
    (id: string) => {
      if (id === 'notes') openWindow('notepad');
      else if (id === 'thispc' || id === 'personal' || id === 'recycle' || id === 'home' || id === 'documents')
        openWindow('explorer');
      else if (id === 'roadmap-lnk' || id === 'edge-desk') openWindow('edge');
      else if (id === 'teams-desk') openWindow('outlook');
      else openWindow('explorer');
    },
    [openWindow],
  );

  const inboxMails = useMemo(
    () =>
      caseContent.emails.filter(
        (m) =>
          m.mailbox.toLowerCase() === employee.email.toLowerCase(),
      ),
    [caseContent.emails, employee.email],
  );

  const browserLines = useMemo(() => {
    const rows =
      caseContent.browserByUser[employee.email] ??
      Object.values(caseContent.browserByUser).flat();
    return rows;
  }, [caseContent.browserByUser, employee.email]);

  const renderBody = (kind: DeskWindowKind, win: DeskWindowState) => {
    switch (kind) {
      case 'cmd':
        return (
          <InvestigationTerminal
            variant={os === 'ubuntu2204' ? 'ubuntu' : 'cmd'}
            shellHost={os === 'ubuntu2204' ? 'linux_workstation' : 'windows'}
            employeeId={employee.id}
            caseContent={caseContent}
            difficulty={difficulty}
            workstationId={wsId}
            shellUsername={shellUser}
            className="h-full"
          />
        );
      case 'powershell':
        return (
          <InvestigationTerminal
            variant="powershell"
            shellHost="windows"
            employeeId={employee.id}
            caseContent={caseContent}
            difficulty={difficulty}
            workstationId={wsId}
            shellUsername={shellUser}
            className="h-full"
          />
        );
      case 'explorer': {
        const ub = os === 'ubuntu2204';
        return (
          <div
            className={clsx(
              'flex h-full flex-col text-white',
              ub ? 'bg-[#2d2d2d] font-[Ubuntu,sans-serif]' : 'bg-[#191919]',
            )}
          >
            <div
              className={clsx(
                'border-b px-3 py-2 font-mono text-[11px]',
                ub ? 'border-black bg-[#353535]' : 'border-black bg-[#2d2d2d]',
              )}
            >
              {ub ? `${shellUser}'s Files` : `↑ This PC ▸ ${win.title}`}
            </div>
            <div className="min-h-0 flex-1 overflow-auto p-3">
              <FileTreeView root={caseContent.workstations[wsId]} />
              {employee.id === 'emp-sarah-chen' &&
              caseContent.definition.id === 'case-001' ? (
                <>
                  <p className="mb-1 mt-4 font-mono text-[10px] uppercase tracking-wide text-amber/90">
                    \\wsl$\Ubuntu-22.04 · WSL2 filesystem (read-only)
                  </p>
                  <FileTreeView root={SARAH_WSL_EXPLORER_TREE} />
                </>
              ) : null}
            </div>
          </div>
        );
      }
      case 'notepad':
        return (
          <div className="flex h-full flex-col bg-white text-black">
            <textarea
              readOnly
              className="min-h-0 flex-1 resize-none p-3 font-mono text-[13px] outline-none"
              value={
                employee.id === 'emp-sarah-chen'
                  ? SARAH_NOTES_TXT
                  : '(No desktop notes for this user.)'
              }
            />
          </div>
        );
      case 'outlook':
        return (
          <div className="flex h-full bg-[#141414] text-white">
            <aside className="w-52 shrink-0 border-r border-black bg-[#181818] p-2 font-mono text-[10px]">
              <p className="text-amber">{employee.email}</p>
              <p className="mt-2">📥 Inbox ({inboxMails.length})</p>
              <p>📤 Sent</p>
              <p>🗑 Deleted</p>
            </aside>
            <div className="min-w-0 flex-1 overflow-y-auto border-r border-black">
              {inboxMails.map((m) => (
                <div
                  key={m.id}
                  className="border-b border-black/40 px-3 py-2 font-mono text-[11px]"
                >
                  <div className="font-bold">{m.subject}</div>
                  <div className="text-white/60">{m.time}</div>
                </div>
              ))}
            </div>
            <div className="hidden w-96 shrink-0 overflow-y-auto p-3 font-mono text-[11px] text-white/85 xl:block">
              Select a message — forensic preview shows headers + body in toolkit email panel for full fidelity.
            </div>
          </div>
        );
      case 'edge':
        return (
          <div className="flex h-full flex-col bg-[#121821] text-white">
            <div className="border-b border-black px-3 py-2 font-mono text-[11px] text-sky-300">
              edge://history — read-only snapshot
            </div>
            <pre className="min-h-0 flex-1 overflow-auto p-4 font-mono text-[11px] text-white/80">
              {browserLines.join('\n')}
            </pre>
          </div>
        );
      case 'taskmgr': {
        const rows = [
          ['System', '0%', '0.1 MB'],
          ['svchost.exe', '0.1%', '27.3 MB'],
          ['chrome.exe', '3.2%', '189.6 MB'],
          ['Outlook.exe', '0.8%', '201.3 MB'],
          ['Teams.exe', '1.2%', '312.5 MB'],
          ...(employee.id === 'emp-sarah-chen'
            ? ([['winsvc32.exe', '2.1%', '45.3 MB']] as const)
            : []),
          ['cmd.exe', '0%', '4.7 MB'],
        ];
        return (
          <div className="h-full overflow-auto bg-[#1e1e1e] p-3 font-mono text-[11px] text-white">
            <table className="w-full border-collapse">
              <thead>
                <tr className="text-left text-white/50">
                  <th className="pb-2">Name</th>
                  <th>CPU</th>
                  <th>Memory</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(([n, c, mem]) => (
                  <tr
                    key={n}
                    className={clsx(
                      'border-t border-white/5',
                      n === 'winsvc32.exe' && 'bg-amber/15 text-amber',
                    )}
                  >
                    <td className="py-1">{n}</td>
                    <td>{c}</td>
                    <td>{mem}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
      default:
        return null;
    }
  };

  const osHud = windowsOsLabel(os);

  return (
    <div className="relative min-h-screen bg-black text-white">
      <div
        id="forensic-desktop-capture-root"
        className={clsx(
          'desk-surface relative overflow-hidden',
          os === 'ubuntu2204'
            ? 'pb-4 pl-[72px] pt-8 font-[Ubuntu,Helvetica,sans-serif]'
            : 'pb-14 font-[Segoe_UI,system-ui,sans-serif]',
        )}
        style={{ minHeight: '100vh' }}
      >
        <WallpaperLayer wallpaperKey={wallpaperKey} />

        <ForensicChrome
          caseTr={caseTr}
          examinerName={examinerName}
          examinerBadge={examinerBadge}
          targetLabel={`${shellUser} @ ${displayMachineName(wsId)}`}
          osLabel={osHud}
          elapsedSeconds={elapsedSeconds}
          taggedCount={taggedCount}
          onToggleDrawer={() => setDrawerOpen(!drawerOpen)}
          drawerOpen={drawerOpen}
          onCaptureClick={onSnippingOpen}
        />

        <DesktopIconGrid
          employeeId={employee.id}
          os={os === 'ubuntu2204' ? 'ubuntu2204' : 'windows11'}
          selectedIcon={iconSel}
          onSelectIcon={setIconSel}
          onActivateIcon={activateIcon}
        />

        <DesktopWindows
          windows={windows}
          activeId={activeWindowId}
          onFocus={bringFront}
          onClose={closeWindow}
          onMinimize={minimizeWindow}
          onDragStop={onDragStop}
          onResizeStop={onResizeStop}
          renderBody={renderBody}
        />

        {os === 'ubuntu2204' ? (
          <UbuntuDockChrome
            title={`${shellUser}'s Files — Files`}
            frozenClock="Mon 23:03"
            openKinds={[...new Set(windows.map((w) => w.kind))]}
            onOpenApp={(kind, title) => openWindow(kind, title)}
            onOpenActivities={() => setActivitiesOpen(true)}
          />
        ) : (
          <WindowsTaskbar
            openWindows={windows}
            activeWindowId={activeWindowId}
            onOpenPinned={(kind) => openWindow(kind)}
            onToggleWindow={toggleTaskWindow}
            onOpenStartApp={(kind, title) => openWindow(kind, title)}
          />
        )}
      </div>

      <EvidenceDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        caseLabel={caseLabel}
        screenshots={screenshots}
        taggedLabels={taggedSummaries}
        employees={employeesList}
        activeEmpId={employee.id}
        suspectOsLabel={suspectOsLabel}
        onPickMachine={onRequestMountMachine}
        gateOk={gateOk}
        gateReasons={gateReasons}
        onAccuse={onAccuse}
        onOpenNotebook={openNotebook}
        navItems={navItems}
        toolkitPanel={toolkitPanel}
        setToolkitPanel={setToolkitPanel}
        toolkitTaggingDeck={toolkitTaggingDeck}
        toolkitMain={toolkitMain}
      />

      {os === 'ubuntu2204' ? (
        <ActivitiesOverview
          open={activitiesOpen}
          onClose={() => setActivitiesOpen(false)}
          windows={windows}
          dockApps={UBUNTU_DOCK_APPS}
          onLaunch={(kind, title) => openWindow(kind, title)}
        />
      ) : null}
    </div>
  );
}
