/**
 * ArtVista – Complete Test Runner
 * Runs validation, ranking calculations, voting code security, and business rules.
 */

const { execSync } = require('child_process');

console.log('--- Running ArtVista Test Suite ---');

try {
  console.log('\n[1/2] Running Public Voting Test Suite...');
  execSync('node scripts/test-public-voting.js', { stdio: 'inherit' });

  console.log('\n[2/2] Running Bulk Upload Test Suite (110 Images)...');
  execSync('node scripts/test-bulk-upload.js', { stdio: 'inherit' });

  console.log('\n====================================================');
  console.log('   ALL ARTVISTA TEST SUITES PASSED SUCCESSFULLY!    ');
  console.log('====================================================\n');
} catch (error) {
  console.error('\nTest execution failed.');
  process.exit(1);
}
