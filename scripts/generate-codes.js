/**
 * ArtVista - CLI Single-Use Voting Code Generator
 * Usage:
 *   node scripts/generate-codes.js [count]
 * Example:
 *   node scripts/generate-codes.js 25
 */

require('dotenv').config({ path: '.env.local' });
if (!process.env.DATABASE_URL) {
  require('dotenv').config({ path: '.env' });
}

const { neon } = require('@neondatabase/serverless');
const crypto = require('crypto');

function hashVotingCode(code) {
  const normalized = (code || '').trim().toUpperCase();
  const salt = process.env.VOTING_CODE_GENERATION_SECRET || 'artvista-salt';
  return crypto.createHash('sha256').update(`${salt}:${normalized}`).digest('hex');
}

function generateRandomVotingCode() {
  const segment1 = crypto.randomBytes(2).toString('hex').toUpperCase();
  const segment2 = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `VOTE-${segment1}-${segment2}`;
}

async function main() {
  const count = parseInt(process.argv[2] || '10', 10);
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('Error: DATABASE_URL is not set in your environment.');
    process.exit(1);
  }

  const sql = neon(databaseUrl);
  console.log(`Generating ${count} single-use voting codes...\n`);

  const codes = [];
  for (let i = 0; i < count; i++) {
    const code = generateRandomVotingCode();
    const hash = hashVotingCode(code);
    await sql.query(
      `INSERT INTO voting_tokens (token_hash, created_at)
       VALUES ($1, NOW())
       ON CONFLICT (token_hash) DO NOTHING`,
      [hash]
    );
    codes.push(code);
  }

  console.log('--- Generated Voting Codes (Save & Distribute to Directors) ---');
  codes.forEach((c) => console.log(c));
  console.log('\nSUCCESS: All codes hashed and stored securely in Neon PostgreSQL.');
}

main().catch((err) => {
  console.error('Error generating codes:', err);
  process.exit(1);
});

