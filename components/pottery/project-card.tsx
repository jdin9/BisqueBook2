import Image from "next/image";
import { Card } from "@/components/ui/card";
import { type PotteryProject } from "./types";

type ProjectCardProps = {
  project: PotteryProject;
};

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <div className="group text-left transition brightness-100 hover:brightness-105">
      <Card className="overflow-hidden border border-border/60 transition">
        <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200">
          {project.thumbnailUrl ? (
            <Image
              src={project.thumbnailUrl}
              alt={`${project.title} thumbnail`}
              fill
              className="object-cover transition duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 50vw, 280px"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              No photo yet
            </div>
          )}
          {project.glazesUsed.length > 0 && (
            <div className="absolute left-2 top-2 flex flex-wrap gap-1">
              {project.glazesUsed.slice(0, 2).map((glaze) => (
                <span
                  key={glaze}
                  className="rounded-full bg-white/90 px-2 py-1 text-[11px] font-medium text-sky-700 shadow-sm"
                >
                  {glaze}
                </span>
              ))}
              {project.glazesUsed.length > 2 && (
                <span className="rounded-full bg-white/90 px-2 py-1 text-[11px] font-medium text-sky-700 shadow-sm">
                  +{project.glazesUsed.length - 2}
                </span>
              )}
            </div>
          )}
        </div>
        <div className="space-y-2 p-4">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-base font-semibold text-foreground">{project.title}</p>
            <span className="text-[11px] text-muted-foreground">
              {new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(
                new Date(project.updatedAt),
              )}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-900">
              Clay: {project.clayBody}
            </span>
            {project.glazesUsed.length > 0 ? (
              <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-900">
                {project.glazesUsed.length} {project.glazesUsed.length === 1 ? "glaze" : "glazes"}
              </span>
            ) : (
              <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                No glazes yet
              </span>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
