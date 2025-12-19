import { currentUser } from "@clerk/nextjs/server";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUserProfile } from "@/lib/auth";

export default async function AdminPage() {
  const user = await currentUser();
  const profile = await getCurrentUserProfile(user?.id);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Who can access</CardTitle>
          <CardDescription>
            Access is limited to admins or members of a studio.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>Signed in as: {user?.fullName || user?.primaryEmailAddress?.emailAddress}</p>
          <p>Profile ID: {profile?.id ?? "No profile found"}</p>
          <p>Studio access: {profile?.studioId ?? "No studio assigned"}</p>
          <p>Admin privileges: {profile?.isAdmin ? "Yes" : "No"}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Admin tooling</CardTitle>
          <CardDescription>
            Add your management UI, data tables, and workflows here.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>Use lib/auth.ts to centralize profile lookups and role checks.</p>
          <p>Protect new routes by leveraging the admin layout guard.</p>
        </CardContent>
      </Card>
    </div>
  );
}
