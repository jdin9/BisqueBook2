import Link from "next/link";
import { SignUpButton, SignedIn, SignedOut } from "@clerk/nextjs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const features = [
  {
    title: "Multi-user auth",
    description: "Clerk middleware protects dashboard routes while keeping marketing pages public.",
  },
  {
    title: "Database ready",
    description: "Prisma schema targets hosted Postgres (Neon/Supabase) with generated migration scripts.",
  },
  {
    title: "Storage configured",
    description: "Supabase Storage clients and bucket bootstrap helpers are ready for uploads.",
  },
];

export default function Home() {
  return (
    <div className="space-y-10">
      <section className="grid gap-8 lg:grid-cols-2 lg:items-center">
        <div className="space-y-6">
          <p className="text-sm font-semibold text-primary">Scaffolded for Vercel</p>
          <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            Next.js App Router starter with Clerk, Prisma, and Supabase storage
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground">
            Ship faster with batteries included: authentication, protected routes, database schema, migration scripts,
            and storage client utilities are wired up for both local development and cloud deployment.
          </p>
          <div className="flex flex-wrap gap-3">
            <SignedOut>
              <SignUpButton mode="modal">
                <Button size="lg">Create an account</Button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <Button asChild size="lg">
                <Link href="/dashboard">Go to dashboard</Link>
              </Button>
            </SignedIn>
            <Button variant="outline" size="lg" asChild>
              <Link href="https://vercel.com/docs" target="_blank" rel="noreferrer">
                Deploy to Vercel
              </Link>
            </Button>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span>TypeScript + Tailwind + shadcn/ui</span>
            <span className="hidden sm:inline">•</span>
            <span>Prisma &amp; Postgres migrations</span>
            <span className="hidden sm:inline">•</span>
            <span>Supabase Storage client helpers</span>
          </div>
        </div>
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle>Deployment checklist</CardTitle>
            <CardDescription>Copy .env.example to .env.local and set secrets in Vercel.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <ul className="space-y-2 list-disc pl-4">
              <li>Configure Clerk publishable + secret keys.</li>
              <li>Point Prisma DATABASE_URL &amp; DIRECT_URL to Neon or Supabase Postgres.</li>
              <li>Create a Supabase Storage bucket and set the bucket name.</li>
              <li>Run `npm run prisma:migrate:create` locally to keep SQL in sync.</li>
            </ul>
            <p className="text-xs text-muted-foreground">Middleware already protects /dashboard and future app routes.</p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        {features.map((feature) => (
          <Card key={feature.title} className="h-full">
            <CardHeader>
              <CardTitle>{feature.title}</CardTitle>
              <CardDescription>{feature.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="ghost" asChild>
                <Link href="/dashboard">View setup</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
