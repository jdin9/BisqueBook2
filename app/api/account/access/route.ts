import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

import { getCurrentUserProfile } from "@/lib/auth";
import { getPrismaClient } from "@/lib/prisma";

const prisma = getPrismaClient();

export async function PATCH(request: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await getCurrentUserProfile(userId);

  if (!profile) {
    return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  }

  const body = await request.json();
  const isAdmin = Boolean(body.isAdmin);

  const activeMembership = profile.studioMembers.find(
    (member) => member.status === "active",
  );

  if (!activeMembership) {
    return NextResponse.json(
      { error: "No active studio membership to update." },
      { status: 400 },
    );
  }

  const updatedMembership = await prisma.studioMember.update({
    where: { id: activeMembership.id },
    data: { role: isAdmin ? "admin" : "member" },
  });

  return NextResponse.json({
    membership: updatedMembership,
    message: isAdmin
      ? "Admin permissions granted for your account."
      : "Admin permissions removed for your account.",
  });
}
