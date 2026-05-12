import jsPDF from 'jspdf';
import type { PlayerProfile } from '@/types/player.types';
import type { CaseDefinition } from '@/types/case.types';
import type { EmployeeProfile } from '@/types/employee.types';
import type { TaggedEvidence } from '@/contexts/EvidenceContext';
import type { CaseEvidenceItem } from '@/types/case.types';

async function sha256Hex(text: string): Promise<string> {
  const buf = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function downloadCaseReportPdf(args: {
  player: PlayerProfile;
  caseDef: CaseDefinition;
  accused: EmployeeProfile;
  summary: string;
  tagged: TaggedEvidence[];
  evidenceById: Map<string, CaseEvidenceItem>;
  score: number;
  grade: string;
  elapsedLabel: string;
}): Promise<void> {
  const {
    player,
    caseDef,
    accused,
    summary,
    tagged,
    evidenceById,
    score,
    grade,
    elapsedLabel,
  } = args;

  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  const margin = 48;
  let y = margin;

  doc.setFont('courier', 'bold');
  doc.setFontSize(14);
  doc.text('CASE REPORT — THREATRECON DIGITAL FORENSICS', margin, y);
  y += 22;
  doc.setFont('courier', 'normal');
  doc.setFontSize(10);
  const lines = [
    '════════════════════════════════════════════════════════════',
    `CASE NUMBER:        ${caseDef.numberLabel}-TR-2026`,
    `REPORT DATE:        ${new Date().toLocaleDateString()}`,
    `INVESTIGATOR:       ${player.name}`,
    `BADGE NUMBER:       ${player.badge}`,
    `INVESTIGATION TIME: ${elapsedLabel}`,
    '',
    `COMPANY:            ${caseDef.companyName}`,
    `INCIDENT TYPE:      ${caseDef.caseType}`,
    `CLASSIFICATION:     CONFIDENTIAL`,
    '',
    '════════════════════════════════════════════════════════════',
    'EXECUTIVE SUMMARY',
    '════════════════════════════════════════════════════════════',
    ...doc.splitTextToSize(summary, 500),
    '',
    '════════════════════════════════════════════════════════════',
    'ACCUSED INDIVIDUAL',
    '════════════════════════════════════════════════════════════',
    `Name:          ${accused.fullName}`,
    `Employee ID:   ${accused.employeeIdLabel}`,
    `Title:         ${accused.title}`,
    `Verdict:       REFER TO CASE VERDICT SCREEN`,
    '',
    '════════════════════════════════════════════════════════════',
    'EVIDENCE COLLECTED',
    '════════════════════════════════════════════════════════════',
  ];

  tagged.forEach((t, i) => {
    const ev = evidenceById.get(t.evidenceId);
    lines.push(
      `${i + 1}. ${ev?.title ?? t.evidenceId} (tagged to suspect record ${t.suspectId})`,
    );
  });

  lines.push(
    '',
    '════════════════════════════════════════════════════════════',
    'INVESTIGATION SCORE',
    '════════════════════════════════════════════════════════════',
    `Total Score:    ${score} / 120`,
    `Grade:          ${grade}`,
    '',
    '════════════════════════════════════════════════════════════',
    'FORENSIC INVESTIGATOR CERTIFICATION',
    '════════════════════════════════════════════════════════════',
  );

  const verifySeed = `${player.badge}|${caseDef.id}|${score}|${Date.now()}`;
  const verifyId = await sha256Hex(verifySeed);

  lines.push(
    `This report certifies that ${player.name} participated in the ThreatRecon.io INSIDE JOB investigation.`,
    '',
    `Verification ID: ${verifyId}`,
    'Verify at: https://threatrecon.io/verify/' + verifyId.slice(0, 12),
  );

  const wrapped: string[] = [];
  for (const ln of lines) {
    wrapped.push(...doc.splitTextToSize(ln, 500));
  }

  doc.setFontSize(10);
  for (const ln of wrapped) {
    if (y > 720) {
      doc.addPage();
      y = margin;
    }
    doc.text(ln, margin, y);
    y += 12;
  }

  doc.save(`${caseDef.numberLabel}-ThreatRecon-Report.pdf`);
}
