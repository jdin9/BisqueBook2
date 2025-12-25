"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AddProjectModal() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button className="gap-2" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        Add Project
      </Button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-lg rounded-2xl border bg-background shadow-2xl">
            <div className="flex items-start justify-between border-b px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold">Add a pottery project</h2>
                <p className="text-sm text-muted-foreground">Log projects alongside clays, glazes, and firing history.</p>
              </div>
              <Button variant="ghost" size="icon" aria-label="Close" onClick={() => setOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4 px-6 py-5 text-sm text-muted-foreground">
              <p>
                Use the admin workspace to add a new pottery project, attach photos, and track glazes or firing details.
                The gallery will update automatically after you create it.
              </p>
              <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-foreground">Quick steps</span>
                <ul className="list-disc space-y-2 pl-5">
                  <li>Select <strong>Pottery</strong> in the admin tabs.</li>
                  <li>Create or choose a clay body, then add your project title and notes.</li>
                  <li>Return here to see the new project in the gallery.</li>
                </ul>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t px-6 py-4">
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button asChild>
                <Link href="/admin" className="gap-2">
                  Go to admin
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
