import { Prisma, type PrismaClient, StudioMembershipStatus, type StudioMembership } from "@prisma/client";

import { getPrismaClient } from "@/lib/prisma";
import { getJoinLimitStatus } from "@/lib/studio/memberships";
import { StudioMembershipRole } from "@/lib/types";

export const INVALID_INVITE_MESSAGE =
  "This invite link is invalid or has expired. Ask the studio owner for a new invite.";

type JoinLimitStatus = Awaited<ReturnType<typeof getJoinLimitStatus>>;

type JoinRequestSuccess = {
  success: true;
  membership: StudioMembership;
  studioId: string;
};

type JoinRequestError = {
  success: false;
  status: number;
  error: string;
  joinLimit?: JoinLimitStatus;
  membershipStatus?: StudioMembershipStatus;
  studioId?: string;
};

export type JoinRequestResult = JoinRequestSuccess | JoinRequestError;

type JoinRequestOptions = {
  inviteToken: string;
  profileId: string;
  studioId?: string;
  prisma?: PrismaClient;
};

export async function submitJoinRequest({
  inviteToken,
  profileId,
  studioId,
  prisma = getPrismaClient(),
}: JoinRequestOptions): Promise<JoinRequestResult> {
  const studio = studioId
    ? await prisma.studio.findUnique({ where: { id: studioId } })
    : await prisma.studio.findUnique({ where: { inviteToken } });

  if (!studio || studio.inviteToken !== inviteToken) {
    return { success: false, status: 400, error: INVALID_INVITE_MESSAGE };
  }

  const limitStatus = await getJoinLimitStatus(prisma, studio.id);

  if (limitStatus.limitReached) {
    return {
      success: false,
      status: 429,
      error: "This studio has reached its daily join request limit. Try again in 24 hours.",
      joinLimit: limitStatus,
      studioId: studio.id,
    };
  }

  const existingMembership = await prisma.studioMembership.findUnique({ where: { userId: profileId } });

  if (existingMembership) {
    if (existingMembership.studioId === studio.id) {
      const statusMessages: Record<StudioMembershipStatus, string> = {
        [StudioMembershipStatus.Pending]: "You already have a pending request for this studio.",
        [StudioMembershipStatus.Approved]: "You are already a member of this studio.",
        [StudioMembershipStatus.Denied]:
          "Your previous request was denied. Ask the studio to generate a new invite link to try again.",
        [StudioMembershipStatus.Removed]:
          "Your membership was removed. Ask the studio to generate a new invite link to request access again.",
      };

      return {
        success: false,
        status: 409,
        error: statusMessages[existingMembership.status],
        membershipStatus: existingMembership.status,
        studioId: studio.id,
      };
    }

    return {
      success: false,
      status: 409,
      error: "You already belong to a different studio. Leave it before requesting a new one.",
      membershipStatus: existingMembership.status,
      studioId: existingMembership.studioId,
    };
  }

  try {
    const membership = await prisma.studioMembership.create({
      data: {
        studioId: studio.id,
        userId: profileId,
        role: StudioMembershipRole.Member,
        status: StudioMembershipStatus.Pending,
      },
    });

    return { success: true, membership, studioId: studio.id };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return {
        success: false,
        status: 409,
        error: "You already have a membership for this studio.",
        membershipStatus: StudioMembershipStatus.Pending,
        studioId: studio.id,
      };
    }

    throw error;
  }
}
