import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { StudioMembershipRole, StudioMembershipStatus } from "@prisma/client";

import { getPrismaClient, isDatabaseConfigured } from "@/lib/prisma";
import { authorizeSiteAdmin } from "@/lib/studio/access";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "Database is not configured. Set DATABASE_URL to continue." },
      { status: 503 },
    );
  }

  const { userId } = await auth();
  const authorization = await authorizeSiteAdmin({ userId: userId ?? undefined });

  if ("error" in authorization) {
    return NextResponse.json({ error: authorization.error.message }, { status: authorization.error.status });
  }

  let membershipId: string | undefined;
  let role: StudioMembershipRole | undefined;

  try {
    const body = await request.json();
    membershipId = typeof body.membershipId === "string" ? body.membershipId : undefined;
    role = [StudioMembershipRole.Admin, StudioMembershipRole.Member].includes(body.role)
      ? (body.role as StudioMembershipRole)
      : undefined;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!membershipId || !role) {
    return NextResponse.json({ error: "membershipId and role are required." }, { status: 400 });
  }

  const prisma = getPrismaClient();
  const membership = await prisma.studioMembership.findUnique({
    where: { id: membershipId },
    include: { user: true },
  });

  if (!membership) {
    return NextResponse.json({ error: "Membership not found." }, { status: 404 });
  }

  if (membership.status !== StudioMembershipStatus.Approved) {
    return NextResponse.json(
      { error: "Only approved members can be promoted or demoted." },
      { status: 400 },
    );
  }

  if (membership.role === role) {
    return NextResponse.json(
      { membershipId: membership.id, role: membership.role, message: "No role change needed." },
      { status: 200 },
    );
  }

  if (role === StudioMembershipRole.Admin) {
    await prisma.$transaction(async (tx) => {
      const currentAdmin = await tx.studioMembership.findFirst({
        where: {
          studioId: membership.studioId,
          role: StudioMembershipRole.Admin,
          NOT: { id: membership.id },
        },
      });

      if (currentAdmin) {
        await tx.studioMembership.update({
          where: { id: currentAdmin.id },
          data: { role: StudioMembershipRole.Member },
        });
      }

      await tx.studioMembership.update({
        where: { id: membership.id },
        data: { role: StudioMembershipRole.Admin },
      });
    });
  } else {
    await prisma.studioMembership.update({
      where: { id: membership.id },
      data: { role: StudioMembershipRole.Member },
    });
  }

  return NextResponse.json(
    {
      membershipId: membership.id,
      role,
      message: role === StudioMembershipRole.Admin ? "Promoted to admin." : "Demoted to member.",
    },
    { status: 200 },
  );
}
