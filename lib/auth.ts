import { currentUser } from "@clerk/nextjs/server";
import type { StudioMember, UserProfile } from "@prisma/client";

import { getPrismaClient } from "@/lib/prisma";

type DerivedProfile = {
  studioId: string | null;
  isAdmin: boolean;
};

export type CurrentUserProfile = UserProfile & {
  studioMembers: StudioMember[];
} & DerivedProfile;

export async function getCurrentUserProfile(userId?: string): Promise<CurrentUserProfile | null> {
  const user = userId ? { id: userId } : await currentUser();
  const resolvedUserId = userId ?? user?.id;

  if (!resolvedUserId) return null;

  const prisma = getPrismaClient();
  const profile = await prisma.userProfile.findUnique({
    where: { userId: resolvedUserId },
    include: { studioMembers: true },
  });

  if (!profile) return null;

  const isAdmin = profile.studioMembers.some(
    (member) => member.role?.toLowerCase() === "admin",
  );
  const studioId = profile.studioMembers[0]?.studioId ?? null;

  return { ...profile, isAdmin, studioId };
}
