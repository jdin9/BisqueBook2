"use client";

import { useCallback, useEffect, useState } from "react";
import { StudioMembershipRole, StudioMembershipStatus } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type UserSummary = {
  id: string;
  userId: string;
  name: string | null;
  email: string | null;
};

type StudioMemberSummary = {
  id: string;
  userId: string;
  role: StudioMembershipRole;
  status: StudioMembershipStatus;
  user: UserSummary;
};

type StudioSummary = {
  id: string;
  name: string;
  description: string | null;
  owner: UserSummary;
  memberships: StudioMemberSummary[];
};

type StudiosResponse = {
  studios?: StudioSummary[];
  error?: string;
};

type RoleResponse = {
  membershipId?: string;
  role?: StudioMembershipRole;
  message?: string;
  error?: string;
};

const statusClasses: Record<StudioMembershipStatus, string> = {
  Approved: "bg-green-100 text-green-800 border-green-200",
  Pending: "bg-yellow-50 text-yellow-800 border-yellow-200",
  Denied: "bg-destructive/10 text-destructive border-destructive/30",
  Removed: "bg-muted text-foreground border-muted-foreground/20",
};

export default function SuperAdminPageClient() {
  const [studios, setStudios] = useState<StudioSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadStudios = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/super-admin/studios", { cache: "no-store" });
      const payload = (await response.json()) as StudiosResponse;

      if (!response.ok) {
        throw new Error(payload.error || "Unable to load studios.");
      }

      setStudios(payload.studios || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load studios.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStudios();
  }, [loadStudios]);

  const handleRoleChange = async (membershipId: string, role: StudioMembershipRole) => {
    setActioningId(membershipId);
    setActionMessage(null);
    setError(null);

    try {
      const response = await fetch("/api/super-admin/members/role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ membershipId, role }),
      });
      const payload = (await response.json()) as RoleResponse;

      if (!response.ok) {
        throw new Error(payload.error || "Unable to update role.");
      }

      setActionMessage(payload.message || "Role updated.");
      await loadStudios();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update role.");
    } finally {
      setActioningId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <p className="text-sm font-semibold text-primary">Super Admin</p>
        <h1 className="text-3xl font-semibold leading-tight">Manage studios and admins</h1>
        <p className="text-muted-foreground">
          View every studio, their owners, and membership roles. Promote or demote admins to keep access aligned.
        </p>
      </div>

      {error ? <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4 text-destructive">{error}</div> : null}
      {actionMessage ? <div className="rounded-lg border border-primary/50 bg-primary/5 p-4 text-primary">{actionMessage}</div> : null}

      <Card>
        <CardHeader>
          <CardTitle>Studios</CardTitle>
          <CardDescription>All studios with owners, admins, and members.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading studios…</p>
          ) : studios.length === 0 ? (
            <p className="text-sm text-muted-foreground">No studios found.</p>
          ) : (
            <div className="space-y-6">
              {studios.map((studio) => {
                const admins = studio.memberships.filter((member) => member.role === StudioMembershipRole.Admin);
                const members = studio.memberships.filter((member) => member.role === StudioMembershipRole.Member);

                return (
                  <div key={studio.id} className="rounded-lg border bg-card">
                    <div className="border-b px-4 py-3">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold text-primary">Studio</p>
                          <h2 className="text-xl font-semibold leading-tight">{studio.name}</h2>
                          {studio.description ? (
                            <p className="text-sm text-muted-foreground">{studio.description}</p>
                          ) : null}
                        </div>
                        <div className="rounded-md border bg-muted px-3 py-2 text-sm">
                          <div className="font-semibold">Owner</div>
                          <div className="text-muted-foreground">
                            {studio.owner.name || "Unknown"}{" "}
                            {studio.owner.email ? <span className="text-xs text-foreground/80">({studio.owner.email})</span> : null}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="divide-y">
                      <div className="px-4 py-3">
                        <div className="flex items-center justify-between">
                          <div className="font-semibold">Admins</div>
                          <div className="text-sm text-muted-foreground">{admins.length} admin(s)</div>
                        </div>
                        <div className="mt-3 space-y-2">
                          {admins.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No admins assigned.</p>
                          ) : (
                            admins.map((member) => (
                              <MemberRow
                                key={member.id}
                                member={member}
                                onRoleChange={handleRoleChange}
                                isActioning={actioningId === member.id}
                              />
                            ))
                          )}
                        </div>
                      </div>

                      <div className="px-4 py-3">
                        <div className="flex items-center justify-between">
                          <div className="font-semibold">Members</div>
                          <div className="text-sm text-muted-foreground">{members.length} member(s)</div>
                        </div>
                        <div className="mt-3 space-y-2">
                          {members.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No members assigned.</p>
                          ) : (
                            members.map((member) => (
                              <MemberRow
                                key={member.id}
                                member={member}
                                onRoleChange={handleRoleChange}
                                isActioning={actioningId === member.id}
                              />
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MemberRow({
  member,
  onRoleChange,
  isActioning,
}: {
  member: StudioMemberSummary;
  onRoleChange: (membershipId: string, role: StudioMembershipRole) => Promise<void>;
  isActioning: boolean;
}) {
  const isAdmin = member.role === StudioMembershipRole.Admin;
  const isApproved = member.status === StudioMembershipStatus.Approved;
  const isDisabled = isActioning || !isApproved;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border px-3 py-2">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-semibold">{member.user.name || "Unknown member"}</span>
          <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${statusClasses[member.status]}`}>
            {member.status}
          </span>
        </div>
        <div className="text-sm text-muted-foreground">
          {member.user.email || "No email"} · Role: {member.role}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {isAdmin ? (
          <Button
            variant="outline"
            size="sm"
            disabled={isDisabled}
            onClick={() => onRoleChange(member.id, StudioMembershipRole.Member)}
          >
            {isActioning ? "Updating..." : "Demote to member"}
          </Button>
        ) : (
          <Button
            size="sm"
            disabled={isDisabled}
            onClick={() => onRoleChange(member.id, StudioMembershipRole.Admin)}
          >
            {isActioning ? "Updating..." : "Promote to admin"}
          </Button>
        )}
        {!isApproved ? <p className="text-xs text-muted-foreground">Approve first to change role.</p> : null}
      </div>
    </div>
  );
}
