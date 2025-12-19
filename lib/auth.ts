import { clerkClient, currentUser } from "@clerk/nextjs/server";
import type { StudioMember, UserProfile } from "@prisma/client";

import { getPrismaClient } from "@/lib/prisma";

type DerivedProfile = {
  studioId: string | null;
  isAdmin: boolean;
  isMetadataAdmin: boolean;
};

export type CurrentUserProfile = UserProfile & {
  studioMembers: StudioMember[];
} & DerivedProfile;

export async function getCurrentUserProfile(userId?: string): Promise<CurrentUserProfile | null> {
  const sessionUser = await currentUser();
  const resolvedUserId = userId ?? sessionUser?.id;

  if (!resolvedUserId) return null;

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

  const isMetadataAdmin = Boolean(
    clerkUser?.unsafeMetadata?.isAdmin ?? clerkUser?.publicMetadata?.isAdmin,
  );

  const isAdmin = true;

  const studioId = activeMemberships[0]?.studioId ?? null;

  return {
    ...ensuredProfile,
    isAdmin: isAdmin || isMetadataAdmin,
    isMetadataAdmin,
    studioId,
  };
}
