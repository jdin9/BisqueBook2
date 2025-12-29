import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { Prisma } from "@prisma/client";

import { getCurrentUserProfile } from "@/lib/auth";
import { getPrismaClient, isDatabaseConfigured } from "@/lib/prisma";
import { StudioMembershipRole, StudioMembershipStatus } from "@/lib/types";
import { getJoinLimitStatus } from "@/lib/studio/memberships";

export const runtime = "nodejs";

export async function POST(request: NextRequest, context: { params: Promise<{ studioId: string }> }) {
  const { userId, redirectToSignIn } = await auth();
  const { studioId } = await context.params;

  if (!userId) {
    return redirectToSignIn({ returnBackUrl: request.url });
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "Database is not configured. Set DATABASE_URL to continue." },
      { status: 503 },
    );
  }

  const profile = await getCurrentUserProfile(userId);

  if (!profile) {
    return NextResponse.json({ error: "User profile not found." }, { status: 404 });
  }

  let inviteToken: string | null = null;

  try {
    const body = await request.json();
    inviteToken = typeof body.inviteToken === "string" ? body.inviteToken.trim() : null;
  } catch {
    inviteToken = null;
  }

  if (!inviteToken) {
    return NextResponse.json(
      { error: "An invite token is required to request access to this studio." },
      { status: 400 },
    );
  }

  const prisma = getPrismaClient();
  const studio = await prisma.studio.findUnique({ where: { id: studioId } });

  if (!studio || studio.inviteToken !== inviteToken) {
    return NextResponse.json(
      { error: "This invite link is invalid or has expired. Ask the studio owner for a new invite." },
      { status: 400 },
    );
  }

  const limitStatus = await getJoinLimitStatus(prisma, studioId);

  if (limitStatus.limitReached) {
    return NextResponse.json(
      {
        error: "This studio has reached its daily join request limit. Try again in 24 hours.",
        joinLimit: limitStatus,
      },
      { status: 429 },
    );
  }

  const existingMembership = await prisma.studioMembership.findUnique({ where: { userId: profile.id } });

  if (existingMembership) {
    if (existingMembership.studioId === studioId) {
      const statusMessages: Record<StudioMembershipStatus, string> = {
        [StudioMembershipStatus.Pending]: "You already have a pending request for this studio.",
        [StudioMembershipStatus.Approved]: "You are already a member of this studio.",
        [StudioMembershipStatus.Denied]:
          "Your previous request was denied. Ask the studio to generate a new invite link to try again.",
        [StudioMembershipStatus.Removed]:
          "Your membership was removed. Ask the studio to generate a new invite link to request access again.",
      };

      return NextResponse.json({ error: statusMessages[existingMembership.status] }, { status: 409 });
    }

    return NextResponse.json(
      { error: "You already belong to a different studio. Leave it before requesting a new one." },
      { status: 409 },
    );
  }

  try {
    const membership = await prisma.studioMembership.create({
      data: {
        studioId,
        userId: profile.id,
        role: StudioMembershipRole.Member,
        status: StudioMembershipStatus.Pending,
      },
    });

    return NextResponse.json(
      { membershipId: membership.id, status: membership.status },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        { error: "You already have a membership for this studio." },
        { status: 409 },
      );
    }

    console.error("Failed to create studio join request", error);
    return NextResponse.json(
      { error: "Unable to submit your join request right now. Please try again." },
      { status: 500 },
    );
  }
}
