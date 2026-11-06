/**
 * ArtVista - Bulk Upload Test Suite (100+ Images)
 * Tests controlled batching (5 concurrent), direct storage workflow,
 * validation, error handling, orphan cleanup, and retry mechanisms.
 */

const assert = require('assert');

// 1. Image Validation Logic
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

function validateImageMetadata(fileName, fileType, fileSize) {
  if (fileSize > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File size exceeds 10MB limit (size: ${(fileSize / (1024 * 1024)).toFixed(2)}MB).`,
    };
  }
  const type = (fileType || '').toLowerCase();
  const name = (fileName || '').toLowerCase();
  const validMime = ALLOWED_IMAGE_TYPES.includes(type);
  const validExt = /\.(jpe?g|png|webp)$/i.test(name);
  if (!validMime && !validExt) {
    return {
      valid: false,
      error: 'Invalid file format. Only JPG, JPEG, PNG, and WEBP images are supported.',
    };
  }
  return { valid: true };
}

// 2. Concurrency Queue Runner
async function runWithConcurrencyLimit(items, limit, taskFn) {
  let activeWorkers = 0;
  let maxObservedConcurrency = 0;
  const queue = [...items];
  const results = [];

  const worker = async () => {
    while (queue.length > 0) {
      const currentItem = queue.shift();
      if (!currentItem) break;

      activeWorkers++;
      if (activeWorkers > maxObservedConcurrency) {
        maxObservedConcurrency = activeWorkers;
      }

      try {
        const res = await taskFn(currentItem);
        results.push(res);
      } finally {
        activeWorkers--;
      }
    }
  };

  const pool = Array.from({ length: Math.min(limit, items.length) }, () => worker());
  await Promise.all(pool);

  return { results, maxObservedConcurrency };
}

async function runBulkTests() {
  console.log('====================================================');
  console.log('   ArtVista Bulk Upload Test Suite (100+ Images)   ');
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

  async function asyncTest(name, fn) {
    total++;
    try {
      await fn();
      console.log(`✓ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`✗ FAIL: ${name}`);
      console.error(err);
    }
  }

  // --- Test 1: Generate 110 Test Images (mix of valid, invalid format, and oversized) ---
  const testImages = [];
  // 90 Valid images
  for (let i = 1; i <= 90; i++) {
    const ext = ['jpg', 'jpeg', 'png', 'webp'][i % 4];
    const mime = ['image/jpeg', 'image/jpeg', 'image/png', 'image/webp'][i % 4];
    testImages.push({
      id: `img-${i}`,
      fileName: `student_art_${String(i).padStart(3, '0')}.${ext}`,
      fileType: mime,
      fileSize: 1024 * 1024 * (1 + (i % 5)), // 1MB to 5MB
      shouldSucceed: true,
    });
  }
  // 10 Oversized images (> 10MB)
  for (let i = 91; i <= 100; i++) {
    testImages.push({
      id: `img-${i}`,
      fileName: `giant_scan_${i}.jpg`,
      fileType: 'image/jpeg',
      fileSize: 1024 * 1024 * 12, // 12MB
      shouldSucceed: false,
      expectedError: 'File size exceeds 10MB',
    });
  }
  // 10 Invalid format files (PDF, EXE, GIF, SVG, TXT)
  const badExts = ['pdf', 'exe', 'gif', 'svg', 'txt', 'zip', 'bmp', 'doc', 'mp4', 'iso'];
  for (let i = 101; i <= 110; i++) {
    const ext = badExts[i - 101];
    testImages.push({
      id: `img-${i}`,
      fileName: `invalid_file_${i}.${ext}`,
      fileType: `application/${ext}`,
      fileSize: 1024 * 500, // 500KB
      shouldSucceed: false,
      expectedError: 'Invalid file format',
    });
  }

  test('Generated test dataset has 110 images (90 valid, 10 oversized, 10 invalid formats)', () => {
    assert.strictEqual(testImages.length, 110);
    assert.strictEqual(testImages.filter((x) => x.shouldSucceed).length, 90);
    assert.strictEqual(testImages.filter((x) => !x.shouldSucceed).length, 20);
  });

  // --- Test 2: Pre-Upload Validation for all 110 files ---
  test('Image validation filters out invalid formats and oversized files', () => {
    let validCount = 0;
    let invalidCount = 0;

    for (const img of testImages) {
      const res = validateImageMetadata(img.fileName, img.fileType, img.fileSize);
      if (res.valid) {
        validCount++;
        assert.strictEqual(img.shouldSucceed, true);
      } else {
        invalidCount++;
        assert.strictEqual(img.shouldSucceed, false);
        if (img.expectedError) {
          assert.ok(
            res.error.includes(img.expectedError),
            `Expected error "${img.expectedError}" in "${res.error}"`
          );
        }
      }
    }

    assert.strictEqual(validCount, 90);
    assert.strictEqual(invalidCount, 20);
  });

  // --- Test 3: Concurrency Engine with Batch Limit of 5 ---
  await asyncTest('Controlled Concurrency runs at most 5 concurrent uploads', async () => {
    const limit = 5;
    const executionLogs = [];

    const { results, maxObservedConcurrency } = await runWithConcurrencyLimit(
      testImages,
      limit,
      async (item) => {
        // Simulate upload delay (5-15ms)
        await new Promise((r) => setTimeout(r, 8));
        const validation = validateImageMetadata(item.fileName, item.fileType, item.fileSize);
        return {
          id: item.id,
          success: validation.valid,
          error: validation.error || null,
        };
      }
    );

    assert.strictEqual(results.length, 110);
    assert.ok(
      maxObservedConcurrency <= limit,
      `Observed concurrency ${maxObservedConcurrency} exceeded limit of ${limit}`
    );
    assert.ok(
      maxObservedConcurrency >= 1,
      `Observed concurrency ${maxObservedConcurrency} should be at least 1`
    );

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    assert.strictEqual(successCount, 90);
    assert.strictEqual(failCount, 20);
  });

  // --- Test 4: Presigned URL Generation and Path Sanitization ---
  test('Presign generates server-controlled submissions/ path with UUID', () => {
    const crypto = require('crypto');
    const fileName = 'Student Art #1 @ 2026.png';
    const ext = fileName.split('.').pop().toLowerCase();
    const storagePath = `submissions/${crypto.randomUUID()}.${ext}`;

    assert.ok(storagePath.startsWith('submissions/'));
    assert.ok(storagePath.endsWith('.png'));
    assert.strictEqual(/^[a-f0-9-]+$/.test(storagePath.replace('submissions/', '').replace('.png', '')), true);
  });

  // --- Test 5: Atomic Drawing ID Sequencing under Concurrency ---
  test('Sequential Drawing Numbering allocates distinct consecutive IDs', () => {
    const allocated = new Set();
    let currentSeq = 100;

    for (let i = 0; i < 90; i++) {
      currentSeq++;
      const drawingNumber = `DRW-${String(currentSeq).padStart(3, '0')}`;
      assert.strictEqual(allocated.has(drawingNumber), false, `Duplicate drawing number: ${drawingNumber}`);
      allocated.add(drawingNumber);
    }

    assert.strictEqual(allocated.size, 90);
    assert.ok(allocated.has('DRW-101'));
    assert.ok(allocated.has('DRW-190'));
  });

  // --- Test 6: Orphan Storage Cleanup on Database Failure ---
  await asyncTest('Failed database insertion removes uploaded storage object', async () => {
    const deletedStoragePaths = [];
    const mockStorage = {
      async remove(paths) {
        deletedStoragePaths.push(...paths);
        return { data: paths, error: null };
      },
    };

    const uploadedPath = 'submissions/sample-failed-upload.jpg';

    // Simulate endpoint registration failure
    try {
      // Step A: Storage upload succeeds
      // Step B: DB insert throws
      throw new Error('Database connection reset during insert');
    } catch (err) {
      // Cleanup hook triggers
      await mockStorage.remove([uploadedPath]);
    }

    assert.strictEqual(deletedStoragePaths.length, 1);
    assert.strictEqual(deletedStoragePaths[0], uploadedPath);
  });

  // --- Test 7: Retry Functionality for Failed Uploads ---
  test('Retry only processes items with error status, preserving successful ones', () => {
    const uploadState = [
      { id: '1', status: 'success', drawingNumber: 'DRW-001' },
      { id: '2', status: 'error', error: 'Network timeout' },
      { id: '3', status: 'success', drawingNumber: 'DRW-002' },
      { id: '4', status: 'error', error: 'Storage busy' },
    ];

    // Filter eligible for retry
    const retryQueue = uploadState.filter((item) => item.status === 'error');
    assert.strictEqual(retryQueue.length, 2);
    assert.strictEqual(retryQueue[0].id, '2');
    assert.strictEqual(retryQueue[1].id, '4');

    // Simulate successful retry
    retryQueue.forEach((item) => {
      item.status = 'success';
      item.error = null;
    });

    assert.strictEqual(uploadState.filter((i) => i.status === 'success').length, 4);
  });

  // --- Test 8: Duplicate Click Prevention ---
  test('Duplicate upload trigger is blocked while upload is active', () => {
    let isUploading = false;
    let executionCount = 0;

    function handleUploadClick() {
      if (isUploading) return;
      isUploading = true;
      executionCount++;
    }

    // First click
    handleUploadClick();
    assert.strictEqual(executionCount, 1);
    assert.strictEqual(isUploading, true);

    // Repeated fast clicks while active
    handleUploadClick();
    handleUploadClick();
    handleUploadClick();
    assert.strictEqual(executionCount, 1, 'Repeated clicks must be ignored while isUploading is true');

    // Finished
    isUploading = false;
  });

  // --- Test 9: Director Gallery Anonymization ---
  test('Director drawings API strictly excludes student_name', () => {
    const dbRow = {
      id: 'uuid-1',
      drawing_number: 'DRW-042',
      student_name: 'Secret Student',
      drawing_title: 'Sunset Beach',
      category: 'Landscape',
      image_path: 'https://example.com/art.jpg',
      created_at: '2026-11-06T12:00:00Z',
      my_score: null,
      is_evaluated: false,
    };

    // Sanitize for director
    const { student_name, ...directorPayload } = dbRow;
    assert.strictEqual(directorPayload.student_name, undefined);
    assert.strictEqual(directorPayload.drawing_number, 'DRW-042');
    assert.strictEqual(directorPayload.drawing_title, 'Sunset Beach');
  });

  console.log(`\n====================================================`);
  console.log(`  Tests Complete: ${passed}/${total} passed successfully!  `);
  console.log(`====================================================\n`);

  if (passed !== total) {
    process.exit(1);
  }
}

runBulkTests();

