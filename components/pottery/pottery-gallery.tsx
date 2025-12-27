"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ProjectCard } from "./project-card";
import { type PotteryProject } from "./types";

type GalleryPhoto = PotteryProject["projectPhotos"][number] & { projectTitle: string };

type PotteryGalleryProps = {
  projects: PotteryProject[];
};

export function PotteryGallery({ projects }: PotteryGalleryProps) {
  const galleryPhotos = useMemo<GalleryPhoto[]>(() => {
    const photos: GalleryPhoto[] = projects.flatMap((project) => [
      ...project.projectPhotos.map((photo) => ({
        ...photo,
        projectTitle: project.title,
      })),
      ...project.activities.flatMap((activity) =>
        activity.photos.map((photo) => ({
          ...photo,
          projectTitle: project.title,
        })),
      ),
    ]);

    const uniquePaths = new Set<string>();
    return photos
      .filter((photo) => {
        if (uniquePaths.has(photo.storagePath)) return false;
        uniquePaths.add(photo.storagePath);
        return true;
      })
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [projects]);

  const [activeIndex, setActiveIndex] = useState(0);
  const photoCount = galleryPhotos.length;

  const move = (delta: number) => {
    if (!photoCount) return;
    setActiveIndex((prev) => (prev + delta + photoCount) % photoCount);
  };

  const slots = [-2, -1, 0, 1, 2];

  return (
    <div className="space-y-8">
      <div className="space-y-4 rounded-xl border bg-card/60 p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">Gallery</h2>
            <p className="text-sm text-muted-foreground">Flip through every uploaded photo.</p>
          </div>
          <span className="text-sm text-muted-foreground">{photoCount} photos</span>
        </div>

        {photoCount === 0 ? (
          <p className="text-sm text-muted-foreground">Add project or activity photos to see them showcased here.</p>
        ) : (
          <div className="space-y-4">
            <div className="relative flex items-center justify-center overflow-hidden py-4">
              <div className="flex w-full items-center justify-center gap-4">
                {slots.map((offset) => {
                  const index = (activeIndex + offset + photoCount) % photoCount;
                  const photo = galleryPhotos[index];
                  const isCenter = offset === 0;
                  const depth = Math.abs(offset);

                  const scaleMap = [1, 0.9, 0.8];
                  const translateMap = ["", "translate-y-2", "translate-y-4"];
                  const opacityMap = [1, 0.8, 0.5];

                  const scale = scaleMap[depth] ?? 0.7;
                  const translate = translateMap[depth] ?? "translate-y-6";
                  const opacity = opacityMap[depth] ?? 0.35;

                  return (
                    <div
                      key={`${photo.id}-${offset}`}
                      className="relative aspect-[4/3] w-full max-w-md shrink-0 transition-all duration-500 ease-out md:max-w-lg"
                      style={{
                        transform: `scale(${scale})`,
                        opacity,
                      }}
                    >
                      <div
                        className={`relative h-full overflow-hidden rounded-xl border bg-muted/40 shadow-md transition-all duration-500 ${
                          isCenter ? "ring-2 ring-primary/80" : ""
                        } ${translate} ${offset < 0 ? "-rotate-1" : offset > 0 ? "rotate-1" : ""}`}
                      >
                        <Image
                          alt={photo.projectTitle ? `${photo.projectTitle} photo` : "Pottery photo"}
                          src={photo.url}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 600px"
                          priority={isCenter}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center justify-center gap-4">
              <Button aria-label="Previous photo" onClick={() => move(-1)} size="sm" variant="outline">
                <ChevronLeft className="mr-1 h-4 w-4" />
                Previous
              </Button>
              <Button aria-label="Next photo" onClick={() => move(1)} size="sm">
                Next
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Projects</h2>
          <p className="text-sm text-muted-foreground">Browse clay bodies, glazes, and firing details.</p>
        </div>
        <span className="text-sm text-muted-foreground">{projects.length} active</span>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </div>
  );
}
