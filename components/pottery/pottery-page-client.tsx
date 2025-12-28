"use client";

import { useMemo, useState } from "react";
import { AddProjectModal } from "@/components/pottery/add-project-modal";
import { PotteryGallery } from "@/components/pottery/pottery-gallery";
import { PotteryFilterMenu } from "@/components/pottery/pottery-filter-menu";
import {
  type PotteryClayFilterOption,
  type PotteryConeOption,
  type PotteryFilterState,
  type PotteryGlazeFilterOption,
  type PotteryGlazeOption,
  type PotteryProject,
} from "@/components/pottery/types";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type PotteryPageClientProps = {
  projects: PotteryProject[];
  activeGlazes: PotteryGlazeOption[];
  allGlazes: PotteryGlazeFilterOption[];
  cones: PotteryConeOption[];
  clays: { id: string; name: string }[];
  allClays: PotteryClayFilterOption[];
  makerName: string | null;
  errors: string[];
};

const initialFilters: PotteryFilterState = {
  glazeIds: [],
  clayIds: [],
  makerIds: [],
  includeAllActiveGlazes: false,
};

export function PotteryPageClient({
  projects,
  activeGlazes,
  allGlazes,
  cones,
  clays,
  allClays,
  makerName,
  errors,
}: PotteryPageClientProps) {
  const [filters, setFilters] = useState<PotteryFilterState>(initialFilters);

  const makerOptions = useMemo(
    () =>
      Array.from(
        new Map(projects.map((project) => [project.makerId, project.makerName])).entries(),
      ).map(([id, name]) => ({ id, name })),
    [projects],
  );

  const activeGlazeIds = useMemo(
    () => allGlazes.filter((glaze) => glaze.status === "active").map((glaze) => glaze.id),
    [allGlazes],
  );

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">Community-wide record</p>
            <h1 className="text-3xl font-semibold">Pottery projects</h1>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <PotteryFilterMenu
              filters={filters}
              onChange={setFilters}
              glazeOptions={allGlazes}
              clayOptions={allClays}
              makerOptions={makerOptions}
              activeGlazeIds={activeGlazeIds}
              onReset={() =>
                setFilters({
                  ...initialFilters,
                  glazeIds: [],
                  clayIds: [],
                  makerIds: [],
                })
              }
            />
            <AddProjectModal clays={clays} makerName={makerName} />
          </div>
        </div>
        <p className="text-muted-foreground">
          Browse active projects, materials, and kiln history pulled directly from the Supabase tables that power the
          pottery log.
        </p>
      </div>

      {errors.length > 0 && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {errors.join(" ")}
        </div>
      )}

      {projects.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No projects available</CardTitle>
            <CardDescription>
              Projects will appear here as soon as makers create them in Supabase under the Projects table.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <PotteryGallery
          projects={projects}
          glazes={activeGlazes}
          cones={cones}
          filters={filters}
          activeGlazeIds={activeGlazeIds}
        />
      )}
    </div>
  );
}
