import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

import { generateJoinPassword, hashJoinPassword } from "@/lib/password";
import { getPrismaClient } from "@/lib/prisma";

function getPrisma() {
  return getPrismaClient();
}

type RouteParams = {
  params: Promise<{ studioId: string }>;
};

export async function POST(_: NextRequest, { params }: RouteParams) {
  const { studioId } = await params;
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const prisma = getPrisma();
  const membership = await prisma.studioMember.findFirst({
    where: {
      studioId,
      user: { userId },
      role: { equals: "admin", mode: "insensitive" },
      status: "active",
    },
  });

  if (!membership) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const studio = await prisma.studio.findUnique({ where: { id: studioId } });

  if (!studio) {
    return NextResponse.json({ error: "Studio not found." }, { status: 404 });
  }

  const password = generateJoinPassword();
  const { hash, salt, updatedAt } = hashJoinPassword(password);

  const updatedStudio = await prisma.studio.update({
    where: { id: studioId },
    data: {
      joinPasswordHash: hash,
      joinPasswordSalt: salt,
      joinPasswordUpdatedAt: updatedAt,
    },
    select: { id: true, name: true, joinPasswordUpdatedAt: true },
  });

  return NextResponse.json({
    studio: updatedStudio,
    joinPassword: password,
  });
}
