/**
 * Tracks investigator actions that affect evidence integrity (simulated).
 */
export type ForensicViolationKind =
  | 'delete_without_chain'
  | 'delete_without_export'
  | 'log_cleared'
  | 'registry_deleted_without_export';

export class ForensicIntegrityEngine {
  private violations: { kind: ForensicViolationKind; detail: string }[] =
    [];
  private exportedRegistryPaths = new Set<string>();
  private hashedFiles = new Set<string>();

  recordViolation(kind: ForensicViolationKind, detail: string) {
    this.violations.push({ kind, detail });
  }

  markRegistryExported(pathNorm: string) {
    this.exportedRegistryPaths.add(pathNorm.toLowerCase());
  }

  isRegistryExported(pathNorm: string): boolean {
    return this.exportedRegistryPaths.has(pathNorm.toLowerCase());
  }

  markFileHashed(windowsPathNorm: string) {
    this.hashedFiles.add(windowsPathNorm.toLowerCase());
  }

  isFileHashed(windowsPathNorm: string): boolean {
    return this.hashedFiles.has(windowsPathNorm.toLowerCase());
  }

  consumeWarnings(): string[] {
    const msgs = this.violations.map((v) => {
      switch (v.kind) {
        case 'delete_without_chain':
          return `[FORENSIC WARNING] ${v.detail}`;
        case 'delete_without_export':
          return `[FORENSIC WARNING] Registry key deleted without prior export. Evidence chain integrity reduced. (${v.detail})`;
        case 'log_cleared':
          return `[FORENSIC WARNING] Clearing event logs destroys evidence. Action logged in Event ID 1102. (${v.detail})`;
        case 'registry_deleted_without_export':
          return `[FORENSIC WARNING] Registry key deleted without prior export. Evidence chain integrity reduced. (${v.detail})`;
        default:
          return `[FORENSIC WARNING] ${v.detail}`;
      }
    });
    this.violations = [];
    return msgs;
  }
}

export const forensicIntegrity = new ForensicIntegrityEngine();
