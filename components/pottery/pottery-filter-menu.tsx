"use client";

import { useMemo } from "react";
import { Filter } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { type PotteryClayFilterOption, type PotteryFilterState, type PotteryGlazeFilterOption } from "./types";

type MakerOption = { id: string; name: string };

type PotteryFilterMenuProps = {
  filters: PotteryFilterState;
  onChange: (next: PotteryFilterState | ((prev: PotteryFilterState) => PotteryFilterState)) => void;
  glazeOptions: PotteryGlazeFilterOption[];
  clayOptions: PotteryClayFilterOption[];
  makerOptions: MakerOption[];
  activeGlazeIds: string[];
  onReset: () => void;
};

export function PotteryFilterMenu({
  filters,
  onChange,
  glazeOptions,
  clayOptions,
  makerOptions,
  activeGlazeIds,
  onReset,
}: PotteryFilterMenuProps) {
  const activeGlazes = glazeOptions.filter((glaze) => glaze.status === "active");
  const inactiveGlazes = glazeOptions.filter((glaze) => glaze.status !== "active");
  const activeGlazeIdSet = useMemo(() => new Set(activeGlazeIds), [activeGlazeIds]);

  const effectiveGlazeCount = useMemo(() => {
    const set = new Set(filters.glazeIds);
    if (filters.includeAllActiveGlazes) {
      activeGlazeIds.forEach((id) => set.add(id));
    }
    return set.size;
  }, [activeGlazeIds, filters.glazeIds, filters.includeAllActiveGlazes]);

  const appliedFilterCount = effectiveGlazeCount + filters.clayIds.length + filters.makerIds.length;

  const handleGlazeToggle = (glazeId: string, checked: boolean) => {
    onChange((current) => {
      const nextGlazes = new Set(current.glazeIds);

      if (checked) {
        nextGlazes.add(glazeId);
      } else {
        nextGlazes.delete(glazeId);
      }

      if (current.includeAllActiveGlazes && !checked && activeGlazeIdSet.has(glazeId)) {
        activeGlazeIds.forEach((id) => {
          if (id !== glazeId) nextGlazes.add(id);
        });
        return { ...current, includeAllActiveGlazes: false, glazeIds: Array.from(nextGlazes) };
      }

      return { ...current, glazeIds: Array.from(nextGlazes) };
    });
  };

  const handleClayToggle = (clayId: string, checked: boolean) => {
    onChange((current) => {
      const next = new Set(current.clayIds);
      if (checked) {
        next.add(clayId);
      } else {
        next.delete(clayId);
      }

      return { ...current, clayIds: Array.from(next) };
    });
  };

  const handleMakerToggle = (makerId: string, checked: boolean) => {
    onChange((current) => {
      const next = new Set(current.makerIds);
      if (checked) {
        next.add(makerId);
      } else {
        next.delete(makerId);
      }

      return { ...current, makerIds: Array.from(next) };
    });
  };

  const handleAllActiveGlazesToggle = (checked: boolean) => {
    onChange((current) => {
      const nextGlazes = new Set(current.glazeIds);
      if (checked) {
        activeGlazeIds.forEach((id) => nextGlazes.add(id));
      }

      return { ...current, includeAllActiveGlazes: checked, glazeIds: Array.from(nextGlazes) };
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={appliedFilterCount ? "default" : "outline"} className="gap-2">
          <Filter className="h-4 w-4" />
          Filters
          {appliedFilterCount > 0 && (
            <span className="rounded-full bg-primary-foreground/80 px-2 py-0.5 text-xs font-semibold text-primary">
              {appliedFilterCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          Glaze
          <button
            type="button"
            onClick={onReset}
            className="text-xs font-medium text-primary hover:underline"
            aria-label="Reset filters"
          >
            Reset
          </button>
        </DropdownMenuLabel>
        <DropdownMenuCheckboxItem
          checked={filters.includeAllActiveGlazes}
          onCheckedChange={(checked) => handleAllActiveGlazesToggle(Boolean(checked))}
        >
          All active glazes
        </DropdownMenuCheckboxItem>
        {activeGlazes.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs uppercase text-muted-foreground">Active glazes</DropdownMenuLabel>
            {activeGlazes.map((glaze) => (
              <DropdownMenuCheckboxItem
                key={glaze.id}
                checked={filters.includeAllActiveGlazes || filters.glazeIds.includes(glaze.id)}
                onCheckedChange={(checked) => handleGlazeToggle(glaze.id, Boolean(checked))}
                className="pl-8"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium leading-tight">{glaze.name}</span>
                  {glaze.brand && <span className="text-xs text-muted-foreground">{glaze.brand}</span>}
                </div>
              </DropdownMenuCheckboxItem>
            ))}
          </>
        )}

        {inactiveGlazes.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs uppercase text-muted-foreground">Inactive glazes</DropdownMenuLabel>
            {inactiveGlazes.map((glaze) => (
              <DropdownMenuCheckboxItem
                key={glaze.id}
                checked={filters.glazeIds.includes(glaze.id)}
                onCheckedChange={(checked) => handleGlazeToggle(glaze.id, Boolean(checked))}
                className="pl-8"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium leading-tight">{glaze.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {glaze.brand ? `${glaze.brand} · ` : ""}
                    {glaze.status || "inactive"}
                  </span>
                </div>
              </DropdownMenuCheckboxItem>
            ))}
          </>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuLabel>Clay body</DropdownMenuLabel>
        {clayOptions.map((clay) => (
          <DropdownMenuCheckboxItem
            key={clay.id}
            checked={filters.clayIds.includes(clay.id)}
            onCheckedChange={(checked) => handleClayToggle(clay.id, Boolean(checked))}
            className="pl-8"
          >
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium leading-tight">{clay.name}</span>
              {clay.status && clay.status !== "active" && (
                <span className="text-xs text-muted-foreground">Status: {clay.status}</span>
              )}
            </div>
          </DropdownMenuCheckboxItem>
        ))}

        <DropdownMenuSeparator />
        <DropdownMenuLabel>Maker</DropdownMenuLabel>
        {makerOptions.map((maker) => (
          <DropdownMenuCheckboxItem
            key={maker.id}
            checked={filters.makerIds.includes(maker.id)}
            onCheckedChange={(checked) => handleMakerToggle(maker.id, Boolean(checked))}
            className="pl-8"
          >
            <span className="text-sm font-medium leading-tight">{maker.name}</span>
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
