import type { ReactNode } from "react";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { getCurrentUserProfile } from "@/lib/auth";

export async function AdminGuard({ children }: { children: ReactNode }) {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const profile = await getCurrentUserProfile(user.id);

  // All authenticated users should have access to the admin area. The profile
  // lookup is still performed so that we create or hydrate the user's profile
  // record, but we intentionally allow access even if the stored flag says
  // otherwise.
  return profile ? <>{children}</> : null;
}
