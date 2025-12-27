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

export type PotteryConeOption = {
  cone: string;
  temperature: string;
};

export type PotteryActivity = {
  id: string;
  type: "glaze" | "fire";
  notes: string | null;
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
  clayBody: string;
  createdAt: string;
  updatedAt: string;
  thumbnailUrl: string | null;
  glazesUsed: string[];
  projectPhotos: PotteryPhoto[];
  activities: PotteryActivity[];
};
