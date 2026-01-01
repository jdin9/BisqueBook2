import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { resolveAdminStudio } from "@/lib/studio/admin";
import { getStudioInviteDetails, rotateStudioInvite } from "@/lib/studio/invites";

export const runtime = "nodejs";

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
