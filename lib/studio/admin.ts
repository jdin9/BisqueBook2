import type { Studio, StudioMembership } from "@prisma/client";

import { getCurrentUserProfile } from "@/lib/auth";
import { getPrismaClient, isDatabaseConfigured } from "@/lib/prisma";
import { StudioMembershipRole, StudioMembershipStatus } from "@/lib/types";

export type AdminStudioResult =
  | { studio: Studio; membership: StudioMembership | null }
  | { error: { status: number; message: string } };

export async function resolveAdminStudio(userId: string): Promise<AdminStudioResult> {
  if (!isDatabaseConfigured()) {
    return { error: { status: 503, message: "Database is not configured. Set DATABASE_URL to continue." } };
  }

  const profile = await getCurrentUserProfile(userId);

  if (!profile) {
    return { error: { status: 404, message: "User profile not found." } };
  }

  const prisma = getPrismaClient();
  const approvedMembership = profile.studioMemberships.find(
    (membership) => membership.status === StudioMembershipStatus.Approved,
  );

  const studio =
    (approvedMembership
      ? await prisma.studio.findUnique({ where: { id: approvedMembership.studioId } })
      : null) ||
    (await prisma.studio.findFirst({ where: { ownerId: profile.id } }));

  if (!studio) {
    return { error: { status: 404, message: "No studio found for your account." } };
  }

  const isOwner = studio.ownerId === profile.id;
  const isAdmin =
    approvedMembership?.studioId === studio.id && approvedMembership.role === StudioMembershipRole.Admin;

  if (!isOwner && !isAdmin) {
    return { error: { status: 403, message: "Only studio admins can manage this studio." } };
  }

  const membership = approvedMembership?.studioId === studio.id ? approvedMembership : null;

  return { studio, membership };
}
