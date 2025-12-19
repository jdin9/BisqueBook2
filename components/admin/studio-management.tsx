"use client";

import { useMemo, useState, type FormEvent } from "react";
import type { Studio, StudioMember, UserProfile } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { cn } from "@/lib/utils";

type StudioMemberWithUser = StudioMember & { user: UserProfile };
type StudioWithMembers = Studio & { members: StudioMemberWithUser[] };

type MemberAction = "approve" | "revoke";

type StudioManagementProps = {
  initialStudios: StudioWithMembers[];
};

export function StudioManagement({ initialStudios }: StudioManagementProps) {
  const [studios, setStudios] = useState<StudioWithMembers[]>(initialStudios);
  const [selectedStudioId, setSelectedStudioId] = useState(
    initialStudios[0]?.id ?? "",
  );
  const [lastJoinPassword, setLastJoinPassword] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [updatingMemberId, setUpdatingMemberId] = useState<string | null>(null);

  const selectedStudio = useMemo(
    () => studios.find((studio) => studio.id === selectedStudioId),
    [selectedStudioId, studios],
  );

  const handleSelectStudio = (studioId: string) => {
    setSelectedStudioId(studioId);
    setLastJoinPassword("");
  };

  const handleCreateStudio = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatusMessage(null);
    setIsSaving(true);

    const formData = new FormData(event.currentTarget);
    const payload = {
      name: String(formData.get("name") || "").trim(),
      joinPassword: String(formData.get("joinPassword") || "").trim(),
    };

    const response = await fetch("/api/studios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      setStatusMessage(result.error || "Failed to create studio.");
      setIsSaving(false);
      return;
    }

    setStudios((prev) => [...prev, result.studio]);
    setSelectedStudioId(result.studio.id);
    setLastJoinPassword(result.joinPassword);
    setStatusMessage("Studio created. Share the join password with your members.");
    event.currentTarget.reset();
    setIsSaving(false);
  };

  const handleMemberAction = async (memberId: string, action: MemberAction) => {
    if (!selectedStudio) return;

    setUpdatingMemberId(memberId);
    setStatusMessage(null);

    const response = await fetch(
      `/api/studios/${selectedStudio.id}/members/${memberId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      },
    );

    const result = await response.json();

    if (!response.ok) {
      setStatusMessage(result.error || "Unable to update member.");
      setUpdatingMemberId(null);
      return;
    }

    setStudios((prev) =>
      prev.map((studio) =>
        studio.id === selectedStudio.id
          ? {
              ...studio,
              members: studio.members.map((member) =>
                member.id === memberId ? result.member : member,
              ),
            }
          : studio,
      ),
    );

    setStatusMessage(
      action === "approve"
        ? "Member approved."
        : "Member access revoked.",
    );
    setUpdatingMemberId(null);
  };

  const handleRegeneratePassword = async () => {
    if (!selectedStudio) return;

    setIsRegenerating(true);
    setStatusMessage(null);

    const response = await fetch(
      `/api/studios/${selectedStudio.id}/join-password`,
      { method: "POST" },
    );

    const result = await response.json();

    if (!response.ok) {
      setStatusMessage(result.error || "Unable to regenerate password.");
      setIsRegenerating(false);
      return;
    }

    setLastJoinPassword(result.joinPassword);
    setStudios((prev) =>
      prev.map((studio) =>
        studio.id === selectedStudio.id
          ? { ...studio, joinPasswordUpdatedAt: result.studio.joinPasswordUpdatedAt }
          : studio,
      ),
    );
    setStatusMessage("Join password regenerated. Copy it to share.");
    setIsRegenerating(false);
  };

  const handleCopyPassword = async () => {
    if (!lastJoinPassword) {
      setStatusMessage("Generate a join password to copy it.");
      return;
    }

    await navigator.clipboard.writeText(lastJoinPassword);
    setStatusMessage("Join password copied to clipboard.");
  };

  const currentMembers = selectedStudio?.members ?? [];
  const joinPasswordUpdatedAt = selectedStudio?.joinPasswordUpdatedAt
    ? new Date(selectedStudio.joinPasswordUpdatedAt).toLocaleString()
    : "Not yet generated";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create a studio</CardTitle>
          <CardDescription>
            Set up the studio name and a join password members will need to request
            access.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={handleCreateStudio}>
            <div className="grid gap-2">
              <Label htmlFor="name">Studio name</Label>
              <Input id="name" name="name" placeholder="Community firing studio" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="joinPassword">Join password</Label>
              <Input
                id="joinPassword"
                minLength={8}
                name="joinPassword"
                placeholder="At least 8 characters"
                required
                type="password"
              />
              <p className="text-xs text-muted-foreground">
                Passwords are stored securely using a salted hash.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button disabled={isSaving} type="submit">
                {isSaving ? "Creating..." : "Create studio"}
              </Button>
              {statusMessage ? (
                <p className="text-sm text-muted-foreground">{statusMessage}</p>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Join password controls</CardTitle>
            <CardDescription>
              Regenerate and share the latest join password without exposing stored
              secrets.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <select
              className={cn(
                "flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                "sm:w-64",
              )}
              onChange={(event) => handleSelectStudio(event.target.value)}
              value={selectedStudioId}
            >
              {studios.length === 0 ? (
                <option value="">No studios created yet</option>
              ) : null}
              {studios.map((studio) => (
                <option key={studio.id} value={studio.id}>
                  {studio.name}
                </option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium">Most recent update</p>
              <p className="text-sm text-muted-foreground">{joinPasswordUpdatedAt}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                disabled={!selectedStudio || isRegenerating}
                onClick={handleRegeneratePassword}
                type="button"
                variant="outline"
              >
                {isRegenerating ? "Regenerating..." : "Regenerate password"}
              </Button>
              <Button disabled={!lastJoinPassword} onClick={handleCopyPassword} type="button">
                Copy join password
              </Button>
            </div>
          </div>
          {lastJoinPassword ? (
            <p className="text-sm text-muted-foreground">
              Latest password: <span className="font-medium text-foreground">{lastJoinPassword}</span>
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Generate or create a studio to see the shareable join password.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Studio members</CardTitle>
          <CardDescription>
            Approve pending members or revoke access directly from the roster.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {currentMembers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No members found for this studio.</p>
          ) : (
            <div className="space-y-2">
              {currentMembers.map((member) => (
                <div
                  className="flex flex-col gap-2 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between"
                  key={member.id}
                >
                  <div className="space-y-1">
                    <p className="font-medium">
                      {member.user.name || member.user.email || "Unnamed member"}
                    </p>
                    <p className="text-sm text-muted-foreground">{member.user.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Status: <span className="font-semibold text-foreground">{member.status}</span>
                      {member.role ? ` • Role: ${member.role}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      disabled={member.status === "active" || updatingMemberId === member.id}
                      onClick={() => handleMemberAction(member.id, "approve")}
                      size="sm"
                      variant="outline"
                    >
                      {updatingMemberId === member.id && member.status !== "active"
                        ? "Saving..."
                        : "Approve"}
                    </Button>
                    <Button
                      disabled={member.status === "revoked" || updatingMemberId === member.id}
                      onClick={() => handleMemberAction(member.id, "revoke")}
                      size="sm"
                      variant="destructive"
                    >
                      {updatingMemberId === member.id && member.status !== "revoked"
                        ? "Saving..."
                        : "Revoke"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {statusMessage ? (
            <p className="text-sm text-muted-foreground">{statusMessage}</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
