import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ActivityTimeline } from "./activity-timeline";
import { type PotteryProject } from "./types";

type ProjectDetailsPanelProps = {
  project: PotteryProject | null;
};

export function ProjectDetailsPanel({ project }: ProjectDetailsPanelProps) {
  if (!project) {
    return (
      <Card className="sticky top-4 border-dashed border-muted/80">
        <CardHeader>
          <CardTitle>Select a project</CardTitle>
          <CardDescription>Choose a card to view clay body, glaze path, and firing history.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="sticky top-4 space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="text-xl">{project.title}</CardTitle>
              <p className="text-sm text-muted-foreground">Clay body: {project.clayBody}</p>
            </div>
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              {new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(project.createdAt))}
            </span>
          </div>
          {project.notes && <CardDescription className="pt-1 text-base text-foreground">{project.notes}</CardDescription>}
        </CardHeader>
        {project.projectPhotos.length > 0 && (
          <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {project.projectPhotos.map((photo) => (
              <div key={photo.id} className="relative aspect-video overflow-hidden rounded-lg border border-border/60">
                <Image
                  src={photo.url}
                  alt="Project photo"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, 200px"
                />
              </div>
            ))}
          </CardContent>
        )}
      </Card>

      <div className="space-y-3">
        <div>
          <p className="text-sm font-semibold text-foreground">Activity timeline</p>
          <p className="text-sm text-muted-foreground">Chronological glazing and firing history (archived hidden).</p>
        </div>
        <ActivityTimeline activities={project.activities} />
      </div>
    </div>
  );
}
