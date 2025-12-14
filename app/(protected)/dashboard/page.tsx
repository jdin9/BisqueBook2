import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ensureDatabaseConnection } from "@/lib/prisma";
import { ensureStorageBucketExists } from "@/lib/storage";

export default async function DashboardPage() {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const [dbStatus, storageStatus] = await Promise.allSettled([
    ensureDatabaseConnection(),
    ensureStorageBucketExists(),
  ]);

  const databaseHealthy = dbStatus.status === "fulfilled";
  const storageHealthy = storageStatus.status === "fulfilled";

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-muted-foreground">Welcome back</p>
        <h1 className="text-3xl font-semibold">{user.fullName || user.primaryEmailAddress?.emailAddress}</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Authentication</CardTitle>
            <CardDescription>Clerk protects this route via middleware.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Your Clerk user ID: {user.id}</p>
            <p>Default redirect after login is configured in .env.example.</p>
            <Button asChild>
              <a href="https://clerk.com/docs/quickstarts/nextjs">View Clerk docs</a>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Infrastructure checks</CardTitle>
            <CardDescription>One-click confirmation for database and storage connectivity.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p className={databaseHealthy ? "text-emerald-600" : "text-destructive"}>
              Database connection: {databaseHealthy ? "healthy" : "unavailable (check DATABASE_URL)"}
            </p>
            <p className={storageHealthy ? "text-emerald-600" : "text-destructive"}>
              Supabase Storage: {storageHealthy ? "bucket ready" : "missing credentials or bucket"}
            </p>
            <Button variant="outline" asChild>
              <a href="https://supabase.com/docs/guides/storage">Supabase storage guide</a>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Prisma models</CardTitle>
          <CardDescription>Starter UserProfile model is ready for relational data.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>Find the schema in prisma/schema.prisma and migration SQL in prisma/migrations.</p>
          <p>Scripts in package.json help you push, migrate, or generate the Prisma client.</p>
        </CardContent>
      </Card>
    </div>
  );
}
