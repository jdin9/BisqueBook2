import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function DocsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">Project docs</h1>
      <p className="text-muted-foreground">
        Use this page to capture onboarding notes for teammates. Key areas are linked below.
      </p>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Environment</CardTitle>
            <CardDescription>Variables for local dev and Vercel</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            See `.env.example` for Clerk, Postgres, and Supabase settings. Duplicate to `.env.local`.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Data model</CardTitle>
            <CardDescription>Prisma migrations</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>Schema: `prisma/schema.prisma`.</p>
            <p>SQL migration: `prisma/migrations/20241024000000_init/migration.sql`.</p>
            <p>
              Need more? Run <code>npm run prisma:migrate:create</code> after editing the schema.
            </p>
          </CardContent>
        </Card>
      </div>
      <Link href="/dashboard" className="text-primary hover:underline">
        Continue to the protected dashboard →
      </Link>
    </div>
  );
}
