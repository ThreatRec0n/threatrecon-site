import * as crypto from 'crypto';

export interface AARContent {
  sessionId: string;
  generatedAt: string;
  content: string;
  metadata: {
    generated_at: Date;
    generated_by: string;
    version: string;
  };
}

export interface AARSignature {
  signed_hash: string;
  signing_key_id: string;
  generated_at: string;
  content_hash: string;
}

export interface SigningKeyInfo {
  keyId: string;
  algorithm: string;
  rotationGuidance: string;
}

export class AARSigningService {
  private signingKeyId: string;
  private signingSecret: string;

  constructor() {
    this.signingKeyId = process.env.SIGNING_KEY_ID || 'tr-public-hosted-v1';
    this.signingSecret = process.env.SIGNING_SECRET || 'default-signing-secret-change-in-production';
  }

  generateAARHash(content: AARContent): string {
    // Create a deterministic string from the AAR content
    const contentString = JSON.stringify({
      sessionId: content.sessionId,
      generatedAt: content.generatedAt,
      content: content.content,
      metadata: content.metadata
    }, null, 0); // No formatting for consistent hashing

    // Generate SHA-256 hash
    return crypto.createHash('sha256').update(contentString).digest('hex');
  }

  signAAR(content: AARContent): AARSignature {
    const contentHash = this.generateAARHash(content);
    const generatedAt = new Date().toISOString();

    // Create HMAC signature using the content hash
    const signedHash = crypto
      .createHmac('sha256', this.signingSecret)
      .update(contentHash)
      .digest('hex');

    return {
      signed_hash: signedHash,
      signing_key_id: this.signingKeyId,
      generated_at: generatedAt,
      content_hash: contentHash
    };
  }

  verifyAARSignature(content: AARContent, signature: AARSignature): boolean {
    try {
      // Regenerate the content hash
      const expectedContentHash = this.generateAARHash(content);
      
      // Verify content hash matches
      if (expectedContentHash !== signature.content_hash) {
        return false;
      }

      // Regenerate the signed hash
      const expectedSignedHash = crypto
        .createHmac('sha256', this.signingSecret)
        .update(signature.content_hash)
        .digest('hex');

      // Verify signed hash matches
      return expectedSignedHash === signature.signed_hash;
    } catch (error) {
      console.error('Error verifying AAR signature:', error);
      return false;
    }
  }

  getSigningKeyInfo(): SigningKeyInfo {
    return {
      keyId: this.signingKeyId,
      algorithm: 'SHA-256',
      rotationGuidance: 'Rotate signing keys every 90 days for production deployments'
    };
  }

  rotateSigningKey(newKeyId: string, newSecret: string): void {
    this.signingKeyId = newKeyId;
    this.signingSecret = newSecret;
    console.log(`✅ Signing key rotated to: ${newKeyId}`);
  }
}
