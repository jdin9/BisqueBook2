import type { PrismaClient, StudioMembershipStatus } from "@prisma/client";

export const DAILY_JOIN_REQUEST_LIMIT = 10;
export const JOIN_LIMIT_WINDOW_MS = 24 * 60 * 60 * 1000;

const COUNTABLE_STATUSES: StudioMembershipStatus[] = [
  "Pending",
  "Denied",
  "Approved",
];

export async function getJoinLimitStatus(prisma: PrismaClient, studioId: string) {
  const windowStart = new Date(Date.now() - JOIN_LIMIT_WINDOW_MS);

  const recentCount = await prisma.studioMembership.count({
    where: {
      studioId,
      status: { in: COUNTABLE_STATUSES },
      createdAt: { gte: windowStart },
    },
  });

  return {
    recentCount,
    dailyLimit: DAILY_JOIN_REQUEST_LIMIT,
    windowMs: JOIN_LIMIT_WINDOW_MS,
    limitReached: recentCount >= DAILY_JOIN_REQUEST_LIMIT,
  };
}
