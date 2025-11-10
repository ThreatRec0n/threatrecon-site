'use client';

import { useState } from 'react';
import { getOwaspCategory } from '@/lib/feedback/owasp-top10';
import type { OwaspCategory } from '@/lib/feedback/owasp-top10';

const OWASP_CATEGORIES = [
  'A01:2021',
  'A02:2021',
  'A03:2021',
  'A04:2021',
  'A05:2021',
  'A06:2021',
  'A07:2021',
  'A08:2021',
  'A09:2021',
  'A10:2021',
];

export default function LearnPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const category = selectedCategory ? getOwaspCategory(selectedCategory) : null;

  return (
    <div className="min-h-screen bg-[#0d1117] p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#c9d1d9] mb-2">📚 OWASP Top 10 Mini-Lessons</h1>
          <p className="text-[#8b949e]">
            Learn about the most critical web application security risks and how to detect them
          </p>
        </div>

        {/* Category Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {OWASP_CATEGORIES.map(categoryId => {
            const cat = getOwaspCategory(categoryId);
            if (!cat) return null;

            return (
              <button
                key={categoryId}
                onClick={() => setSelectedCategory(categoryId)}
                className={`p-6 rounded-lg border-2 text-left transition-all ${
                  selectedCategory === categoryId
                    ? 'bg-[#58a6ff]/10 border-[#58a6ff]'
                    : 'bg-[#161b22] border-[#30363d] hover:border-[#58a6ff]/50'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono text-[#58a6ff] bg-[#0d1117] px-2 py-1 rounded border border-[#30363d]">
                    {cat.id}
                  </span>
                  {selectedCategory === categoryId && (
                    <span className="text-green-400">✓</span>
                  )}
                </div>
                <h3 className="text-lg font-semibold text-[#c9d1d9] mb-2">{cat.name}</h3>
                <p className="text-sm text-[#8b949e] line-clamp-2">{cat.description}</p>
              </button>
            );
          })}
        </div>

        {/* Detailed View */}
        {category && (
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-sm font-mono text-[#58a6ff] bg-[#0d1117] px-3 py-1 rounded border border-[#30363d]">
                    {category.id}
                  </span>
                  <h2 className="text-2xl font-bold text-[#c9d1d9]">{category.name}</h2>
                </div>
                <p className="text-[#8b949e] mt-2">{category.description}</p>
              </div>
              <button
                onClick={() => setSelectedCategory(null)}
                className="text-[#8b949e] hover:text-[#c9d1d9] text-xl"
              >
                ✕
              </button>
            </div>

            {/* Examples */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-[#c9d1d9] mb-3">Common Examples</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {category.examples.map((example, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-[#0d1117] rounded border border-[#30363d]"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[#58a6ff]">→</span>
                      <span className="text-sm text-[#c9d1d9]">{example}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Detection Tips */}
            <div className="mb-6 p-4 bg-blue-900/10 border border-blue-800/60 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-400 mb-3 flex items-center gap-2">
                🔍 Detection Tips
              </h3>
              <div className="space-y-2 text-sm text-[#c9d1d9]">
                {getDetectionTips(category.id).map((tip, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="text-blue-400 mt-1">•</span>
                    <span>{tip}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Related MITRE Techniques */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-[#c9d1d9] mb-3">Related MITRE ATT&CK Techniques</h3>
              <div className="space-y-2">
                {getRelatedMitreTechniques(category.id).map((tech, idx) => (
                  <a
                    key={idx}
                    href={tech.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-3 bg-[#0d1117] rounded border border-[#30363d] hover:border-[#58a6ff] transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-mono text-[#58a6ff]">{tech.id}</div>
                        <div className="text-sm text-[#c9d1d9]">{tech.name}</div>
                      </div>
                      <span className="text-[#8b949e]">→</span>
                    </div>
                  </a>
                ))}
              </div>
            </div>

            {/* External Resources */}
            <div className="border-t border-[#30363d] pt-6">
              <h3 className="text-lg font-semibold text-[#c9d1d9] mb-3">Learn More</h3>
              <a
                href={category.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#58a6ff] text-white rounded hover:bg-[#79c0ff] transition-colors"
              >
                View on OWASP →
              </a>
            </div>
          </div>
        )}

        {/* Quick Quiz */}
        {category && (
          <div className="mt-8 bg-[#161b22] border border-[#30363d] rounded-lg p-6">
            <h3 className="text-lg font-semibold text-[#c9d1d9] mb-4">Quick Check</h3>
            <p className="text-sm text-[#8b949e] mb-4">
              Test your understanding of {category.name}
            </p>
            <div className="space-y-3">
              {getQuizQuestions(category.id).map((question, idx) => (
                <div key={idx} className="p-4 bg-[#0d1117] rounded border border-[#30363d]">
                  <div className="text-sm font-semibold text-[#c9d1d9] mb-2">
                    {idx + 1}. {question.question}
                  </div>
                  <div className="text-xs text-[#8b949e] mt-2">
                    <strong>Answer:</strong> {question.answer}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function getDetectionTips(categoryId: string): string[] {
  const tips: Record<string, string[]> = {
    'A01:2021': [
      'Monitor for unauthorized access attempts to sensitive resources',
      'Check for privilege escalation patterns in logs',
      'Review API access logs for broken access control',
      'Look for direct object references without proper authorization',
    ],
    'A02:2021': [
      'Check for weak encryption algorithms in use',
      'Monitor for exposure of sensitive data in logs',
      'Verify proper key management practices',
      'Look for insecure data transmission (non-HTTPS)',
    ],
    'A03:2021': [
      'Monitor for SQL injection patterns in query logs',
      'Check for XSS attempts in user input',
      'Look for command injection in system logs',
      'Review input validation failures',
    ],
    'A04:2021': [
      'Review threat modeling documentation',
      'Check for insecure default configurations',
      'Look for missing security controls',
      'Verify defense-in-depth implementation',
    ],
    'A05:2021': [
      'Check for default credentials in use',
      'Monitor for exposed sensitive information',
      'Review configuration management practices',
      'Look for unnecessary features enabled',
    ],
    'A06:2021': [
      'Monitor for outdated library versions',
      'Check for known vulnerabilities in dependencies',
      'Review patch management processes',
      'Look for unmaintained components',
    ],
    'A07:2021': [
      'Monitor for credential stuffing attempts',
      'Check for weak password policies',
      'Review session management logs',
      'Look for authentication bypass attempts',
    ],
    'A08:2021': [
      'Review CI/CD pipeline security',
      'Check for untrusted dependencies',
      'Monitor for supply chain attacks',
      'Verify integrity verification processes',
    ],
    'A09:2021': [
      'Check for insufficient logging',
      'Review security monitoring coverage',
      'Look for missing alerting mechanisms',
      'Verify log retention policies',
    ],
    'A10:2021': [
      'Monitor for internal network scanning',
      'Check for access to internal services',
      'Look for cloud metadata access attempts',
      'Review firewall bypass attempts',
    ],
  };

  return tips[categoryId] || [];
}

function getRelatedMitreTechniques(categoryId: string): Array<{ id: string; name: string; url: string }> {
  const techniques: Record<string, Array<{ id: string; name: string; url: string }>> = {
    'A01:2021': [
      {
        id: 'T1078',
        name: 'Valid Accounts',
        url: 'https://attack.mitre.org/techniques/T1078/',
      },
      {
        id: 'T1134',
        name: 'Access Token Manipulation',
        url: 'https://attack.mitre.org/techniques/T1134/',
      },
    ],
    'A03:2021': [
      {
        id: 'T1059',
        name: 'Command and Scripting Interpreter',
        url: 'https://attack.mitre.org/techniques/T1059/',
      },
      {
        id: 'T1190',
        name: 'Exploit Public-Facing Application',
        url: 'https://attack.mitre.org/techniques/T1190/',
      },
    ],
    'A07:2021': [
      {
        id: 'T1078',
        name: 'Valid Accounts',
        url: 'https://attack.mitre.org/techniques/T1078/',
      },
      {
        id: 'T1110',
        name: 'Brute Force',
        url: 'https://attack.mitre.org/techniques/T1110/',
      },
    ],
    'A09:2021': [
      {
        id: 'T1562',
        name: 'Impair Defenses',
        url: 'https://attack.mitre.org/techniques/T1562/',
      },
      {
        id: 'T1070',
        name: 'Indicator Removal on Host',
        url: 'https://attack.mitre.org/techniques/T1070/',
      },
    ],
  };

  return techniques[categoryId] || [];
}

function getQuizQuestions(categoryId: string): Array<{ question: string; answer: string }> {
  const questions: Record<string, Array<{ question: string; answer: string }>> = {
    'A01:2021': [
      {
        question: 'What is the primary risk of broken access control?',
        answer: 'Unauthorized users can access resources they should not have access to, leading to data breaches and privilege escalation.',
      },
      {
        question: 'How can you detect broken access control?',
        answer: 'Monitor for access attempts to sensitive resources, review authorization checks, and look for privilege escalation patterns.',
      },
    ],
    'A03:2021': [
      {
        question: 'What is SQL injection?',
        answer: 'A vulnerability where user input is not properly sanitized, allowing attackers to execute malicious SQL queries.',
      },
      {
        question: 'How can you prevent injection attacks?',
        answer: 'Use parameterized queries, input validation, output encoding, and least privilege principles.',
      },
    ],
    'A07:2021': [
      {
        question: 'What are common authentication failures?',
        answer: 'Weak passwords, credential stuffing, session hijacking, and authentication bypass vulnerabilities.',
      },
      {
        question: 'How can you improve authentication security?',
        answer: 'Implement strong password policies, multi-factor authentication, secure session management, and account lockout mechanisms.',
      },
    ],
  };

  return questions[categoryId] || [
    {
      question: 'What is the main risk of this vulnerability?',
      answer: 'Review the OWASP documentation for detailed information about this category.',
    },
  ];
}

