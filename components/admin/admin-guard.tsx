import type { ReactNode } from "react";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { AccessDenied } from "@/components/access-denied";
import { getCurrentUserProfile } from "@/lib/auth";

export async function AdminGuard({ children }: { children: ReactNode }) {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const profile = await getCurrentUserProfile(user.id);

  if (!profile?.isAdmin) {
    return (
      <AccessDenied
        description="Ask an administrator to grant you access."
        title="Admin access required"
      />
    );
  }

  return <>{children}</>;
}
