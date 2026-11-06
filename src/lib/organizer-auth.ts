import { cookies } from 'next/headers';

/**
 * Validates the organizer secret from request headers or cookies.
 * The secret is stored securely in the ORGANIZER_SECRET environment variable.
 */
export async function verifyOrganizerSecret(request?: Request): Promise<boolean> {
  const expectedSecret = process.env.ORGANIZER_SECRET;
  if (!expectedSecret) {
    console.error('ORGANIZER_SECRET is not configured in environment variables.');
    return false;
  }

  // 1. Check x-organizer-secret header
  if (request) {
    const headerSecret =
      request.headers.get('x-organizer-secret') ||
      request.headers.get('X-Organizer-Secret');
    if (headerSecret && headerSecret === expectedSecret) {
      return true;
    }

    // Check Authorization: Bearer <secret>
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7).trim();
      if (token === expectedSecret) {
        return true;
      }
    }
  }

  // 2. Check organizer_secret cookie
  try {
    const cookieStore = await cookies();
    const cookieSecret = cookieStore.get('organizer_secret')?.value;
    if (cookieSecret && cookieSecret === expectedSecret) {
      return true;
    }
  } catch {
    // Cookie store may not be available in all execution contexts
  }

  return false;
}

/**
 * Enforces organizer authorization or throws a 401 error.
 */
export async function requireOrganizer(request?: Request): Promise<void> {
  const isValid = await verifyOrganizerSecret(request);
  if (!isValid) {
    const error: any = new Error('Unauthorized: Invalid or missing organizer secret.');
    error.statusCode = 401;
    throw error;
  }
}

