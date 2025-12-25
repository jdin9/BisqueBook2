"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { ArrowRight, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type ClayOption = {
  id: string;
  name: string;
};

type AddProjectModalProps = {
  clays: ClayOption[];
  makerName: string | null;
};

export function AddProjectModal({ clays, makerName }: AddProjectModalProps) {
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [photoCount, setPhotoCount] = useState(0);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
  };

  return (
    <>
      <Button className="gap-2" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        Add Project
      </Button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-2xl rounded-2xl border bg-background shadow-2xl">
            <div className="flex items-start justify-between border-b px-6 py-4">
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

            <form className="space-y-4 px-6 py-5" onSubmit={handleSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm">
                  <span className="font-medium text-foreground">Project name</span>
                  <input
                    type="text"
                    name="projectName"
                    required
                    placeholder="Ex: Stoneware dinner plate set"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </label>

                <label className="space-y-2 text-sm">
                  <span className="font-medium text-foreground">Clay</span>
                  <select
                    name="clayId"
                    required
                    defaultValue=""
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
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
                  className="w-full rounded-md border border-input bg-muted/60 px-3 py-2 text-sm text-muted-foreground shadow-sm"
                />
                {!makerName && <span className="text-xs text-muted-foreground">Sign in to attach your name.</span>}
              </label>

              <label className="space-y-2 text-sm block">
                <span className="font-medium text-foreground">Notes</span>
                <textarea
                  name="notes"
                  rows={4}
                  placeholder="Firing schedule, glaze plans, form details..."
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
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
                  className="w-full cursor-pointer rounded-md border border-dashed border-input bg-background px-3 py-4 text-sm shadow-sm transition hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                />
                <p className="text-xs text-muted-foreground">
                  Upload progress shots or reference images (you can select multiple). {photoCount ? `${photoCount} file${photoCount > 1 ? "s" : ""} selected.` : ""}
                </p>
              </label>

              {submitted && (
                <div className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm text-foreground">
                  Project details captured. Wire this form to Supabase or your preferred endpoint to save it.
                </div>
              )}

              <div className="flex items-center justify-between border-t pt-4">
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
                  <Button type="submit">Save project</Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
