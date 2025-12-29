import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import type { Studio } from "@prisma/client";

import { getCurrentUserProfile } from "@/lib/auth";
import { getPrismaClient, isDatabaseConfigured } from "@/lib/prisma";
import { getStudioInviteDetails, rotateStudioInvite } from "@/lib/studio/invites";
import { StudioMembershipRole, StudioMembershipStatus } from "@/lib/types";

export const runtime = "nodejs";

type AdminStudioResult =
  | { studio: Studio }
  | { error: { status: number; message: string } };

async function resolveAdminStudio(userId: string): Promise<AdminStudioResult> {
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
    approvedMembership?.studioId === studio.id &&
    approvedMembership.role === StudioMembershipRole.Admin;

  if (!isOwner && !isAdmin) {
    return { error: { status: 403, message: "Only studio admins can manage invite links." } };
  }

  return { studio };
}

export async function GET(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "You must be signed in to view invite links." }, { status: 401 });
    }

    const resolved = await resolveAdminStudio(userId);

    if ("error" in resolved) {
      return NextResponse.json({ error: resolved.error.message }, { status: resolved.error.status });
    }

    const origin = new URL(request.url).origin;
    const invite = await getStudioInviteDetails(resolved.studio.id, origin);

    return NextResponse.json(
      {
        inviteToken: invite.inviteToken,
        inviteUrl: invite.inviteUrl,
        inviteTokenCreatedAt: invite.inviteTokenCreatedAt.toISOString(),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Failed to load studio invite link", error);
    return NextResponse.json({ error: "Unexpected error loading the studio invite link." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "You must be signed in to rotate invite links." }, { status: 401 });
    }

    const resolved = await resolveAdminStudio(userId);

    if ("error" in resolved) {
      return NextResponse.json({ error: resolved.error.message }, { status: resolved.error.status });
    }

    const origin = new URL(request.url).origin;
    const invite = await rotateStudioInvite({
      studioId: resolved.studio.id,
      baseUrl: origin,
    });

    return NextResponse.json(
      {
        inviteToken: invite.inviteToken,
        inviteUrl: invite.inviteUrl,
        inviteTokenCreatedAt: invite.inviteTokenCreatedAt.toISOString(),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Failed to rotate studio invite link", error);
    return NextResponse.json({ error: "Unexpected error rotating the studio invite link." }, { status: 500 });
  }
}
