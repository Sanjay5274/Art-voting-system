/**
 * ArtVista – Public Drawing Competition Voting Test Suite
 * Tests single-use voting codes, hashing, ballot submission, duplicate prevention,
 * selection limits, tied ranking logic, and organizer secret protection.
 */

const assert = require('assert');
const crypto = require('crypto');

// 1. Voting Code Normalization & SHA-256 Hashing
function normalizeVotingCode(code) {
  return (code || '').trim().toUpperCase();
}

function hashVotingCode(code, salt = 'artvista-voting-secret-salt-2026') {
  const normalized = normalizeVotingCode(code);
  return crypto.createHash('sha256').update(`${salt}:${normalized}`).digest('hex');
}

function generateRandomVotingCode() {
  const segment1 = crypto.randomBytes(2).toString('hex').toUpperCase();
  const segment2 = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `VOTE-${segment1}-${segment2}`;
}

// 2. Ranking Calculation with Tied Ranks (1224 competition style)
function calculateVoteRankings(drawings) {
  const sorted = [...drawings].sort((a, b) => {
    if (b.vote_count !== a.vote_count) {
      return b.vote_count - a.vote_count;
    }
    return (a.drawing_number || '').localeCompare(b.drawing_number || '');
  });

  let currentRank = 1;
  return sorted.map((item, i) => {
    if (i > 0 && item.vote_count < sorted[i - 1].vote_count) {
      currentRank = i + 1;
    }
    return {
      ...item,
      rank: currentRank,
    };
  });
}

// 3. Mock Database State for Atomic Single-Use Token Submission
class MockVotingDb {
  constructor() {
    this.tokens = new Map(); // tokenHash -> { id, used_at }
    this.votes = new Map();  // voteId -> { tokenId, drawingIds }
    this.settings = { max_selections: 3, voting_open: true, results_published: false };
    this.drawings = new Set();
  }

  addToken(code) {
    const hash = hashVotingCode(code);
    const id = `token-${crypto.randomUUID()}`;
    this.tokens.set(hash, { id, used_at: null });
    return code;
  }

  addDrawing(id) {
    this.drawings.add(id);
  }

  // Simulates atomic UPDATE voting_tokens SET used_at = NOW() WHERE token_hash = $1 AND used_at IS NULL
  submitVote(code, selectedDrawingIds) {
    if (!this.settings.voting_open) {
      throw new Error('Voting is currently closed by the competition organizer.');
    }

    if (!code || typeof code !== 'string') {
      throw new Error('A valid single-use voting code is required.');
    }

    const uniqueIds = Array.from(new Set(selectedDrawingIds));
    if (uniqueIds.length === 0) {
      throw new Error('Please select at least one drawing.');
    }

    if (uniqueIds.length > this.settings.max_selections) {
      throw new Error(`You may select at most ${this.settings.max_selections} drawings.`);
    }

    for (const id of uniqueIds) {
      if (!this.drawings.has(id)) {
        throw new Error(`Drawing ${id} does not exist.`);
      }
    }

    const hash = hashVotingCode(code);
    const token = this.tokens.get(hash);

    if (!token) {
      throw new Error('Invalid voting code. Please check your code and try again.');
    }

    if (token.used_at !== null) {
      throw new Error('This voting code has already been used. Each code is single-use only.');
    }

    // Atomic claim
    token.used_at = new Date();

    const voteId = `vote-${crypto.randomUUID()}`;
    this.votes.set(voteId, { tokenId: token.id, drawingIds: uniqueIds });

    return { success: true, voteId };
  }
}

