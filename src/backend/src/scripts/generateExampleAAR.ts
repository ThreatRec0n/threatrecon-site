import { AARSigningService } from '../services/aarSigningService';

/**
 * Generate a scrubbed example AAR for marketing purposes
 * This contains only placeholder data and role labels - no real PII
 */
export function generateExampleAAR() {
  const aarSigningService = new AARSigningService();
  
  const exampleAAR = {
    sessionId: 'example-session-2024-001',
    scenarioId: 'ransomware_basic',
    title: 'Ransomware Response Drill - Example After Action Report',
    generatedAt: new Date().toISOString(),
    
    // Session metadata
    session: {
      id: 'example-session-2024-001',
      scenarioId: 'ransomware_basic',
      status: 'completed',
      startedAt: '2024-01-15T10:00:00Z',
      endedAt: '2024-01-15T11:00:00Z',
      duration_minutes: 60,
      participants: [
        { role: 'IR_LEAD', name: 'Incident Response Lead', joinedAt: '2024-01-15T10:00:00Z' },
        { role: 'NETWORK_ADMIN', name: 'Network Administrator', joinedAt: '2024-01-15T10:00:00Z' },
        { role: 'LEGAL_COUNSEL', name: 'Legal Counsel', joinedAt: '2024-01-15T10:00:00Z' },
        { role: 'EXEC_SPONSOR', name: 'Executive Sponsor', joinedAt: '2024-01-15T10:00:00Z' },
        { role: 'PR_COMMS', name: 'PR/Communications', joinedAt: '2024-01-15T10:00:00Z' }
      ]
    },

    // Timeline of events
    timeline: [
      {
        timestamp: '2024-01-15T10:00:00Z',
        type: 'session_start',
        description: 'Drill session initiated',
        facilitator: true
      },
      {
        timestamp: '2024-01-15T10:03:00Z',
        type: 'inject',
        description: 'Suspicious outbound traffic detected from DATABASE_HOST_A',
        target_roles: ['IR_LEAD', 'NETWORK_ADMIN'],
        severity: 'warning'
      },
      {
        timestamp: '2024-01-15T10:05:30Z',
        type: 'decision',
        role: 'IR_LEAD',
        action: 'Initiated incident response procedures',
        rationale: 'Following standard IR playbook for suspicious network activity'
      },
      {
        timestamp: '2024-01-15T10:07:00Z',
        type: 'inject',
        description: 'Ransomware encryption detected on PAYMENT_GATEWAY_SERVICE',
        target_roles: ['IR_LEAD', 'NETWORK_ADMIN'],
        severity: 'critical'
      },
      {
        timestamp: '2024-01-15T10:08:15Z',
        type: 'decision',
        role: 'NETWORK_ADMIN',
        action: 'Isolated affected systems from network',
        rationale: 'Containment priority to prevent lateral movement'
      },
      {
        timestamp: '2024-01-15T10:12:00Z',
        type: 'inject',
        description: 'Ransom note received via email to EXEC_SPONSOR',
        target_roles: ['EXEC_SPONSOR', 'LEGAL_COUNSEL'],
        severity: 'critical'
      },
      {
        timestamp: '2024-01-15T10:15:00Z',
        type: 'decision',
        role: 'EXEC_SPONSOR',
        action: 'Escalated to legal team and notified board',
        rationale: 'Following incident escalation procedures'
      },
      {
        timestamp: '2024-01-15T10:18:00Z',
        type: 'inject',
        description: 'Media inquiry received about potential data breach',
        target_roles: ['PR_COMMS', 'LEGAL_COUNSEL'],
        severity: 'warning'
      },
      {
        timestamp: '2024-01-15T10:20:00Z',
        type: 'decision',
        role: 'PR_COMMS',
        action: 'Prepared holding statement for media',
        rationale: 'Standard crisis communication protocol'
      },
      {
        timestamp: '2024-01-15T10:25:00Z',
        type: 'facilitator_action',
        action: 'Escalated severity to CRITICAL',
        facilitator: true,
        description: 'Regulatory notification deadline approaching'
      },
      {
        timestamp: '2024-01-15T10:30:00Z',
        type: 'decision',
        role: 'LEGAL_COUNSEL',
        action: 'Initiated regulatory notification process',
        rationale: 'GDPR 72-hour notification requirement'
      },
      {
        timestamp: '2024-01-15T10:45:00Z',
        type: 'inject',
        description: 'Backup systems verified clean and restoration initiated',
        target_roles: ['IR_LEAD', 'NETWORK_ADMIN'],
        severity: 'info'
      },
      {
        timestamp: '2024-01-15T10:50:00Z',
        type: 'decision',
        role: 'IR_LEAD',
        action: 'Completed incident documentation',
        rationale: 'Comprehensive documentation for post-incident review'
      },
      {
        timestamp: '2024-01-15T11:00:00Z',
        type: 'session_end',
        description: 'Drill session completed',
        facilitator: true
      }
    ],

    // Scoring breakdown
    scoring: {
      overall_score: 87,
      category_scores: {
        technical_response: {
          score: 85,
          max_score: 100,
          percentage: 85,
          details: [
            { criterion: 'Incident Detection', score: 90, max_score: 100 },
            { criterion: 'Containment Actions', score: 85, max_score: 100 },
            { criterion: 'Recovery Procedures', score: 80, max_score: 100 },
            { criterion: 'Documentation', score: 85, max_score: 100 }
          ]
        },
        legal_compliance: {
          score: 92,
          max_score: 100,
          percentage: 92,
          details: [
            { criterion: 'Regulatory Notification', score: 95, max_score: 100 },
            { criterion: 'Legal Privilege', score: 90, max_score: 100 },
            { criterion: 'Evidence Preservation', score: 90, max_score: 100 }
          ]
        },
        executive_communication: {
          score: 78,
          max_score: 100,
          percentage: 78,
          details: [
            { criterion: 'Board Notification', score: 85, max_score: 100 },
            { criterion: 'Stakeholder Updates', score: 75, max_score: 100 },
            { criterion: 'Decision Making', score: 75, max_score: 100 }
          ]
        },
        business_continuity: {
          score: 88,
          max_score: 100,
          percentage: 88,
          details: [
            { criterion: 'Service Continuity', score: 90, max_score: 100 },
            { criterion: 'Customer Communication', score: 85, max_score: 100 },
            { criterion: 'Vendor Coordination', score: 90, max_score: 100 }
          ]
        }
      }
    },

    // Key findings and recommendations
    findings: {
      strengths: [
        'Rapid incident detection and initial response',
        'Effective containment procedures executed',
        'Timely regulatory notification compliance',
        'Comprehensive documentation maintained'
      ],
      gaps: [
        'Delayed escalation to executive team (5 minutes over target)',
        'Media response could be more proactive',
        'Backup verification process needs streamlining',
        'Cross-team communication protocols need improvement'
      ],
      recommendations: [
        'Implement automated executive notification system',
        'Develop pre-approved media response templates',
        'Create backup verification checklist',
        'Schedule monthly cross-team communication drills'
      ]
    },

    // Compliance alignment
    compliance: {
      frameworks: ['NIST 800-61', 'SOC2', 'ISO 27035', 'GDPR'],
      alignment_score: 89,
      gaps_identified: 3,
      recommendations_count: 4
    },

    // Metadata for signing
    metadata: {
      generated_at: new Date(),
      generated_by: 'ThreatRecon Platform',
      version: '1.0',
      scenario_version: '1.2',
      tenant_id: 'example-tenant',
      session_duration: 60,
      total_decisions: 8,
      total_injects: 6,
      facilitator_actions: 2
    }
  };

  // Sign the AAR
  const signature = aarSigningService.signAAR(exampleAAR);
  exampleAAR.metadata = {
    ...exampleAAR.metadata,
    ...signature
  };

  return exampleAAR;
}

