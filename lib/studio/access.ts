import { redirect } from "next/navigation";
import type { StudioMembership } from "@prisma/client";

import { getCurrentUserProfile, type CurrentUserProfile } from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/prisma";
import { StudioMembershipRole, StudioMembershipStatus } from "@/lib/types";

type AuthorizationSuccess = { profile: CurrentUserProfile; membership: StudioMembership };
type AuthorizationError = { error: { status: number; message: string } };

type AuthorizationOptions = {
  userId?: string;
  requiredRole?: StudioMembershipRole;
};

export async function authorizeStudioMember(options: AuthorizationOptions = {}): Promise<AuthorizationSuccess | AuthorizationError> {
  if (!isDatabaseConfigured()) {
    return { error: { status: 503, message: "Database is not configured. Set DATABASE_URL to continue." } };
  }

  let profile: CurrentUserProfile | null = null;

  try {
    profile = await getCurrentUserProfile(options.userId);
  } catch (error) {
    console.error("Failed to authorize studio membership due to database error", error);
    return {
      error: {
        status: 503,
        message: "Database is unavailable or out of sync. Run migrations and confirm DATABASE_URL is set.",
      },
    };
  }

  if (!profile) {
    return { error: { status: 401, message: "You must be signed in to access this area." } };
  }

  const membership = profile.studioMemberships.find((member) => member.status === StudioMembershipStatus.Approved);

  if (!membership) {
    return { error: { status: 403, message: "An approved studio membership is required to access this area." } };
  }

  if (options.requiredRole && membership.role !== options.requiredRole) {
    return { error: { status: 403, message: "Only studio admins can access this area." } };
  }

  return { profile, membership };
}

type RequireOptions = AuthorizationOptions & {
  returnBackUrl: string;
  redirectPath?: string;
};

export async function requireStudioMembership(options: RequireOptions) {
  const result = await authorizeStudioMember({
    userId: options.userId,
    requiredRole: options.requiredRole,
  });

  if ("error" in result) {
    if (result.error.status === 401) {
      const redirectUrl = new URL("/sign-in", process.env.NEXT_PUBLIC_APP_URL || "http://localhost");
      redirectUrl.searchParams.set("redirect_url", options.returnBackUrl);
      return redirect(redirectUrl.pathname + redirectUrl.search);
    }

    if (result.error.status === 503) {
      const fallback = options.redirectPath || "/docs";
      return redirect(fallback);
    }

    const fallback = options.redirectPath || "/join";
    return redirect(fallback);
  }

  return result;
}
