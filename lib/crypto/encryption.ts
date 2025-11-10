import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const SECRET_KEY = process.env.ENCRYPTION_KEY;

if (!SECRET_KEY) {
  console.warn('ENCRYPTION_KEY not set. 2FA secrets will not be encrypted. Set a 32-byte (64 hex character) key in production.');
}

function getKey(): Buffer {
  if (!SECRET_KEY) {
    // Fallback for development - NOT SECURE for production
    return crypto.scryptSync('fallback-key-not-secure', 'salt', 32);
  }
  
  const keyBuffer = Buffer.from(SECRET_KEY, 'hex');
  if (keyBuffer.length !== 32) {
    throw new Error('ENCRYPTION_KEY must be 32 bytes (64 hex characters)');
  }
  return keyBuffer;
}

export function encrypt(text: string): string {
  if (!SECRET_KEY) {
    // In development without encryption key, return base64 encoded (NOT SECURE)
    return Buffer.from(text).toString('base64');
  }

  const iv = crypto.randomBytes(16);
  const key = getKey();
  // @ts-expect-error - Buffer is compatible with Node.js crypto API
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

export function decrypt(text: string): string {
  if (!SECRET_KEY) {
    // In development without encryption key, decode from base64
    return Buffer.from(text, 'base64').toString('utf8');
  }

  const [ivHex, authTagHex, encryptedHex] = text.split(':');
  if (!ivHex || !authTagHex || !encryptedHex) {
    throw new Error('Invalid encrypted data format');
  }

  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const key = getKey();
  
  // @ts-expect-error - Buffer is compatible with Node.js crypto API
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  // @ts-expect-error - Buffer is compatible with Node.js crypto API
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

