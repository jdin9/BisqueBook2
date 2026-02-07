"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type ClayOption = {
  id: string;
  name: string;
};

type AddProjectModalProps = {
  clays: ClayOption[];
  makerName: string | null;
};

type SubmitState = {
  status: "idle" | "submitting" | "success" | "error";
  message?: string;
};

export function AddProjectModal({ clays, makerName }: AddProjectModalProps) {
  const [open, setOpen] = useState(false);
  const [photoCount, setPhotoCount] = useState(0);
  const [state, setState] = useState<SubmitState>({ status: "idle" });
  const router = useRouter();

  const canSubmit = useMemo(() => clays.length > 0 && Boolean(makerName), [clays.length, makerName]);

  return (
    <>
      <Button className="gap-2" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        Add Project
      </Button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 px-4 backdrop-blur-sm">
          <div className="glass-panel relative w-full max-w-2xl overflow-hidden">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(129,140,248,0.2),transparent_45%),radial-gradient(circle_at_85%_20%,rgba(232,121,249,0.18),transparent_42%)]" />
            <div className="relative flex items-start justify-between border-b border-white/50 bg-white/60 px-6 py-4 backdrop-blur">
              <div>
                <h2 className="text-lg font-semibold">Add a pottery project</h2>
                <p className="text-sm text-muted-foreground">
                  Fill in the project basics, choose a clay body, and attach photos to track progress.
                </p>
              </div>
              <Button variant="ghost" size="icon" aria-label="Close" onClick={() => setOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form
              className="relative space-y-4 px-6 py-5"
              onSubmit={async (event: FormEvent<HTMLFormElement>) => {
                event.preventDefault();
                setState({ status: "submitting" });

                const formElement = event.currentTarget;
                const formData = new FormData(formElement);

                if (!makerName) {
                  setState({ status: "error", message: "Sign in to create a project." });
                  return;
                }

                try {
                  formData.set("makerName", makerName);

                  const response = await fetch("/api/pottery/projects", {
                    method: "POST",
                    body: formData,
                  });

                  if (!response.ok) {
                    const result = (await response.json().catch(() => null)) as { error?: string } | null;
                    setState({
                      status: "error",
                      message: result?.error || "Unable to save project. Please try again.",
                    });
                    return;
                  }

                  formElement.reset();
                  setPhotoCount(0);
                  setState({ status: "success" });
                  setOpen(false);
                  router.refresh();
                } catch (error) {
                  console.error("Failed to save pottery project", error);
                  setState({
                    status: "error",
                    message: "Unexpected error while saving. Please try again.",
                  });
                }
              }}
            >
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm">
                  <span className="font-medium text-foreground">Project name</span>
                  <input
                    type="text"
                    name="projectName"
                    required
                    placeholder="Ex: Stoneware dinner plate set"
                    className="w-full rounded-md border border-white/60 bg-white/70 px-3 py-2 text-sm shadow-sm transition focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </label>

                <label className="space-y-2 text-sm">
                  <span className="font-medium text-foreground">Clay</span>
                  <select
                    name="clayId"
                    required
                    defaultValue=""
                    className="w-full rounded-md border border-white/60 bg-white/70 px-3 py-2 text-sm shadow-sm transition focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="" disabled>
                      Select a clay body
                    </option>
                    {clays.map((clay) => (
                      <option key={clay.id} value={clay.id}>
                        {clay.name}
                      </option>
                    ))}
                  </select>
                  {!clays.length && (
                    <p className="text-xs text-muted-foreground">
                      No active clays found. Add one in the admin pottery tab.
                    </p>
                  )}
                </label>
              </div>

              <label className="space-y-2 text-sm block">
                <span className="font-medium text-foreground">Maker</span>
                <input
                  type="text"
                  name="makerName"
                  value={makerName ?? "Not signed in"}
                  readOnly
                  className="w-full rounded-md border border-white/60 bg-white/60 px-3 py-2 text-sm text-muted-foreground shadow-sm"
                />
                {!makerName && <span className="text-xs text-muted-foreground">Sign in to attach your name.</span>}
              </label>

              <label className="space-y-2 text-sm block">
                <span className="font-medium text-foreground">Notes</span>
                <textarea
                  name="notes"
                  rows={4}
                  placeholder="Firing schedule, glaze plans, form details..."
                  className="w-full rounded-md border border-white/60 bg-white/70 px-3 py-2 text-sm shadow-sm transition focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </label>

              <label className="space-y-2 text-sm block">
                <span className="font-medium text-foreground">Photos</span>
                <input
                  type="file"
                  name="photos"
                  accept="image/*"
                  multiple
                  onChange={(event) => setPhotoCount(event.target.files?.length ?? 0)}
                  className="w-full cursor-pointer rounded-md border border-dashed border-white/60 bg-white/70 px-3 py-4 text-sm shadow-sm transition hover:border-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                />
                <p className="text-xs text-muted-foreground">
                  Upload progress shots or reference images (you can select multiple). {photoCount ? `${photoCount} file${photoCount > 1 ? "s" : ""} selected.` : ""}
                </p>
              </label>

              {state.status === "success" && state.message && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                  {state.message}
                </div>
              )}
              {state.status === "error" && state.message && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {state.message}
                </div>
              )}

              <div className="flex items-center justify-between border-t border-white/50 pt-4">
                <div className="text-xs text-muted-foreground">
                  Need the full admin view?{" "}
                  <Link href="/admin" className="inline-flex items-center gap-1 text-primary hover:underline">
                    Go to admin
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
                <div className="flex items-center gap-2">
                  <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={!canSubmit || state.status === "submitting"}>
                    {state.status === "submitting" ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save project"
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
