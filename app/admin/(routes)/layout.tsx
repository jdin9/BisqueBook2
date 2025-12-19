import type { ReactNode } from "react";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { AccessDenied } from "@/components/access-denied";
import { getCurrentUserProfile } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const profile = await getCurrentUserProfile(user.id);

  if (!profile || (!profile.isAdmin && !profile.studioId)) {
    return <AccessDenied description="Ask an administrator to grant you access." />;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-6 py-10">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Administrative area</p>
        <h1 className="text-3xl font-semibold">Admin</h1>
      </div>
      {children}
    </div>
  );
}