/**
 * Export the example AAR as JSON
 */
export function exportExampleAARAsJSON() {
  const aar = generateExampleAAR();
  return JSON.stringify(aar, null, 2);
}

/**
 * Export the example AAR as Markdown
 */
export function exportExampleAARAsMarkdown() {
  const aar = generateExampleAAR();
  
  let markdown = `# ${aar.title}\n\n`;
  markdown += `**Session ID:** ${aar.sessionId}\n`;
  markdown += `**Generated:** ${aar.generatedAt}\n`;
  markdown += `**Duration:** ${aar.session.duration_minutes} minutes\n\n`;
  
  markdown += `## Executive Summary\n\n`;
  markdown += `This drill simulated a ransomware attack scenario with ${aar.session.participants.length} participants. `;
  markdown += `Overall performance score: **${aar.scoring.overall_score}%**\n\n`;
  
  markdown += `## Participants\n\n`;
  aar.session.participants.forEach(participant => {
    markdown += `- **${participant.role}**: ${participant.name}\n`;
  });
  markdown += `\n`;
  
  markdown += `## Timeline\n\n`;
  aar.timeline.forEach(event => {
    const time = new Date(event.timestamp).toLocaleTimeString();
    markdown += `**${time}** - ${event.description}\n`;
    if (event.type === 'decision' && event.rationale) {
      markdown += `  - *Rationale: ${event.rationale}*\n`;
    }
    markdown += `\n`;
  });
  
  markdown += `## Scoring Breakdown\n\n`;
  Object.entries(aar.scoring.category_scores).forEach(([category, scores]) => {
    markdown += `### ${category.replace('_', ' ').toUpperCase()}: ${scores.percentage}%\n\n`;
    scores.details.forEach(detail => {
      markdown += `- ${detail.criterion}: ${detail.score}/${detail.max_score}\n`;
    });
    markdown += `\n`;
  });
  
  markdown += `## Key Findings\n\n`;
  markdown += `### Strengths\n`;
  aar.findings.strengths.forEach(strength => {
    markdown += `- ${strength}\n`;
  });
  markdown += `\n`;
  
  markdown += `### Areas for Improvement\n`;
  aar.findings.gaps.forEach(gap => {
    markdown += `- ${gap}\n`;
  });
  markdown += `\n`;
  
  markdown += `### Recommendations\n`;
  aar.findings.recommendations.forEach(rec => {
    markdown += `- ${rec}\n`;
  });
  markdown += `\n`;
  
  markdown += `## Compliance Alignment\n\n`;
  markdown += `**Frameworks:** ${aar.compliance.frameworks.join(', ')}\n`;
  markdown += `**Alignment Score:** ${aar.compliance.alignment_score}%\n`;
  markdown += `**Gaps Identified:** ${aar.compliance.gaps_identified}\n`;
  markdown += `**Recommendations:** ${aar.compliance.recommendations_count}\n\n`;
  
  markdown += `## Cryptographic Verification\n\n`;
  markdown += `**Signed Hash:** ${aar.metadata.signed_hash}\n`;
  markdown += `**Signing Key ID:** ${aar.metadata.signing_key_id}\n`;
  markdown += `**Generated At:** ${aar.metadata.generated_at}\n\n`;
  markdown += `*This report has been cryptographically signed to ensure integrity and authenticity.*\n`;
  
  return markdown;
}
