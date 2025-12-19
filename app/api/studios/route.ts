import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { hashJoinPassword } from "@/lib/password";
import { getPrismaClient } from "@/lib/prisma";

const prisma = getPrismaClient();

async function ensureUserProfile(userId: string) {
  const existingProfile = await prisma.userProfile.findUnique({
    where: { userId },
  });

  if (existingProfile) return existingProfile;

  const user = await currentUser();
  const email =
    user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress || undefined;
  const name = user?.fullName || user?.username || email;

  return prisma.userProfile.create({
    data: {
      userId,
      email,
      name,
    },
  });
}

export async function GET() {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const studios = await prisma.studio.findMany({
    include: {
      owner: true,
      members: {
        include: { user: true },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ studios });
}

export async function POST(request: Request) {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const joinPassword = typeof body.joinPassword === "string" ? body.joinPassword.trim() : "";

  if (!name) {
    return NextResponse.json({ error: "Studio name is required." }, { status: 400 });
  }

  if (!joinPassword || joinPassword.length < 8) {
    return NextResponse.json({ error: "Join password must be at least 8 characters." }, { status: 400 });
  }

  try {
    const profile = await ensureUserProfile(userId);
    const { hash, salt, updatedAt } = hashJoinPassword(joinPassword);

    const studio = await prisma.studio.create({
      data: {
        name,
        ownerId: profile.id,
        joinPasswordHash: hash,
        joinPasswordSalt: salt,
        joinPasswordUpdatedAt: updatedAt,
        members: {
          create: {
            userId: profile.id,
            role: "admin",
            status: "active",
          },
        },
      },
      include: {
        owner: true,
        members: {
          include: { user: true },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    return NextResponse.json({ studio, joinPassword });
  } catch (error) {
    console.error("Failed to create studio", error);
    return NextResponse.json({ error: "Failed to create studio." }, { status: 500 });
  }
}
