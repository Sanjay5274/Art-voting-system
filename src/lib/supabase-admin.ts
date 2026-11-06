import { createClient, SupabaseClient } from '@supabase/supabase-js';

let adminClient: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Missing Supabase admin credentials. Please define NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.'
    );
  }

  if (!adminClient) {
    adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return adminClient;
}

/**
 * Ensures the 'drawings' storage bucket exists in Supabase Storage.
 */
export async function ensureDrawingsBucket(): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { data: buckets, error } = await supabase.storage.listBuckets();
  if (error) {
    console.error('Error listing storage buckets:', error);
    return;
  }

  const bucketExists = buckets?.some((b) => b.name === 'drawings');
  if (!bucketExists) {
    const { error: createError } = await supabase.storage.createBucket('drawings', {
      public: true,
      fileSizeLimit: 10485760, // 10MB limit
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'],
    });
    if (createError) {
      console.error('Error creating drawings bucket:', createError);
    }
  }
}

