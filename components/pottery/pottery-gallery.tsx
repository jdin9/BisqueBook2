"use client";

import { ProjectCard } from "./project-card";
import { type PotteryProject } from "./types";

type PotteryGalleryProps = {
  projects: PotteryProject[];
};

export function PotteryGallery({ projects }: PotteryGalleryProps) {
  return (
    <div className="space-y-4">
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
