import { requireStudioMembership } from "@/lib/studio/access";
import { StudioMembershipRole } from "@/lib/types";

import AdminPageClient from "./admin-page-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminPage() {
  await requireStudioMembership({
    returnBackUrl: "/admin",
    requiredRole: StudioMembershipRole.Admin,
    redirectPath: "/join",
  });

  return <AdminPageClient />;
}
