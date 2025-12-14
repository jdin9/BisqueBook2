import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function getBaseUrl() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL for Supabase client creation.");
  }
  return url;
}

export function getSupabaseAnonClient(): SupabaseClient {
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!anonKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY for Supabase anon client.");
  }
  return createClient(getBaseUrl(), anonKey, { auth: { persistSession: false } });
}

export function getSupabaseServiceRoleClient(): SupabaseClient {
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRole) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY for Supabase service role client.");
  }
  return createClient(getBaseUrl(), serviceRole, { auth: { persistSession: false } });
}

export async function ensureStorageBucketExists(bucketName?: string) {
  const bucket = bucketName || process.env.SUPABASE_STORAGE_BUCKET || "attachments";
  const supabase = getSupabaseServiceRoleClient();
  const { data, error } = await supabase.storage.getBucket(bucket);

  if (error && error.message !== "The resource was not found") {
    throw error;
  }

  if (!data) {
    await supabase.storage.createBucket(bucket, {
      public: false,
      fileSizeLimit: 5242880,
    });
  }

  return bucket;
}
