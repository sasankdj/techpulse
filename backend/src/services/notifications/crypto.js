import crypto from 'node:crypto';
import { env } from '../../config/env.js';

const ALGO = 'aes-256-gcm';

function getKeyBuffer() {
  const raw = env.credentialsEncryptionKey;
  if (!raw || raw.length < 16) {
    const err = new Error(
      'CREDENTIALS_ENCRYPTION_KEY is not configured on the backend. Generate a 32-byte hex secret and set it in backend/.env to store custom Telegram bot tokens securely.'
    );
    err.statusCode = 503;
    err.code = 'ENCRYPTION_KEY_MISSING';
    throw err;
  }
  return crypto.createHash('sha256').update(raw).digest();
}

export function encryptSecret(plaintext) {
  const key = getKeyBuffer();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decryptSecret(payload) {
  if (!payload || typeof payload !== 'string') return null;
  const parts = payload.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted payload format.');
  }
  const [ivHex, tagHex, dataHex] = parts;
  const key = getKeyBuffer();
  const decipher = crypto.createDecipheriv(ALGO, key, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataHex, 'hex')),
    decipher.final(),
  ]);
  return decrypted.toString('utf8');
}
