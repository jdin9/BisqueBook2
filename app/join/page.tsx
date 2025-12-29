import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, SignUpButton } from "@clerk/nextjs";
import { ArrowRight, ShieldCheck, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function JoinPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <p className="text-sm font-semibold text-primary">Join your studio</p>
        <h1 className="text-3xl font-semibold leading-tight">Sign in and request access</h1>
        <p className="text-muted-foreground">
          Studio tools stay private. Sign in to continue, then use your invite link to request membership. Once approved,
          you&apos;ll unlock the pottery log and admin workspace.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-primary/20 bg-white/70 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" /> Secure access
            </CardTitle>
            <CardDescription>Sign in or create an account to start the join flow.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row">
            <SignedOut>
              <SignInButton mode="modal">
                <Button size="lg" className="w-full sm:w-auto">
                  Sign in <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Create account
                </Button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <Button variant="secondary" size="lg" className="w-full sm:w-auto" asChild>
                <Link href="/">Back to home</Link>
              </Button>
            </SignedIn>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" /> Waiting on approval?
            </CardTitle>
            <CardDescription>Ask your studio admin to share an invite link or approve your request.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Invite links start the membership request and must be approved by an admin before you can proceed.</p>
            <p className="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-3 text-primary">
              If you already signed in with an invite link, sit tight — you&apos;ll get access when your membership is
              marked as Approved.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
