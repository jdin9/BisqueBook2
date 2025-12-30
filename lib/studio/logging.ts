import { StudioMembershipStatus } from "@prisma/client";

import type { JoinRequestResult } from "@/lib/studio/join";

type JoinRequestLogContext = {
  flow: "invite" | "studio";
  studioId?: string | null;
  userId: string;
  userEmail: string | null;
};

type MembershipDecisionLogContext = {
  action: "approve" | "deny" | "remove";
  actorUserId: string;
  actorEmail: string | null;
  membershipUserId: string;
  membershipEmail: string | null;
  membershipId: string;
  resultingStatus: StudioMembershipStatus;
  studioId: string;
};

export function logJoinRequestResult({
  flow,
  studioId,
  userId,
  userEmail,
  result,
}: JoinRequestLogContext & { result: JoinRequestResult }) {
  const baseContext = {
    flow,
    studioId: result.studioId ?? studioId ?? null,
    userId,
    userEmail,
  };

  if (result.success) {
    console.info("Join request succeeded", {
      ...baseContext,
      membershipId: result.membership.id,
      membershipStatus: result.membership.status,
    });
    return;
  }

  console.warn("Join request failed", {
    ...baseContext,
    status: result.status,
    reason: result.error,
    membershipStatus: result.membershipStatus ?? null,
    joinLimit: result.joinLimit
      ? {
          limitReached: result.joinLimit.limitReached,
          recentCount: result.joinLimit.recentCount,
          dailyLimit: result.joinLimit.dailyLimit,
        }
      : null,
  });
}

export function logMembershipDecision({
  action,
  actorUserId,
  actorEmail,
  membershipUserId,
  membershipEmail,
  membershipId,
  resultingStatus,
  studioId,
}: MembershipDecisionLogContext) {
  console.info("Membership decision recorded", {
    action,
    studioId,
    actorUserId,
    actorEmail,
    membershipUserId,
    membershipEmail,
    membershipId,
    resultingStatus,
  });
}
