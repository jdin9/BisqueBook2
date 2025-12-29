import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { StudioMembershipStatus } from "@prisma/client";

import { getPrismaClient } from "@/lib/prisma";
import { resolveAdminStudio } from "@/lib/studio/admin";

export const runtime = "nodejs";

type ManageAction = "approve" | "deny" | "remove";

function mapActionToStatus(action: ManageAction): StudioMembershipStatus {
  switch (action) {
    case "approve":
      return StudioMembershipStatus.Approved;
    case "deny":
      return StudioMembershipStatus.Denied;
    case "remove":
      return StudioMembershipStatus.Removed;
    default:
      return StudioMembershipStatus.Pending;
  }
}

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "You must be signed in to view membership requests." }, { status: 401 });
  }

  const resolved = await resolveAdminStudio(userId);

  if ("error" in resolved) {
    return NextResponse.json({ error: resolved.error.message }, { status: resolved.error.status });
  }

  const prisma = getPrismaClient();
  const pending = await prisma.studioMembership.findMany({
    where: { studioId: resolved.studio.id, status: StudioMembershipStatus.Pending },
    include: { user: true },
    orderBy: { createdAt: "desc" },
  });

  const requests = pending.map((membership) => ({
    id: membership.id,
    userId: membership.userId,
    status: membership.status,
    createdAt: membership.createdAt.toISOString(),
    user: {
      name: membership.user.name,
      email: membership.user.email,
    },
  }));

  return NextResponse.json({ requests }, { status: 200 });
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "You must be signed in to manage members." }, { status: 401 });
  }

  const resolved = await resolveAdminStudio(userId);

  if ("error" in resolved) {
    return NextResponse.json({ error: resolved.error.message }, { status: resolved.error.status });
  }

  let membershipId: string | undefined;
  let action: ManageAction | undefined;

  try {
    const body = await request.json();
    membershipId = typeof body.membershipId === "string" ? body.membershipId : undefined;
    action = ["approve", "deny", "remove"].includes(body.action) ? body.action : undefined;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!membershipId || !action) {
    return NextResponse.json({ error: "membershipId and action are required." }, { status: 400 });
  }

  const prisma = getPrismaClient();
  const membership = await prisma.studioMembership.findUnique({
    where: { id: membershipId },
  });

  if (!membership || membership.studioId !== resolved.studio.id) {
    return NextResponse.json({ error: "Membership not found for this studio." }, { status: 404 });
  }

  const status = mapActionToStatus(action);
  const updated = await prisma.studioMembership.update({
    where: { id: membership.id },
    data: { status },
  });

  return NextResponse.json(
    {
      membershipId: updated.id,
      status: updated.status,
      message: action === "approve" ? "Member approved." : `Member ${action}d.`,
    },
    { status: 200 },
  );
}
