import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  return (
    <header className="glass-panel sticky top-3 z-30 mx-auto w-full max-w-6xl px-4 py-3 sm:px-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#d7c9ff] via-[#d8c4ff] to-[#efddff] text-base font-semibold text-foreground shadow-inner">
            BB
          </div>
          <div className="flex flex-col">
            <Link href="/" className="text-lg font-semibold leading-tight">
              BisqueBook 2
            </Link>
            <span className="text-sm text-muted-foreground">
              Next.js + Clerk + Prisma + Supabase
            </span>
          </div>
        </div>
        <nav className="flex items-center gap-3">
          <Link href="/admin" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Admin
          </Link>
          <Link href="/pottery" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Pottery
          </Link>
          <SignedOut>
            <SignInButton mode="modal">
              <Button variant="default" size="sm" className="shadow-[0_10px_40px_-18px_rgba(83,51,140,0.5)]">
                Sign in
              </Button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <UserButton
              appearance={{
                elements: {
                  userButtonAvatarBox: "h-9 w-9 rounded-xl",
                },
              }}
              userProfileMode="navigation"
              userProfileUrl="/account"
              showName
            />
          </SignedIn>
        </nav>
      </div>
    </header>
  );
}
