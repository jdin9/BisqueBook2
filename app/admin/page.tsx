import { MissingConfiguration } from "@/components/missing-configuration";
import { requireStudioMembership } from "@/lib/studio/access";
import { isDatabaseConfigured } from "@/lib/prisma";
import { getMissingSupabaseEnvKeys } from "@/lib/storage";
import { StudioMembershipRole } from "@/lib/types";

import AdminPageClient from "./admin-page-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminPage() {
  if (!isDatabaseConfigured()) {
    return (
      <MissingConfiguration
        title="Database not configured"
        description="Set DATABASE_URL (and DIRECT_URL if needed) to load the admin portal."
        items={["DATABASE_URL", "DIRECT_URL (optional)"]}
      />
    );
  }

  const missingSupabase = getMissingSupabaseEnvKeys();

  if (missingSupabase.length) {
    return (
      <MissingConfiguration
        title="Supabase credentials missing"
        description="The admin portal needs Supabase to load glazes, clays, and invite data."
        items={missingSupabase}
      />
    );
  }

  await requireStudioMembership({
    returnBackUrl: "/admin",
    requiredRole: StudioMembershipRole.Admin,
    redirectPath: "/join",
  });

  return <AdminPageClient />;
}
