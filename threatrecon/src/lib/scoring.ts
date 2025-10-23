import jaroWinkler from 'jaro-winkler';
import { ScanInput } from './types';

export function scoreName(inputName: string, candidateName: string): { score: number; reason: string } {
  const score = jaroWinkler(inputName.toLowerCase(), candidateName.toLowerCase());
  const reason = `Name similarity ${score.toFixed(2)} via Jaro-Winkler`;
  return { score, reason };
}

export function scoreEmail(inputEmail: string, candidateEmail: string): { score: number; reason: string } {
  const match = inputEmail.toLowerCase() === candidateEmail.toLowerCase();
  return { score: match ? 1 : 0, reason: match ? 'Exact email match' : 'Email mismatch' };
}

export function scorePhone(inputPhone: string, candidatePhone: string): { score: number; reason: string } {
  const match = inputPhone === candidatePhone;
  return { score: match ? 1 : 0, reason: match ? 'Exact phone match' : 'Phone mismatch' };
}

export function overallScore(input: ScanInput, candidate: { name?: string; email?: string; phone?: string; address?: string; username?: string }): { score: number; reason: string } {
  let total = 0;
  const reasons: string[] = [];
  let weightSum = 0;

  if (input.fullName && candidate.name) {
    const { score, reason } = scoreName(input.fullName, candidate.name);
    total += score * 0.6;
    weightSum += 0.6;
    reasons.push(reason);
  }
  if (input.email && candidate.email) {
    const { score, reason } = scoreEmail(input.email, candidate.email);
    total += score * 0.8;
    weightSum += 0.8;
    reasons.push(reason);
  }
  if (input.phone && candidate.phone) {
    const { score, reason } = scorePhone(input.phone, candidate.phone);
    total += score * 0.8;
    weightSum += 0.8;
    reasons.push(reason);
  }
  if (input.username && candidate.username) {
    const exact = input.username.toLowerCase() === candidate.username.toLowerCase();
    total += (exact ? 1 : 0) * 0.7;
    weightSum += 0.7;
    reasons.push(exact ? 'Exact username match' : 'Username mismatch');
  }
  if (weightSum === 0) return { score: 0, reason: 'Insufficient comparable fields' };
  const score = Math.max(0, Math.min(1, total / weightSum));
  return { score, reason: reasons.join('; ') };
}
