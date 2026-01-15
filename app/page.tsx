import Link from "next/link";
import { SignUpButton, SignedIn, SignedOut } from "@clerk/nextjs";
import {
  Sparkles,
  ShieldCheck,
  Database,
  Cloud,
  Rocket,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WelcomeModal } from "@/components/welcome-modal";

const features = [
  {
    title: "Secure by default",
    description: "Clerk proxy protection for sensitive routes, out-of-the-box multi-user auth, and prebuilt flows.",
    icon: ShieldCheck,
  },
  {
    title: "Database ready",
    description: "Prisma schema tuned for hosted Postgres with migration scripts and typed client generation.",
    icon: Database,
  },
  {
    title: "Storage configured",
    description: "Supabase Storage helpers with bucket bootstrap scripts and simple upload/download utilities.",
    icon: Cloud,
  },
  {
    title: "Deploy in minutes",
    description: "Vercel-friendly defaults, environment hints, and docs that keep you shipping fast.",
    icon: Rocket,
  },
];

const pages = [
  {
    title: "Dashboard",
    description: "View protected app routes that are ready for your product dashboards.",
    href: "/dashboard",
  },
  {
    title: "Pottery log",
    description: "Review pottery projects created across every studio in one place.",
    href: "/pottery",
  },
  {
    title: "Documentation",
    description: "Review local setup steps, environment variables, and deployment notes.",
    href: "/docs",
  },
  {
    title: "Sign in",
    description: "Jump to the authentication flow to access protected areas.",
    href: "/sign-in",
  },
];

export default function Home() {
  return (
    <div className="space-y-12">
      <WelcomeModal />
      <section className="relative overflow-hidden rounded-3xl border border-white/60 bg-gradient-to-br from-white/80 via-white/70 to-[#eef2ff]/80 px-8 py-12 shadow-[0_35px_120px_-55px_rgba(99,102,241,0.45)] backdrop-blur sm:px-10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(129,140,248,0.2),transparent_45%),radial-gradient(circle_at_82%_12%,rgba(232,121,249,0.15),transparent_45%),radial-gradient(circle_at_18%_84%,rgba(129,140,248,0.12),transparent_40%)]" />
        <div className="pointer-events-none absolute inset-y-6 right-6 hidden w-[38%] rounded-[36px] border border-white/50 bg-white/30 blur-2xl lg:block" />
        <div className="relative grid gap-8 lg:grid-cols-2 lg:items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-white/70 px-3 py-1 text-sm font-medium text-primary shadow-sm backdrop-blur">
              <Sparkles className="h-4 w-4" />
              Freshened landing experience
            </div>
            <div className="space-y-3">
              <p className="text-sm font-semibold text-primary/90">Scaffolded for Vercel, polished for your team</p>
              <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
                A modern starter kit for Clerk, Prisma, and Supabase storage
              </h1>
              <p className="max-w-2xl text-lg text-muted-foreground">
                Launch faster with refined UI defaults, protected routes, schema-ready migrations, and storage utilities that
                feel production-ready from day one.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <SignedOut>
                <SignUpButton mode="modal">
                  <Button size="lg" className="gap-2 shadow-lg">
                    Get started <ArrowRight className="h-4 w-4" />
                  </Button>
                </SignUpButton>
              </SignedOut>
              <SignedIn>
                <Button asChild size="lg" className="gap-2 shadow-lg">
                  <Link href="/dashboard">
                    Go to dashboard <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </SignedIn>
              <Button variant="outline" size="lg" asChild className="gap-2 border-primary/30 bg-white/50 backdrop-blur">
                <Link href="https://vercel.com/docs" target="_blank" rel="noreferrer">
                  Deploy to Vercel <Rocket className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {["TypeScript + Tailwind + shadcn/ui", "Prisma & Postgres migrations", "Supabase Storage helpers", "Proxy-protected dashboard routes"].map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <div className="grid gap-4 rounded-2xl border border-white/70 bg-white/70 px-4 py-3 text-sm text-muted-foreground shadow-sm backdrop-blur sm:grid-cols-3">
              {[
                { label: "Setup time", value: "15 min" },
                { label: "Starter routes", value: "20+" },
                { label: "Deploy target", value: "Vercel" },
              ].map((stat) => (
                <div key={stat.label} className="space-y-1">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground/80">{stat.label}</p>
                  <p className="text-base font-semibold text-foreground">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>
          <Card className="relative border-white/60 bg-white/80 shadow-xl backdrop-blur">
            <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-[#eef2ff] via-transparent to-[#f5f3ff]" />
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" /> Deployment checklist
              </CardTitle>
              <CardDescription>Copy .env.example to .env.local and set secrets in Vercel.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <ul className="space-y-3">
                <li className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                  <span>Configure Clerk publishable + secret keys.</span>
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                  <span>Point Prisma DATABASE_URL &amp; DIRECT_URL to Neon or Supabase Postgres.</span>
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                  <span>Create a Supabase Storage bucket and set the bucket name.</span>
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                  <span>Run `npm run prisma:migrate:create` locally to keep SQL in sync.</span>
                </li>
              </ul>
              <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 px-3 py-2 text-xs text-primary">
                Proxy already protects /dashboard and future app routes.
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-primary">
          <Sparkles className="h-4 w-4" /> Built-in advantages
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {features.map((feature) => (
            <Card
              key={feature.title}
              className="group relative h-full overflow-hidden border-white/60 bg-white/70 shadow-sm backdrop-blur transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#eef2ff] via-transparent to-[#f5f3ff] opacity-0 transition group-hover:opacity-100" />
              <CardHeader className="space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-[#eef2ff] text-primary shadow-sm">
                  <feature.icon className="h-5 w-5" />
                </div>
                <CardTitle>{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="ghost" asChild className="gap-2">
                  <Link href="/dashboard">
                    View setup <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold leading-tight">Explore every page</h2>
          <p className="text-sm text-muted-foreground">
            Quick links to the core destinations of the app, from the dashboard to the docs.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {pages.map((page) => (
            <Card
              key={page.title}
              className="relative h-full overflow-hidden border-white/60 bg-white/70 shadow-sm backdrop-blur transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(129,140,248,0.18),transparent_40%),radial-gradient(circle_at_82%_10%,rgba(232,121,249,0.14),transparent_40%)]" />
              <CardHeader className="relative">
                <CardTitle>{page.title}</CardTitle>
                <CardDescription>{page.description}</CardDescription>
              </CardHeader>
              <CardContent className="relative">
                <Button variant="secondary" asChild className="gap-2">
                  <Link href={page.href}>
                    Visit {page.title.toLowerCase()} <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
