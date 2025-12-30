import { clerkClient, currentUser } from "@clerk/nextjs/server";
import { Prisma, StudioMembershipStatus, type StudioMembership, type UserProfile } from "@prisma/client";

import { getPrismaClient, isDatabaseConfigured } from "@/lib/prisma";

type DerivedProfile = {
  studioId: string | null;
};

export type CurrentUserProfile = UserProfile & {
  studioMemberships: StudioMembership[];
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

  try {
    const prisma = getPrismaClient();
    const profile = await prisma.userProfile.findUnique({
      where: { userId: resolvedUserId },
      include: { studioMemberships: true },
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
            include: { studioMemberships: true },
          })
        : null);

    if (!ensuredProfile) return null;

    const activeMemberships = ensuredProfile.studioMemberships.filter(
      (member) => member.status === StudioMembershipStatus.Approved,
    );

    const studioId = activeMemberships[0]?.studioId ?? null;

    return {
      ...ensuredProfile,
      studioId,
    };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2021" || error.code === "P2022") {
        console.error("Prisma schema mismatch detected. Run migrations to sync the database.", error);
        return null;
      }
    }

    console.error("Unexpected error while loading user profile", error);
    return null;
  }
}
