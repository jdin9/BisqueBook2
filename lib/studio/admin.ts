import type { Studio, StudioMembership } from "@prisma/client";

import { getPrismaClient } from "@/lib/prisma";
import { authorizeStudioMember } from "@/lib/studio/access";
import { StudioMembershipRole } from "@/lib/types";

export type AdminStudioResult =
  | { studio: Studio; membership: StudioMembership }
  | { error: { status: number; message: string } };

export async function resolveAdminStudio(userId: string): Promise<AdminStudioResult> {
  const authorization = await authorizeStudioMember({ userId, requiredRole: StudioMembershipRole.Admin });

  if ("error" in authorization) {
    return { error: authorization.error };
  }

  const prisma = getPrismaClient();
  const studio = await prisma.studio.findUnique({ where: { id: authorization.membership.studioId } });

  if (!studio) {
    return { error: { status: 404, message: "No studio found for your account." } };
  }

  return { studio, membership: authorization.membership };
}