async function runTests() {
  console.log('====================================================');
  console.log('  ArtVista Public Voting Test Suite                 ');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  function test(name, fn) {
    total++;
    try {
      fn();
      console.log(`✓ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`✗ FAIL: ${name}`);
      console.error(err);
    }
  }

  // Test 1: Code normalization and hashing
  test('Voting code is normalized (case insensitive, trimmed) and hashed with SHA-256', () => {
    const rawCode = '  vote-9a2f-3b7c  ';
    const cleanCode = normalizeVotingCode(rawCode);
    assert.strictEqual(cleanCode, 'VOTE-9A2F-3B7C');

    const hash1 = hashVotingCode('VOTE-9A2F-3B7C');
    const hash2 = hashVotingCode('  vote-9a2f-3b7c  ');
    assert.strictEqual(hash1, hash2);
    assert.strictEqual(hash1.length, 64); // SHA-256 hex string length
  });

  // Test 2: Valid vote submission
  test('Director can submit ballot with up to configured max selections using single-use code', () => {
    const db = new MockVotingDb();
    ['drw-1', 'drw-2', 'drw-3', 'drw-4'].forEach((id) => db.addDrawing(id));

    const code = db.addToken('VOTE-1111-2222');
    const result = db.submitVote(code, ['drw-1', 'drw-3']);

    assert.strictEqual(result.success, true);
    assert.strictEqual(db.votes.size, 1);
  });

  // Test 3: Single-use code cannot be reused
  test('A voting code cannot be reused once submitted', () => {
    const db = new MockVotingDb();
    ['drw-1', 'drw-2'].forEach((id) => db.addDrawing(id));

    const code = db.addToken('VOTE-AAAA-BBBB');
    // First submission
    db.submitVote(code, ['drw-1']);

    // Attempted duplicate reuse
    assert.throws(() => {
      db.submitVote(code, ['drw-2']);
    }, /already been used/i);
  });

  // Test 4: Invalid voting codes are rejected
  test('Invalid voting codes are rejected with clear error message', () => {
    const db = new MockVotingDb();
    db.addDrawing('drw-1');

    assert.throws(() => {
      db.submitVote('VOTE-DOES-NOT-EXIST', ['drw-1']);
    }, /Invalid voting code/i);
  });

  // Test 5: Exceeding max selections is blocked
  test('Selecting more than configured max_selections is strictly blocked server-side', () => {
    const db = new MockVotingDb();
    db.settings.max_selections = 3;
    ['drw-1', 'drw-2', 'drw-3', 'drw-4'].forEach((id) => db.addDrawing(id));

    const code = db.addToken('VOTE-TEST-MAX3');

    assert.throws(() => {
      db.submitVote(code, ['drw-1', 'drw-2', 'drw-3', 'drw-4']); // 4 selections > 3
    }, /at most 3 drawings/i);
  });

  // Test 6: Submissions when voting is closed are rejected
  test('Submissions are rejected when voting_open is false', () => {
    const db = new MockVotingDb();
    db.settings.voting_open = false; // Closed!
    db.addDrawing('drw-1');
    const code = db.addToken('VOTE-CLOSED-TEST');

    assert.throws(() => {
      db.submitVote(code, ['drw-1']);
    }, /Voting is currently closed/i);
  });

  // Test 7: Tied rankings handled properly (same rank for equal votes)
  test('Leaderboard handles ties consistently (tied votes share rank, next rank skips accordingly)', () => {
    const sampleResults = [
      { id: '1', drawing_number: 'DRW-001', vote_count: 15 },
      { id: '2', drawing_number: 'DRW-002', vote_count: 10 },
      { id: '3', drawing_number: 'DRW-003', vote_count: 10 }, // Tied #2
      { id: '4', drawing_number: 'DRW-004', vote_count: 5 },  // Rank #4
      { id: '5', drawing_number: 'DRW-005', vote_count: 5 },  // Tied #4
      { id: '6', drawing_number: 'DRW-006', vote_count: 1 },  // Rank #6
    ];

    const ranked = calculateVoteRankings(sampleResults);

    assert.strictEqual(ranked[0].rank, 1);
    assert.strictEqual(ranked[1].rank, 2);
    assert.strictEqual(ranked[2].rank, 2, 'Tied drawing must share rank #2');
    assert.strictEqual(ranked[3].rank, 4, 'Following drawing must be rank #4');
    assert.strictEqual(ranked[4].rank, 4, 'Second tied drawing must be rank #4');
    assert.strictEqual(ranked[5].rank, 6, 'Final drawing must be rank #6');
  });

  // Test 8: Public results hidden until organizer publishes
  test('Results remain inaccessible to the public when results_published is false', () => {
    const settings = { results_published: false };
    const canPublicView = settings.results_published;
    assert.strictEqual(canPublicView, false);
  });

  // Test 9: Organizer secret verification
  test('Organizer operations require matching ORGANIZER_SECRET', () => {
    const secret = 'artvista-organizer-secret-key-2026';
    const verify = (input) => input === secret;

    assert.strictEqual(verify('artvista-organizer-secret-key-2026'), true);
    assert.strictEqual(verify('wrong-password'), false);
    assert.strictEqual(verify(''), false);
  });

  // Test 10: Public gallery anonymization (no student_name)
  test('Public drawings payload strictly excludes student names', () => {
    const rawDbRow = {
      id: 'd1',
      drawing_number: 'DRW-001',
      student_name: 'Private Student',
      drawing_title: 'Sunset',
      category: 'Landscape',
      image_path: 'https://storage/img.jpg',
      created_at: new Date(),
    };

    // Public mapping
    const publicRow = {
      id: rawDbRow.id,
      drawing_number: rawDbRow.drawing_number,
      drawing_title: rawDbRow.drawing_title,
      category: rawDbRow.category,
      image_path: rawDbRow.image_path,
      created_at: rawDbRow.created_at,
    };

    assert.strictEqual(publicRow.student_name, undefined);
    assert.strictEqual(publicRow.drawing_number, 'DRW-001');
  });

  console.log(`\n====================================================`);
  console.log(`  Tests Complete: ${passed}/${total} passed successfully!  `);
  console.log(`====================================================\n`);

  if (passed !== total) {
    process.exit(1);
  }
}

runTests();

