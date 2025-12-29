import crypto from "crypto";
import { Prisma, StudioMembershipStatus } from "@prisma/client";

import { getPrismaClient } from "@/lib/prisma";

const DEFAULT_INVITE_PATH = "/invite";
const UNIQUE_TOKEN_ATTEMPTS = 3;

export function generateInviteToken(byteLength = 48) {
  return crypto.randomBytes(byteLength).toString("hex");
}

export function buildStudioInviteUrl(baseUrl: string, inviteToken: string, path = DEFAULT_INVITE_PATH) {
  if (!baseUrl) {
    throw new Error("A base URL is required to build the studio invite link.");
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(normalizedPath, baseUrl);
  url.searchParams.set("inviteToken", inviteToken);

  return url.toString();
}

function isUniqueConstraintError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

type InviteDetails = {
  inviteToken: string;
  inviteUrl: string;
  inviteTokenCreatedAt: Date;
};

export async function getStudioInviteDetails(studioId: string, baseUrl: string, invitePath = DEFAULT_INVITE_PATH): Promise<InviteDetails> {
  const prisma = getPrismaClient();
  const studio = await prisma.studio.findUnique({ where: { id: studioId } });

  if (!studio) {
    throw new Error("Studio not found.");
  }

  return {
    inviteToken: studio.inviteToken,
    inviteUrl: buildStudioInviteUrl(baseUrl, studio.inviteToken, invitePath),
    inviteTokenCreatedAt: studio.inviteTokenCreatedAt,
  };
}

type RotateStudioInviteOptions = {
  studioId: string;
  baseUrl: string;
  invitePath?: string;
};

export async function rotateStudioInvite({
  studioId,
  baseUrl,
  invitePath = DEFAULT_INVITE_PATH,
}: RotateStudioInviteOptions): Promise<InviteDetails> {
  const prisma = getPrismaClient();

  for (let attempt = 0; attempt < UNIQUE_TOKEN_ATTEMPTS; attempt += 1) {
    const inviteToken = generateInviteToken();
    const inviteTokenCreatedAt = new Date();

    try {
      const [updatedStudio] = await prisma.$transaction([
        prisma.studio.update({
          where: { id: studioId },
          data: { inviteToken, inviteTokenCreatedAt },
        }),
        prisma.studioMembership.deleteMany({
          where: {
            studioId,
            status: {
              in: [StudioMembershipStatus.Denied, StudioMembershipStatus.Removed],
            },
          },
        }),
      ]);

      return {
        inviteToken: updatedStudio.inviteToken,
        inviteUrl: buildStudioInviteUrl(baseUrl, updatedStudio.inviteToken, invitePath),
        inviteTokenCreatedAt: updatedStudio.inviteTokenCreatedAt,
      };
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        continue;
      }

      throw error;
    }
  }

  throw new Error("Unable to generate a unique invite token after several attempts.");
}
