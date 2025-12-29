'use client';

import Link from "next/link";
import { useCallback, useEffect, useState, type ElementType } from "react";
import { SignedIn, SignedOut, SignInButton, SignUpButton, useUser } from "@clerk/nextjs";
import { AlertTriangle, CheckCircle2, Clock3, Loader2, ShieldX } from "lucide-react";
import { StudioMembershipStatus } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { INVALID_INVITE_MESSAGE } from "@/lib/studio/join";
import { cn } from "@/lib/utils";

type BannerTone = "info" | "success" | "warning" | "error";

type BannerState = {
  title: string;
  description?: string;
  tone: BannerTone;
};

type JoinResponse = {
  error?: string;
  status?: StudioMembershipStatus;
  membershipId?: string;
  studioId?: string;
  joinLimit?: {
    recentCount: number;
    dailyLimit: number;
    windowMs: number;
    limitReached: boolean;
  };
};

const toneStyles: Record<BannerTone, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  error: "border-rose-200 bg-rose-50 text-rose-800",
  info: "border-primary/20 bg-primary/5 text-primary",
};

const toneIcons: Record<BannerTone, ElementType> = {
  success: CheckCircle2,
  warning: AlertTriangle,
  error: ShieldX,
  info: Clock3,
};

export function InviteJoinCard({ inviteToken }: { inviteToken: string }) {
  const { isSignedIn, isLoaded } = useUser();
  const [banner, setBanner] = useState<BannerState>(() =>
    inviteToken
      ? {
          tone: "info",
          title: "Sign in to submit your request",
          description: "We’ll send your join request automatically after you sign in.",
        }
      : {
          tone: "error",
          title: "Invite link is missing its token",
          description: "Use the full invite URL from your studio admin to continue.",
        },
  );
  const [hasAttempted, setHasAttempted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const redirectUrl = inviteToken ? `/invite?inviteToken=${encodeURIComponent(inviteToken)}` : "/invite";

  useEffect(() => {
    setHasAttempted(false);
  }, [inviteToken]);

  const submitRequest = useCallback(async () => {
    if (!inviteToken || !isSignedIn || isSubmitting) return;

    setHasAttempted(true);
    setIsSubmitting(true);
    setBanner({
      tone: "info",
      title: "Submitting your request...",
      description: "Hang tight while we verify your invite link.",
    });

    try {
      const response = await fetch("/api/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteToken }),
      });
      const payload: JoinResponse = await response.json().catch(() => ({}));

      if (response.ok) {
        setBanner({
          tone: "success",
          title: "Request submitted—waiting for approval.",
          description: "You’ll be able to access the studio after an admin approves your membership.",
        });
        return;
      }

      if (response.status === 429) {
        setBanner({
          tone: "warning",
          title: "Daily request limit reached; try tomorrow.",
          description: "This studio hit today’s join request cap. Try again after the 24-hour window resets.",
        });
        return;
      }

      if (payload.status === StudioMembershipStatus.Denied || payload.status === StudioMembershipStatus.Removed) {
        setBanner({
          tone: "error",
          title: "Access blocked—ask admin for a new invite link.",
          description: payload.error,
        });
        return;
      }

      if (payload.status === StudioMembershipStatus.Pending) {
        setBanner({
          tone: "success",
          title: "Request submitted—waiting for approval.",
          description: payload.error || "Your existing request is still pending with the studio admins.",
        });
        return;
      }

      if (payload.status === StudioMembershipStatus.Approved) {
        setBanner({
          tone: "success",
          title: "You already have access to this studio.",
          description: payload.error || "Head to the dashboard to start working in the studio.",
        });
        return;
      }

      if (payload.error === INVALID_INVITE_MESSAGE) {
        setBanner({
          tone: "error",
          title: "This invite link is invalid or expired.",
          description: "Ask your studio admin for a fresh invite link to continue.",
        });
        return;
      }

      setBanner({
        tone: "error",
        title: payload.error || "Unable to submit your join request right now.",
        description: "Double-check the invite link or try again shortly.",
      });
    } catch (error) {
      console.error("Failed to submit invite join request", error);
      setBanner({
        tone: "error",
        title: "Unable to submit your join request right now.",
        description: "Please try again in a moment.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [inviteToken, isSignedIn, isSubmitting]);

  useEffect(() => {
    if (!inviteToken) {
      setBanner({
        tone: "error",
        title: "Invite link is missing its token",
        description: "Use the full invite URL from your studio admin to continue.",
      });
      return;
    }

    if (!isLoaded) return;

    if (!isSignedIn) {
      setBanner({
        tone: "info",
        title: "Sign in to submit your request",
        description: "We’ll send your join request automatically after you sign in.",
      });
      return;
    }

    if (!hasAttempted) {
      void submitRequest();
    }
  }, [inviteToken, isLoaded, isSignedIn, hasAttempted, submitRequest]);

  const ToneIcon = toneIcons[banner.tone];

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock3 className="h-5 w-5 text-primary" />
          Accept your invite
        </CardTitle>
        <CardDescription>Use your invite link to create a join request for the studio.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className={cn("flex items-start gap-3 rounded-lg border px-3 py-3", toneStyles[banner.tone])}>
          <div className="mt-0.5">
            {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <ToneIcon className="h-5 w-5" />}
          </div>
          <div className="space-y-1">
            <p className="font-medium leading-tight">{banner.title}</p>
            {banner.description ? <p className="text-sm leading-relaxed opacity-90">{banner.description}</p> : null}
          </div>
        </div>

        <SignedOut>
          <div className="flex flex-wrap gap-3">
            <SignInButton mode="modal" redirectUrl={redirectUrl}>
              <Button size="lg" className="gap-2">
                Sign in and continue
              </Button>
            </SignInButton>
            <SignUpButton mode="modal" redirectUrl={redirectUrl}>
              <Button variant="outline" size="lg">
                Create account
              </Button>
            </SignUpButton>
          </div>
        </SignedOut>

        <SignedIn>
          <div className="flex flex-wrap gap-3">
            <Button onClick={submitRequest} disabled={!inviteToken || isSubmitting} size="lg" className="gap-2">
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Resend request"
              )}
            </Button>
            <Button variant="secondary" size="lg" asChild>
              <Link href="/join">See join guidance</Link>
            </Button>
          </div>
        </SignedIn>

        <p className="text-xs text-muted-foreground">
          Join requests stay pending until an admin approves them. If your request is denied or removed, ask the studio
          admin to generate a new invite link before trying again.
        </p>
      </CardContent>
    </Card>
  );
}
