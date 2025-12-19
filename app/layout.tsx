import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BisqueBook 2 | Next.js starter",
  description: "Next.js App Router starter with Clerk, Prisma, and Supabase storage.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (!publishableKey) {
    return (
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
        >
          <div className="mx-auto flex min-h-screen max-w-4xl flex-col items-start gap-6 px-6 py-12">
            <div className="rounded-lg border border-dashed border-amber-400/80 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <p className="font-semibold">Clerk configuration required</p>
              <p className="mt-2">Add your Clerk keys to .env.local to enable authentication and middleware protection:</p>
              <ul className="mt-3 list-disc space-y-1 pl-5">
                <li>Set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY from your Clerk project.</li>
                <li>Restart the dev server so Clerk loads the new credentials.</li>
                <li>Optional: add DATABASE_URL/DIRECT_URL and Supabase keys so dashboard health checks pass.</li>
              </ul>
            </div>
            <p className="text-base text-muted-foreground">
              Once the keys are set, reload the page to resume the standard layout and Clerk-powered components.
            </p>
          </div>
        </body>
      </html>
    );
  }

  return (
    <ClerkProvider
      publishableKey={publishableKey}
      appearance={{
        layout: {
          unsafe_disableDevelopmentModeWarnings: true,
        },
      }}
    >
      <html lang="en">
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}>
          <div className="flex min-h-screen flex-col">
            <SiteHeader />
            <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">{children}</main>
            <footer className="border-t bg-muted/40 py-6">
              <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                <p>Clerk-protected Next.js App Router template.</p>
                <p>Deploy-ready for Vercel with Prisma and Supabase storage.</p>
              </div>
            </footer>
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}
