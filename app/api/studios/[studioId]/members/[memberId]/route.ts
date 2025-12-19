import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { getCurrentUserProfile } from "@/lib/auth";
import { getPrismaClient } from "@/lib/prisma";

const prisma = getPrismaClient();

type RouteParams = {
  params: { studioId: string; memberId: string };
};

export async function PATCH(request: Request, { params }: RouteParams) {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await getCurrentUserProfile(userId);

  if (!profile?.isAdmin) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const activeMembership = profile.studioMembers.find(
    (membership) =>
      membership.studioId === params.studioId &&
      membership.status === "active" &&
      membership.role?.toLowerCase() === "admin",
  );

  if (!activeMembership) {
    return NextResponse.json({ error: "You cannot manage this studio." }, { status: 403 });
  }

  const body = await request.json();
  const action = typeof body.action === "string" ? body.action : "";

  if (!action || !["approve", "revoke"].includes(action)) {
    return NextResponse.json(
      { error: "Action must be 'approve' or 'revoke'." },
      { status: 400 },
    );
  }

  const existingMember = await prisma.studioMember.findUnique({
    where: { id: params.memberId },
  });

  if (!existingMember || existingMember.studioId !== params.studioId) {
    return NextResponse.json({ error: "Member not found." }, { status: 404 });
  }

  const updatedMember = await prisma.studioMember.update({
    where: { id: params.memberId },
    data: { status: action === "approve" ? "active" : "revoked" },
    include: { user: true },
  });

  return NextResponse.json({ member: updatedMember });
}
