import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getCurrentUserProfile } from "@/lib/auth";
import { AccountAccessToggle } from "@/components/account/account-access-toggle";

export default async function AccountPage() {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const profile = await getCurrentUserProfile(user.id);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">Manage how your profile appears.</p>
        <h1 className="text-3xl font-semibold leading-tight">Account profile</h1>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Connected accounts</CardTitle>
              <CardDescription>
                Review the services linked to your profile and manage access in one place.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-md border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">
                      {user.primaryEmailAddress?.emailAddress ?? "No email on file"}
                    </p>
                  </div>
                  <span className="text-sm text-muted-foreground">Clerk</span>
                </div>
              </div>

              <AccountAccessToggle initialIsAdmin={Boolean(profile?.isAdmin)} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security</CardTitle>
              <CardDescription>
                Update passwords, sessions, and multi-factor authentication from your Clerk dashboard.
              </CardDescription>
            </CardHeader>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
