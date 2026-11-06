import { neon, NeonQueryFunction } from '@neondatabase/serverless';

let sqlClient: NeonQueryFunction<false, false> | null = null;

export function isDatabaseConfigured(): boolean {
  const url = process.env.DATABASE_URL;
  if (!url) return false;
  if (url.includes('ep-example-123456') || url.includes('username:password')) {
    return false;
  }
  return true;
}

export function getDb(): NeonQueryFunction<false, false> {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl || !isDatabaseConfigured()) {
    throw new Error(
      'DATABASE_URL is not configured with a valid Neon connection string. Set DATABASE_URL in .env.local'
    );
  }

  if (!sqlClient) {
    sqlClient = neon(databaseUrl);
  }

  return sqlClient;
}

/**
 * Utility to run parameterized queries safely using $1, $2 placeholders
 */
export async function query<T = any>(
  queryText: string,
  params: any[] = []
): Promise<T[]> {
  const db = getDb();
  if (typeof (db as any).query === 'function') {
    const result = await (db as any).query(queryText, params);
    return result as T[];
  }
  // Fallback
  const result = await (db as any)(queryText, params);
  return result as T[];
}
