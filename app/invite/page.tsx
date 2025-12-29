import { InviteJoinCard } from "@/app/invite/invite-join-card";

type InvitePageProps = {
  searchParams?: {
    inviteToken?: string;
  };
};

export default function InvitePage({ searchParams }: InvitePageProps) {
  const inviteToken = typeof searchParams?.inviteToken === "string" ? searchParams.inviteToken : "";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="space-y-2">
        <p className="text-sm font-semibold text-primary">Studio invite</p>
        <h1 className="text-3xl font-semibold leading-tight">Use your invite link to request access</h1>
        <p className="text-muted-foreground">
          We&apos;ll submit your membership request as soon as you sign in with a valid invite token.
        </p>
      </div>

      <InviteJoinCard inviteToken={inviteToken} />
    </div>
  );
}
