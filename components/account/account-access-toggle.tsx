"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Label } from "@/components/ui/label";

type AccountAccessToggleProps = {
  initialIsAdmin: boolean;
};

export function AccountAccessToggle({ initialIsAdmin }: AccountAccessToggleProps) {
  const [isAdmin, setIsAdmin] = useState(initialIsAdmin);
  const [status, setStatus] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  const handleToggle = async () => {
    const nextValue = !isAdmin;
    setIsSaving(true);
    setStatus(null);

    const response = await fetch("/api/account/access", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isAdmin: nextValue }),
    });

    const result = await response.json();

    if (!response.ok) {
      setStatus(result.error || "Unable to update account access.");
      setIsSaving(false);
      return;
    }

    setIsAdmin(nextValue);
    setStatus(nextValue ? "Admin access enabled." : "Admin access removed.");
    setIsSaving(false);
    router.refresh();
  };

  return (
    <div className="space-y-3 rounded-md border p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="font-medium">Account access</p>
          <p className="text-sm text-muted-foreground">
            Control whether this account has admin permissions across studios.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            id="admin-access"
            type="checkbox"
            checked={isAdmin}
            onChange={handleToggle}
            disabled={isSaving}
            className="h-4 w-4 rounded border"
          />
          <Label htmlFor="admin-access" className="text-sm">
            Admin
          </Label>
        </div>
      </div>
      {status ? (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{status}</span>
          {isSaving && <span className="text-xs">Saving…</span>}
        </div>
      ) : null}
      {!status && isSaving ? (
        <p className="text-sm text-muted-foreground">Saving…</p>
      ) : null}
    </div>
  );
}
