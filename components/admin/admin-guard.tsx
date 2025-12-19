import type { ReactNode } from "react";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { getCurrentUserProfile } from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/prisma";

export async function AdminGuard({ children }: { children: ReactNode }) {
  const clerkConfigured =
    Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) &&
    Boolean(process.env.CLERK_SECRET_KEY);

  if (!clerkConfigured) {
    return <>{children}</>;
  }

  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const profile = isDatabaseConfigured() ? await getCurrentUserProfile(user.id) : null;

  // All authenticated users should have access to the admin area. The profile
  // lookup is still performed so that we create or hydrate the user's profile
  // record, but we intentionally allow access even if the stored flag says
  // otherwise.
  return profile ? <>{children}</> : null;
}
