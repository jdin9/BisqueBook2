import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { formatConeLabel } from "./utils";
import { type PotteryActivity } from "./types";

type ActivityTimelineProps = {
  activities: PotteryActivity[];
};

export function ActivityTimeline({ activities }: ActivityTimelineProps) {
  if (activities.length === 0) {
    return (
      <Card>
        <CardContent className="p-4 text-sm text-muted-foreground">
          No activities recorded yet for this project.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <Card key={activity.id} className="border-border/80">
          <CardContent className="space-y-3 p-4">
            <div className="flex items-start gap-3">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                  activity.type === "glaze" ? "bg-sky-100 text-sky-800" : "bg-emerald-100 text-emerald-800"
                }`}
              >
                {activity.type === "glaze" ? "Glaze" : "Fire"}
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  {activity.type === "glaze" && activity.glazeName && (
                    <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-800">
                      {activity.glazeName}
                    </span>
                  )}
                  {activity.type === "glaze" && activity.coats !== null && activity.coats !== undefined && (
                    <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-900">
                      {activity.coats} coat{activity.coats === 1 ? "" : "s"}
                    </span>
                  )}
                  {activity.type === "fire" && activity.cone && (
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
                      {formatConeLabel(activity.cone)}
                    </span>
                  )}
                  {activity.type === "fire" && activity.coneTemperature && (
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-900">
                      {activity.coneTemperature}°F
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {new Intl.DateTimeFormat("en-US", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(activity.createdAt))}
                  </span>
                </div>
                {activity.notes && <p className="text-sm text-muted-foreground">{activity.notes}</p>}
                {activity.photos.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {activity.photos.map((photo) => (
                      <div key={photo.id} className="relative aspect-video overflow-hidden rounded-lg">
                        <Image
                          src={photo.url}
                          alt="Activity photo"
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 50vw, 160px"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
