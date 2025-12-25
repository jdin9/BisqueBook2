"use client";

import { useMemo, useState } from "react";
import { ProjectCard } from "./project-card";
import { ProjectDetailsPanel } from "./project-details-panel";
import { type PotteryProject } from "./types";

type PotteryGalleryProps = {
  projects: PotteryProject[];
};

export function PotteryGallery({ projects }: PotteryGalleryProps) {
  const [selectedId, setSelectedId] = useState<string | null>(projects[0]?.id ?? null);

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedId) ?? null,
    [projects, selectedId],
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Projects</h2>
            <p className="text-sm text-muted-foreground">Tap a card to view clay, glazes, and firing details.</p>
          </div>
          <span className="text-sm text-muted-foreground">{projects.length} active</span>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              isSelected={project.id === selectedId}
              onSelect={() => setSelectedId(project.id)}
            />
          ))}
        </div>
      </div>
      <ProjectDetailsPanel project={selectedProject ?? null} />
    </div>
  );
}
