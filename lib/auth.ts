import { clerkClient, currentUser } from "@clerk/nextjs/server";
import type { StudioMember, UserProfile } from "@prisma/client";

import { getPrismaClient, isDatabaseConfigured } from "@/lib/prisma";

type DerivedProfile = {
  studioId: string | null;
};

export type CurrentUserProfile = UserProfile & {
  studioMembers: StudioMember[];
} & DerivedProfile;

export async function getCurrentUserProfile(userId?: string): Promise<CurrentUserProfile | null> {
  const sessionUser = await currentUser();
  const resolvedUserId = userId ?? sessionUser?.id;

  if (!resolvedUserId) return null;
  if (!isDatabaseConfigured()) return null;

  const clerk = await clerkClient();
  const clerkUser =
    sessionUser ||
    (await clerk.users
      .getUser(resolvedUserId)
      .catch(() => null));

  const prisma = getPrismaClient();
  const profile = await prisma.userProfile.findUnique({
    where: { userId: resolvedUserId },
    include: { studioMembers: true },
  });

  const ensuredProfile =
    profile ||
    (clerkUser
      ? await prisma.userProfile.create({
          data: {
            userId: resolvedUserId,
            email: clerkUser.primaryEmailAddress?.emailAddress ?? null,
            name:
              clerkUser.fullName ||
              [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
              null,
          },
          include: { studioMembers: true },
        })
      : null);

  if (!ensuredProfile) return null;

  const activeMemberships = ensuredProfile.studioMembers.filter(
    (member) => member.status === "active",
  );

  const studioId = activeMemberships[0]?.studioId ?? null;

  return {
    ...ensuredProfile,
    studioId,
  };
}
