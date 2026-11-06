import { query } from './neon';

export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
];

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

/**
 * Validates file metadata (name, type, size) before creating presigned URLs
 */
export function validateImageMetadata(
  fileName: string,
  fileType: string,
  fileSize: number
): { valid: boolean; error?: string } {
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

/**
 * Validates an uploaded image file (File or Blob)
 */
export function validateImageFile(file: File | Blob, fileName?: string): { valid: boolean; error?: string } {
  return validateImageMetadata(
    fileName || (file as any).name || '',
    file.type,
    file.size
  );
}

/**
 * Validates score from 1 to 10
 */
export function validateScore(score: unknown): { valid: boolean; score?: number; error?: string } {
  const numericScore = Number(score);
  if (!Number.isInteger(numericScore) || numericScore < 1 || numericScore > 10) {
    return {
      valid: false,
      error: 'Score must be an integer between 1 and 10.',
    };
  }
  return { valid: true, score: numericScore };
}

/**
 * Generates the next sequential human-readable drawing number atomically (e.g. DRW-001)
 * Concurrency-safe for high-volume bulk uploads.
 */
export async function getNextDrawingNumber(): Promise<string> {
  try {
    const res = await query<{ next_num: string }>(
      `SELECT nextval('drawing_number_seq')::text as next_num`
    );
    if (res && res[0] && res[0].next_num) {
      return `DRW-${String(res[0].next_num).padStart(3, '0')}`;
    }
  } catch (seqError) {
    // If sequence does not exist yet in the database, initialize it
    try {
      await query(`
        CREATE SEQUENCE IF NOT EXISTS drawing_number_seq;
        SELECT setval(
          'drawing_number_seq', 
          GREATEST(COALESCE((SELECT MAX(NULLIF(regexp_replace(drawing_number, '[^0-9]', '', 'g'), '')::INTEGER) FROM drawings), 0), 0) + 1, 
          false
        );
      `);
      const res = await query<{ next_num: string }>(
        `SELECT nextval('drawing_number_seq')::text as next_num`
      );
      if (res && res[0] && res[0].next_num) {
        return `DRW-${String(res[0].next_num).padStart(3, '0')}`;
      }
    } catch (createError) {
      console.warn('Sequence initialization warning, using table scan fallback:', createError);
    }
  }

  // Fallback to table scan if sequence cannot be used
  const rows = await query<{ drawing_number: string }>(
    `SELECT drawing_number FROM drawings ORDER BY created_at DESC LIMIT 100`
  );

  let highestNum = 0;
  for (const row of rows) {
    const match = row.drawing_number.match(/DRW-(\d+)/i);
    if (match && match[1]) {
      const num = parseInt(match[1], 10);
      if (num > highestNum) {
        highestNum = num;
      }
    }
  }

  const nextNum = highestNum + 1;
  return `DRW-${String(nextNum).padStart(3, '0')}`;
}
