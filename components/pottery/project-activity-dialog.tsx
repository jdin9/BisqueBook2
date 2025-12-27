"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { Loader2, Plus, X } from "lucide-react";
import { ActivityTimeline } from "@/components/pottery/activity-timeline";
import { Button } from "@/components/ui/button";
import {
  type PotteryActivity,
  type PotteryConeOption,
  type PotteryGlazeOption,
  type PotteryPhoto,
  type PotteryProject,
} from "./types";

type ProjectActivityDialogProps = {
  project: PotteryProject;
  glazes: PotteryGlazeOption[];
  cones: PotteryConeOption[];
  initialPhotoId?: string | null;
  onClose: () => void;
  onActivitySaved: (activity: PotteryActivity) => void;
};

type SubmitState = {
  status: "idle" | "submitting" | "success" | "error";
  message?: string;
};

type DisplayPhoto = PotteryPhoto & { label: string };

export function ProjectActivityDialog({
  project,
  glazes,
  cones,
  initialPhotoId,
  onClose,
  onActivitySaved,
}: ProjectActivityDialogProps) {
  const [activePhotoId, setActivePhotoId] = useState<string | null>(initialPhotoId ?? null);
  const [activityType, setActivityType] = useState<"glaze" | "fire">("glaze");
  const [coats, setCoats] = useState(1);
  const [photoCount, setPhotoCount] = useState(0);
  const [state, setState] = useState<SubmitState>({ status: "idle" });

  const allPhotos = useMemo<DisplayPhoto[]>(() => {
    const projectPhotos = project.projectPhotos.map((photo) => ({
      ...photo,
      label: "Project photo",
    }));

    const activityPhotos = project.activities.flatMap((activity) =>
      activity.photos.map((photo) => ({
        ...photo,
        label:
          activity.type === "glaze"
            ? `Glaze${activity.glazeName ? ` · ${activity.glazeName}` : ""}`
            : `Fire${activity.cone ? ` · Cone ${activity.cone}` : ""}`,
      })),
    );

    return [...projectPhotos, ...activityPhotos];
  }, [project.activities, project.projectPhotos]);

  useEffect(() => {
    setActivePhotoId((current) => {
      if (current && allPhotos.some((photo) => photo.id === current)) {
        return current;
      }
      if (initialPhotoId && allPhotos.some((photo) => photo.id === initialPhotoId)) {
        return initialPhotoId;
      }
      return allPhotos[0]?.id ?? null;
    });
  }, [allPhotos, initialPhotoId]);

  const activePhoto = allPhotos.find((photo) => photo.id === activePhotoId) ?? allPhotos[0] ?? null;
  const canSubmit = activityType === "glaze" ? glazes.length > 0 : cones.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start overflow-y-auto bg-black/40 px-4 py-6">
      <div className="relative mx-auto grid w-full max-w-6xl gap-6 rounded-2xl border bg-background p-6 shadow-2xl md:grid-cols-[1.05fr_0.95fr]">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close activity dialog"
          className="absolute right-3 top-3 rounded-full p-2 text-muted-foreground transition hover:bg-muted"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Project</p>
              <h2 className="text-2xl font-semibold leading-tight text-foreground">{project.title}</h2>
              <p className="text-sm text-muted-foreground">Clay body: {project.clayBody}</p>
            </div>
            <div className="text-right text-xs text-muted-foreground">
              <p>Created</p>
              <p className="font-medium text-foreground">
                {new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(project.createdAt))}
              </p>
            </div>
          </div>

          {activePhoto ? (
            <div className="relative overflow-hidden rounded-xl border bg-muted/30">
              <div className="relative aspect-[4/3] w-full">
                <Image
                  src={activePhoto.url}
                  alt={activePhoto.label}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 760px"
                  priority
                />
              </div>
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/60 to-transparent px-4 pb-3 pt-8 text-xs text-white">
                <div className="space-y-0.5">
                  <p className="text-sm font-semibold">{activePhoto.label}</p>
                  <p className="text-[11px] uppercase tracking-wide">
                    {new Intl.DateTimeFormat("en-US", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(activePhoto.createdAt))}
                  </p>
                </div>
                <span className="rounded-full bg-white/20 px-2 py-1 text-[11px] font-medium backdrop-blur">
                  {allPhotos.length} photo{allPhotos.length === 1 ? "" : "s"}
                </span>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed bg-muted/40 p-6 text-sm text-muted-foreground">
              No photos uploaded yet. Add activity shots to see them here.
            </div>
          )}

          {allPhotos.length > 1 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {allPhotos.map((photo) => (
                <button
                  key={photo.id}
                  type="button"
                  onClick={() => setActivePhotoId(photo.id)}
                  className={`group relative overflow-hidden rounded-lg border transition ${
                    activePhoto?.id === photo.id ? "border-primary shadow-md" : "border-border/70 hover:border-primary/60"
                  }`}
                >
                  <div className="relative aspect-video w-full">
                    <Image
                      src={photo.url}
                      alt={photo.label}
                      fill
                      className="object-cover transition duration-300 group-hover:scale-105"
                      sizes="160px"
                    />
                  </div>
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-2 text-left">
                    <p className="line-clamp-1 text-[11px] font-medium text-white">{photo.label}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="rounded-xl border bg-card/50 p-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-foreground">Activity log</p>
                <p className="text-xs text-muted-foreground">
                  Glaze layers, firing notes, and reference photos are tracked here.
                </p>
              </div>
              <span className="text-xs text-muted-foreground">
                {project.activities.length} {project.activities.length === 1 ? "entry" : "entries"}
              </span>
            </div>
            <div className="pt-3">
              <ActivityTimeline activities={project.activities} />
            </div>
          </div>
        </div>

        <div className="space-y-4 rounded-xl border bg-card/50 p-5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-foreground">Add activity</p>
              <p className="text-xs text-muted-foreground">
                Log glaze applications or firings and attach photos for future reference.
              </p>
            </div>
            <span className="rounded-full bg-muted px-2 py-1 text-[11px] font-medium text-muted-foreground">
              Project ID: {project.id.slice(0, 8)}…
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant={activityType === "glaze" ? "default" : "outline"}
              onClick={() => setActivityType("glaze")}
              className="w-full"
            >
              Glaze
            </Button>
            <Button
              type="button"
              variant={activityType === "fire" ? "default" : "outline"}
              onClick={() => setActivityType("fire")}
              className="w-full"
            >
              Fire
            </Button>
          </div>

          <form
            className="space-y-4"
            onSubmit={async (event) => {
              event.preventDefault();
              setState({ status: "submitting" });

              const formElement = event.currentTarget;
              const formData = new FormData(formElement);

              formData.set("projectId", project.id);
              formData.set("type", activityType);

              if (activityType === "glaze") {
                formData.delete("cone");
              } else {
                formData.delete("glazeId");
                formData.delete("coats");
              }

              try {
                const response = await fetch("/api/pottery/activities", {
                  method: "POST",
                  body: formData,
                });

                const result = (await response.json().catch(() => null)) as { error?: string; activity?: PotteryActivity } | null;

                if (!response.ok || !result?.activity) {
                  setState({
                    status: "error",
                    message: result?.error || "Unable to save activity. Please try again.",
                  });
                  return;
                }

                formElement.reset();
                setCoats(1);
                setPhotoCount(0);
                setState({ status: "success", message: "Activity added to the log." });
                onActivitySaved(result.activity);

                if (result.activity.photos[0]?.id) {
                  setActivePhotoId(result.activity.photos[0].id);
                }
              } catch (error) {
                console.error("Failed to save pottery activity", error);
                setState({
                  status: "error",
                  message: "Unexpected error while saving. Please try again.",
                });
              } finally {
                setState((prev) =>
                  prev.status === "error" || prev.status === "success" ? prev : { ...prev, status: "idle" },
                );
              }
            }}
          >
            {activityType === "glaze" ? (
              <div className="space-y-3">
                <label className="space-y-2 text-sm block">
                  <span className="font-medium text-foreground">Glaze</span>
                  <select
                    name="glazeId"
                    required
                    defaultValue=""
                    disabled={!glazes.length}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-muted"
                  >
                    <option value="" disabled>
                      Select a glaze
                    </option>
                    {glazes.map((glaze) => (
                      <option key={glaze.id} value={glaze.id}>
                        {glaze.name}
                        {glaze.brand ? ` — ${glaze.brand}` : ""}
                      </option>
                    ))}
                  </select>
                  {!glazes.length && (
                    <p className="text-xs text-muted-foreground">
                      No active glazes found. Add one in the admin pottery tab.
                    </p>
                  )}
                </label>

                <label className="space-y-2 text-sm block">
                  <span className="font-medium text-foreground">Layers</span>
                  <input
                    type="number"
                    name="coats"
                    min={1}
                    value={coats}
                    onChange={(event) => setCoats(Number.parseInt(event.target.value, 10) || 1)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <p className="text-xs text-muted-foreground">Use the arrows to adjust how many coats were applied.</p>
                </label>
              </div>
            ) : (
              <label className="space-y-2 text-sm block">
                <span className="font-medium text-foreground">Cone</span>
                <select
                  name="cone"
                  required
                  defaultValue=""
                  disabled={!cones.length}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-muted"
                >
                  <option value="" disabled>
                    Select a cone
                  </option>
                  {cones.map((cone) => (
                    <option key={cone.cone} value={cone.cone}>
                      Cone {cone.cone} — {cone.temperature}°F
                    </option>
                  ))}
                </select>
                {!cones.length && (
                  <p className="text-xs text-muted-foreground">Add cones in the kiln admin tab to populate this list.</p>
                )}
              </label>
            )}

            <label className="space-y-2 text-sm block">
              <span className="font-medium text-foreground">Notes</span>
              <textarea
                name="notes"
                rows={4}
                placeholder="Pattern details, timing, or other observations..."
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
                Upload detail shots of the glaze pattern or firing results.{" "}
                {photoCount ? `${photoCount} file${photoCount > 1 ? "s" : ""} selected.` : ""}
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

            <div className="flex items-center justify-end gap-2 border-t pt-4">
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={!canSubmit || state.status === "submitting"}>
                {state.status === "submitting" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Add activity
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
