import crypto from 'crypto';

export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    codes.push(`${code.slice(0, 4)}-${code.slice(4)}`);
  }
  return codes;
}

export function hashBackupCode(code: string): string {
  return crypto
    .createHash('sha256')
    .update(code.replace('-', '').toLowerCase())
    .digest('hex');
}

export function verifyBackupCode(code: string, hashedCodes: string[]): boolean {
  const hash = hashBackupCode(code);
  return hashedCodes.includes(hash);
}

