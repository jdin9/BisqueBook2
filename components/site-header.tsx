import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-semibold">
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
          <Link href="/docs" className="text-sm text-muted-foreground hover:text-foreground">
            Docs
          </Link>
          <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
            Dashboard
          </Link>
          <SignedOut>
            <SignInButton mode="modal">
              <Button variant="default" size="sm">
                Sign in
              </Button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <UserButton
              appearance={{
                elements: {
                  userButtonAvatarBox: "h-9 w-9",
                },
              }}
              showName
            />
          </SignedIn>
        </nav>
      </div>
    </header>
  );
}
