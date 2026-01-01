import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { getPrismaClient, isDatabaseConfigured } from "@/lib/prisma";
import { authorizeSiteAdmin } from "@/lib/studio/access";

export const runtime = "nodejs";

export async function GET() {
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

  const prisma = getPrismaClient();
  const studios = await prisma.studio.findMany({
    include: {
      owner: true,
      memberships: { include: { user: true }, orderBy: { createdAt: "desc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  const payload = studios.map((studio) => ({
    id: studio.id,
    name: studio.name,
    description: studio.description,
    owner: {
      id: studio.owner.id,
      userId: studio.owner.userId,
      name: studio.owner.name,
      email: studio.owner.email,
    },
    memberships: studio.memberships.map((membership) => ({
      id: membership.id,
      userId: membership.userId,
      role: membership.role,
      status: membership.status,
      user: {
        id: membership.user.id,
        userId: membership.user.userId,
        name: membership.user.name,
        email: membership.user.email,
      },
    })),
  }));

  return NextResponse.json({ studios: payload }, { status: 200 });
}
