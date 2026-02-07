"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type CreateProjectState = {
  status: "idle" | "error" | "success";
  message?: string;
};

const initialState: CreateProjectState = {
  status: "idle",
};

type ClayOption = {
  id: string;
  name: string;
};

type CreateProjectDialogProps = {
  action: (state: CreateProjectState, formData: FormData) => Promise<CreateProjectState>;
  clays: ClayOption[];
  makerName: string | null;
  canSubmit: boolean;
  unavailableReason?: string;
};

export function CreateProjectDialog({ action, clays, makerName, canSubmit, unavailableReason }: CreateProjectDialogProps) {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState<CreateProjectState, FormData>(action, initialState);

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
      // Closing the dialog in response to a successful submission
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOpen(false);
    }
  }, [state.status]);

  return (
    <>
      <div className="flex items-center gap-3">
        <Button size="sm" onClick={() => setOpen(true)} disabled={!canSubmit}>
          + Project
        </Button>
        {!canSubmit && unavailableReason && (
          <p className="text-xs text-muted-foreground">{unavailableReason}</p>
        )}
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 px-4 backdrop-blur-sm">
          <div className="glass-panel relative w-full max-w-lg overflow-hidden">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(129,140,248,0.2),transparent_45%),radial-gradient(circle_at_80%_10%,rgba(232,121,249,0.18),transparent_42%)]" />
            <div className="relative flex items-start justify-between border-b border-white/50 bg-white/60 px-6 py-4 backdrop-blur">
              <div>
                <h3 className="text-lg font-semibold">Add project</h3>
                <p className="text-sm text-muted-foreground">Log a new project for your studio.</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-muted-foreground transition hover:text-foreground"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <form ref={formRef} action={formAction} className="relative space-y-4 px-6 py-5">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  name="title"
                  required
                  placeholder="Ex: Stoneware dinner plate set"
                  className="border-white/60 bg-white/70"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="clayId">Clay body</Label>
                <select
                  id="clayId"
                  name="clayId"
                  className="w-full rounded-md border border-white/60 bg-white/70 px-3 py-2 text-sm shadow-sm transition focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
                  defaultValue=""
                  disabled={!clays.length}
                >
                  <option value="">No clay selected</option>
                  {clays.map((clay) => (
                    <option key={clay.id} value={clay.id}>
                      {clay.name}
                    </option>
                  ))}
                </select>
                {!clays.length && (
                  <p className="text-xs text-muted-foreground">No active clays available for your studio.</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={4}
                  className="w-full rounded-md border border-white/60 bg-white/70 px-3 py-2 text-sm shadow-sm transition focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Firing schedule, form details, glaze plans..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maker">Maker</Label>
                <Input
                  id="maker"
                  name="maker"
                  value={makerName ?? "Not signed in"}
                  disabled
                  readOnly
                  className="border-white/60 bg-white/60"
                />
                {!makerName && (
                  <p className="text-xs text-muted-foreground">Sign in to log a project under your name.</p>
                )}
              </div>

              {state.status === "error" && state.message && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {state.message}
                </div>
              )}
              {state.status === "success" && state.message && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                  {state.message}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={!canSubmit || pending}>
                  {pending ? "Saving..." : "Save project"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
