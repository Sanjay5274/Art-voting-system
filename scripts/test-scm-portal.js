const assert = require('assert');
const { validateAdminCredentials } = require('../src/lib/auth');
const {
  getAllDrawings,
  addDrawings,
  voteDrawing,
  deleteDrawing,
  clearAllDrawings,
  resetAllVotes,
  getLeaderboard,
} = require('../src/lib/store');

console.log('--- Testing SCM Garments Portal Logic ---');

// 1. Test Admin Credentials
console.log('1. Testing Admin Authentication...');
assert.strictEqual(validateAdminCredentials('admin@gmail.com', 'Admin@1234'), true);
assert.strictEqual(validateAdminCredentials('ADMIN@GMAIL.COM', 'Admin@1234'), true);
assert.strictEqual(validateAdminCredentials('admin@gmail.com', 'wrongpass'), false);
assert.strictEqual(validateAdminCredentials('wrong@gmail.com', 'Admin@1234'), false);
console.log('✓ Admin credentials validated (admin@gmail.com / Admin@1234)');

// 2. Clear state for testing
clearAllDrawings();
assert.strictEqual(getAllDrawings().length, 0);
console.log('✓ Clear all drawings verified');

// 3. Test Bulk Upload and Sequential IDs
console.log('2. Testing Bulk Upload and Sequential Numbering...');
const mockFiles = [
  { filename: 'art1.jpg', image_path: '/uploads/art1.jpg', title: 'Mountain Landscape' },
  { filename: 'art2.png', image_path: '/uploads/art2.png', title: 'Sunset Lake' },
  { filename: 'art3.webp', image_path: '/uploads/art3.webp', title: 'Forest Path' },
];
const added = addDrawings(mockFiles);
assert.strictEqual(added.length, 3);
assert.strictEqual(added[0].drawing_number, 'DRW-001');
assert.strictEqual(added[1].drawing_number, 'DRW-002');
assert.strictEqual(added[2].drawing_number, 'DRW-003');
console.log('✓ Sequential numbering allocated: DRW-001, DRW-002, DRW-003');

// 4. Test 1-Click Voting
console.log('3. Testing 1-Click Voting...');
const voteRes1 = voteDrawing(added[0].id);
assert.strictEqual(voteRes1.success, true);
assert.strictEqual(voteRes1.totalVotes, 1);

const voteRes2 = voteDrawing(added[0].id);
assert.strictEqual(voteRes2.totalVotes, 2);

voteDrawing(added[1].id); // DRW-002 gets 1 vote

const leaderboard = getLeaderboard();
assert.strictEqual(leaderboard[0].drawing_number, 'DRW-001');
assert.strictEqual(leaderboard[0].votes, 2);
assert.strictEqual(leaderboard[0].rank, 1);

assert.strictEqual(leaderboard[1].drawing_number, 'DRW-002');
assert.strictEqual(leaderboard[1].votes, 1);
assert.strictEqual(leaderboard[1].rank, 2);
console.log('✓ 1-Click voting and live ranking verified');

// 5. Test Vote Reset
console.log('4. Testing Reset Votes...');
resetAllVotes();
const afterReset = getAllDrawings();
assert.strictEqual(afterReset.every((d) => d.votes === 0), true);
console.log('✓ Reset votes verified (all votes 0)');

// Clean up
clearAllDrawings();
console.log('=============================================');
console.log('ALL SCM GARMENTS PORTAL TESTS PASSED (5/5)!');
console.log('=============================================');

