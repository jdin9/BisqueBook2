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

const isValidPublishableKey = (key?: string) => {
  if (!key) return false;

  const trimmed = key.trim();
  const looksLikeKey = /^pk_(test|live)_[A-Za-z0-9]{20,}$/.test(trimmed);
  const isPlaceholder = trimmed.toLowerCase().includes("your_publishable_key");

  return looksLikeKey && !isPlaceholder;
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (!isValidPublishableKey(publishableKey)) {
    const hasKey = Boolean(publishableKey?.trim());

    return (
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#fdfaff] text-foreground`}
        >
          <PastelBackdrop />
          <div className="relative z-10 mx-auto flex min-h-screen max-w-4xl flex-col items-start gap-6 px-6 py-12">
            <div className="glass-panel w-full px-6 py-5 text-sm text-amber-900">
              <div className="flex items-start gap-3">
                <div className="mt-1 h-10 w-10 rounded-2xl bg-amber-200/80" />
                <div className="space-y-2">
                  <p className="text-base font-semibold">
                    {hasKey ? "Clerk key looks invalid" : "Clerk configuration required"}
                  </p>
                  <p className="text-muted-foreground">
                    {hasKey
                      ? "The NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY you provided doesn’t match Clerk’s expected format."
                      : "Add your Clerk keys to .env.local to enable authentication and proxy protection:"}
                  </p>
                  <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
                    <li>Set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY from your Clerk project.</li>
                    <li>Restart the dev server so Clerk loads the new credentials.</li>
                    <li>Optional: add DATABASE_URL/DIRECT_URL and Supabase keys so dashboard health checks pass.</li>
                  </ul>
                </div>
              </div>
            </div>
            <p className="glass-panel w-full px-6 py-4 text-base text-muted-foreground">
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
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#fdfaff] text-foreground`}>
          <PastelBackdrop />
          <div className="relative z-10 flex min-h-screen flex-col px-4 pb-8 pt-4 sm:px-6 sm:pb-12">
            <SiteHeader />
            <main className="glass-panel mx-auto mt-6 w-full max-w-6xl flex-1 px-4 py-8 sm:px-8 sm:py-10">
              {children}
            </main>
            <footer className="mx-auto mt-6 w-full max-w-6xl">
              <div className="glass-panel px-4 py-5 text-sm text-muted-foreground sm:flex sm:items-center sm:justify-between sm:px-6">
                <p>Clerk-protected Next.js App Router template.</p>
                <p className="mt-2 sm:mt-0">Deploy-ready for Vercel with Prisma and Supabase storage.</p>
              </div>
            </footer>
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}

function PastelBackdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#f9f5ff] via-white to-[#f5f0ff]" />
      <div className="absolute left-[-10%] top-[-16%] h-80 w-80 rounded-full bg-[#e0d1ff] opacity-60 blur-3xl" />
      <div className="absolute right-[-6%] top-[-14%] h-96 w-96 rounded-full bg-[#d6c2ff] opacity-70 blur-3xl" />
      <div className="absolute left-[12%] bottom-[-18%] h-[26rem] w-[26rem] rounded-full bg-[#f0e6ff] opacity-70 blur-3xl" />
      <div className="absolute right-[18%] bottom-[-12%] h-80 w-80 rounded-full bg-[#e4cfff] opacity-50 blur-3xl" />
      <div className="absolute inset-x-8 top-10 h-40 rounded-[999px] bg-gradient-to-r from-[#f0e7ff]/80 via-[#f7f1ff]/90 to-[#e6d9ff]/80 blur-2xl" />
    </div>
  );
}
