import { MissingConfiguration } from "@/components/missing-configuration";
import { requireSiteAdmin } from "@/lib/studio/access";
import { isDatabaseConfigured } from "@/lib/prisma";

import SuperAdminPageClient from "./super-admin-page-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function SuperAdminPage() {
  if (!isDatabaseConfigured()) {
    return (
      <MissingConfiguration
        title="Database not configured"
        description="Set DATABASE_URL (and DIRECT_URL if needed) to load the super admin portal."
        items={["DATABASE_URL", "DIRECT_URL (optional)"]}
      />
    );
  }

  await requireSiteAdmin({
    returnBackUrl: "/super-admin",
    redirectPath: "/join",
  });

  return <SuperAdminPageClient />;
}
