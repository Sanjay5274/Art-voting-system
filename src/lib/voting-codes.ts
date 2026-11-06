import crypto from 'crypto';

/**
 * Normalizes user-entered voting codes by trimming and converting to uppercase.
 */
export function normalizeVotingCode(code: string): string {
  return (code || '').trim().toUpperCase();
}

/**
 * Hashes a single-use voting code using SHA-256.
 * Only the hash is stored in PostgreSQL to protect voting code integrity.
 */
export function hashVotingCode(code: string): string {
  const normalized = normalizeVotingCode(code);
  const salt = process.env.VOTING_CODE_GENERATION_SECRET || 'artvista-salt';
  return crypto
    .createHash('sha256')
    .update(`${salt}:${normalized}`)
    .digest('hex');
}

/**
 * Generates a human-friendly unique voting code, e.g. "VOTE-A7F2-9K3P".
 */
export function generateRandomVotingCode(): string {
  const segment1 = crypto.randomBytes(2).toString('hex').toUpperCase();
  const segment2 = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `VOTE-${segment1}-${segment2}`;
}

