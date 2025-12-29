import { requireStudioMembership } from "@/lib/studio/access";
import { StudioMembershipRole } from "@/lib/types";

import AdminPageClient from "./admin-page-client";

export default async function AdminPage() {
  await requireStudioMembership({
    returnBackUrl: "/admin",
    requiredRole: StudioMembershipRole.Admin,
    redirectPath: "/join",
  });

  return <AdminPageClient />;
}
