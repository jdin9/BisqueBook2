import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { getCurrentUserProfile } from "@/lib/auth";
import { getPrismaClient, isDatabaseConfigured } from "@/lib/prisma";
import { submitJoinRequest } from "@/lib/studio/join";
import { logJoinRequestResult } from "@/lib/studio/logging";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const { userId, redirectToSignIn } = await auth();

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

  const logContext = {
    flow: "invite" as const,
    userId: profile.userId,
    userEmail: profile.email,
  };

  let inviteToken: string | null = null;

  try {
    const body = await request.json();
    inviteToken = typeof body.inviteToken === "string" ? body.inviteToken.trim() : null;
  } catch {
    inviteToken = null;
  }

  if (!inviteToken) {
    logJoinRequestResult({
      ...logContext,
      result: { success: false, status: 400, error: "An invite token is required to request access to this studio." },
    });
    return NextResponse.json(
      { error: "An invite token is required to request access to this studio." },
      { status: 400 },
    );
  }

  const prisma = getPrismaClient();

  try {
    const result = await submitJoinRequest({
      inviteToken,
      profileId: profile.id,
      prisma,
    });

    if (!result.success) {
      logJoinRequestResult({ ...logContext, result });
      return NextResponse.json(
        { error: result.error, joinLimit: result.joinLimit, status: result.membershipStatus, studioId: result.studioId },
        { status: result.status },
      );
    }

    logJoinRequestResult({ ...logContext, result });
    return NextResponse.json(
      { membershipId: result.membership.id, status: result.membership.status, studioId: result.studioId },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to create studio join request", error);
    logJoinRequestResult({
      ...logContext,
      result: { success: false, status: 500, error: "Unable to submit your join request right now. Please try again." },
    });
    return NextResponse.json(
      { error: "Unable to submit your join request right now. Please try again." },
      { status: 500 },
    );
  }
}
