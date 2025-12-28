export type PotteryPhoto = {
  id: string;
  storagePath: string;
  url: string;
  createdAt: string;
};

export type PotteryGlazeOption = {
  id: string;
  name: string;
  brand?: string | null;
};

export type PotteryGlazeFilterOption = PotteryGlazeOption & {
  status?: string | null;
};

export type PotteryClayFilterOption = {
  id: string;
  name: string;
  status?: string | null;
};

export type PotteryConeOption = {
  cone: string;
  temperature: string;
};

export type PotteryActivity = {
  id: string;
  type: "glaze" | "fire";
  notes: string | null;
  glazeId?: string | null;
  glazeName?: string;
  coats?: number | null;
  cone?: string | null;
  coneTemperature?: string | null;
  createdAt: string;
  photos: PotteryPhoto[];
};

export type PotteryProject = {
  id: string;
  title: string;
  notes: string | null;
  clayId: string;
  clayBody: string;
  makerId: string;
  makerName: string;
  createdAt: string;
  updatedAt: string;
  thumbnailUrl: string | null;
  glazesUsed: string[];
  glazeIdsUsed: string[];
  projectPhotos: PotteryPhoto[];
  activities: PotteryActivity[];
};

export type PotteryFilterState = {
  glazeIds: string[];
  clayIds: string[];
  makerIds: string[];
  includeAllActiveGlazes: boolean;
};
