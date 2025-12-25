"use client";

import { useActionState, useRef, useState } from "react";
import { useRouter } from "next/navigation";
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

export type ClayOption = {
  id: string;
  name: string;
};

export type MakerOption = {
  id: string;
  name: string;
};

type CreateProjectDialogProps = {
  action: (state: CreateProjectState, formData: FormData) => Promise<CreateProjectState>;
  clays: ClayOption[];
  makers: MakerOption[];
  canSubmit: boolean;
  unavailableReason?: string;
};

export function CreateProjectDialog({ action, clays, makers, canSubmit, unavailableReason }: CreateProjectDialogProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([]);
  const [state, formAction, pending] = useActionState<CreateProjectState, FormData>(
    async (prevState, formData) => {
      const result = await action(prevState, formData);

      if (result.status === "success") {
        formRef.current?.reset();
        setSelectedPhotos([]);
        router.refresh();
        setOpen(false);
      }

      return result;
    },
    initialState,
  );

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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b px-6 py-4">
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

            <form ref={formRef} action={formAction} className="space-y-4 px-6 py-5">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" name="title" required placeholder="Ex: Stoneware dinner plate set" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="clayId">Clay body</Label>
                <select
                  id="clayId"
                  name="clayId"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
                  defaultValue=""
                  disabled={!clays.length}
                  required
                >
                  <option value="">Select clay</option>
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
                <Label htmlFor="makerId">Maker</Label>
                <select
                  id="makerId"
                  name="makerId"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
                  defaultValue=""
                  required
                  disabled={!makers.length}
                >
                  <option value="">Select maker</option>
                  {makers.map((maker) => (
                    <option key={maker.id} value={maker.id}>
                      {maker.name}
                    </option>
                  ))}
                </select>
                {!makers.length && (
                  <p className="text-xs text-muted-foreground">Add makers to Supabase auth to log projects.</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={4}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Firing schedule, form details, glaze plans..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="photos">Project photos</Label>
                <Input
                  id="photos"
                  name="photos"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(event) => setSelectedPhotos(Array.from(event.target.files ?? []))}
                />
                <p className="text-xs text-muted-foreground">Attach progress photos (max 5 MB per file).</p>
                {selectedPhotos.length > 0 ? (
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    {selectedPhotos.map((file) => (
                      <li key={file.name} className="flex items-center justify-between">
                        <span className="truncate" title={file.name}>
                          {file.name}
                        </span>
                        <span>{Math.round(file.size / 1024)} KB</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
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
