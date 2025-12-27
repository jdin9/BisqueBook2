import { currentUser } from "@clerk/nextjs/server";
import { unstable_noStore as noStore } from "next/cache";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AddProjectModal } from "@/components/pottery/add-project-modal";
import { PotteryGallery } from "@/components/pottery/pottery-gallery";
import { type PotteryProject } from "@/components/pottery/types";
import { getSupabaseAnonClient, getSupabaseServiceRoleClient } from "@/lib/storage";
import { WelcomeModal } from "@/components/welcome-modal";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function PotteryPage() {
  const { projects, error } = await fetchPotteryProjects();
  const { clays } = await fetchActiveClays();
  const user = await currentUser();
  const makerName = user ? user.fullName || [user.firstName, user.lastName].filter(Boolean).join(" ") || user.username : null;

  return (
    <div className="space-y-8">
      <WelcomeModal />
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">Community-wide record</p>
            <h1 className="text-3xl font-semibold">Pottery projects</h1>
          </div>
          <AddProjectModal clays={clays} makerName={makerName} />
        </div>
        <p className="text-muted-foreground">
          Browse active projects, materials, and kiln history pulled directly from the Supabase tables that power the
          pottery log.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {error}
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
        <PotteryGallery projects={projects} />
      )}
    </div>
  );
}

type ProjectRow = {
  id: string;
  title: string;
  notes: string | null;
  clay_id: string;
  created_at: string;
  updated_at: string;
  clay: {
    clay_body: string;
  } | null;
};

type ProjectPhotoRow = {
  id: string;
  project_id: string;
  storage_path: string;
  created_at: string;
};

type ActivityPhotoRow = {
  id: string;
  activity_id: string;
  project_id: string;
  storage_path: string;
  created_at: string;
};

type ActivityRow = {
  id: string;
  project_id: string;
  type: "glaze" | "fire";
  glaze_id: string | null;
  coats: number | null;
  cone: string | null;
  notes: string | null;
  created_at: string;
  glaze: { glaze_name: string } | null;
  coneRef: { cone: string; temperature: string } | null;
};

type ActivitySelectRow =
  | ActivityRow
  | (Omit<ActivityRow, "glaze" | "coneRef"> & { glaze: ActivityRow["glaze"][]; coneRef: ActivityRow["coneRef"][] });

type ProjectSelectRow =
  | (ProjectRow & { clay: ProjectRow["clay"] })
  | (ProjectRow & { clay: ProjectRow["clay"][] });

type ClayRow = {
  id: string;
  clay_body: string;
};

async function fetchPotteryProjects(): Promise<{ projects: PotteryProject[]; error?: string }> {
  try {
    noStore();

    const supabase = getSupabaseAnonClient();
    const storageClient = getSupabaseServiceRoleClient();
    const bucket = process.env.SUPABASE_STORAGE_BUCKET || "attachments";

    const { data: projectRows, error: projectError } = await supabase
      .from("Projects")
      .select(
        `
        id,
        title,
        notes,
        clay_id,
        created_at,
        updated_at,
        clay:Clays ( clay_body )
      `,
      )
      .eq("archived", false)
      .order("updated_at", { ascending: false });

    if (projectError) {
      return { projects: [], error: "Unable to load projects from Supabase. Check table permissions and data." };
    }

    const selectRows = (projectRows ?? []) as ProjectSelectRow[];

    const typedProjects: ProjectRow[] = selectRows.map((row) => {
      const clay = Array.isArray(row.clay) ? row.clay[0] ?? null : row.clay ?? null;

      return {
        id: row.id,
        title: row.title,
        notes: row.notes,
        clay_id: row.clay_id,
        created_at: row.created_at,
        updated_at: row.updated_at,
        clay,
      };
    });

    if (!typedProjects.length) {
      return { projects: [] };
    }

    const projectIds = typedProjects.map((project) => project.id);

    const [{ data: projectPhotoRows, error: projectPhotoError }, { data: activityRows, error: activityError }] =
      await Promise.all([
        supabase
          .from("ProjectPhotos")
          .select("id, project_id, storage_path, created_at")
          .eq("archived", false)
          .in("project_id", projectIds)
          .order("created_at", { ascending: true }),
        supabase
          .from("Activities")
          .select(
            `
            id,
            project_id,
            type,
            glaze_id,
            coats,
            cone,
            notes,
            created_at,
            glaze:Glazes ( glaze_name ),
            coneRef:Cones ( cone, temperature )
          `,
          )
          .eq("archived", false)
          .in("project_id", projectIds)
          .order("created_at", { ascending: true }),
      ]);

    if (projectPhotoError || activityError) {
      return { projects: [], error: "Failed to load related project details. Verify ProjectPhotos and Activities data." };
    }

    const selectActivities = (activityRows ?? []) as ActivitySelectRow[];

    const typedActivities: ActivityRow[] = selectActivities.map((activity) => {
      const glaze = Array.isArray(activity.glaze) ? activity.glaze[0] ?? null : activity.glaze ?? null;
      const coneRef = Array.isArray(activity.coneRef) ? activity.coneRef[0] ?? null : activity.coneRef ?? null;

      return {
        id: activity.id,
        project_id: activity.project_id,
        type: activity.type,
        glaze_id: activity.glaze_id,
        coats: activity.coats,
        cone: activity.cone,
        notes: activity.notes,
        created_at: activity.created_at,
        glaze,
        coneRef,
      };
    });

    const activityIds = typedActivities.map((activity) => activity.id);

    const { data: activityPhotoRows, error: activityPhotoError } = activityIds.length
      ? await supabase
          .from("ActivityPhotos")
          .select("id, activity_id, project_id, storage_path, created_at")
          .eq("archived", false)
          .in("activity_id", activityIds)
          .order("created_at", { ascending: true })
      : { data: [] as ActivityPhotoRow[], error: null };

    if (activityPhotoError) {
      return { projects: [], error: "Failed to load activity photos. Confirm ActivityPhotos is accessible." };
    }

    const allPhotoRows = [...((projectPhotoRows as ProjectPhotoRow[]) || []), ...((activityPhotoRows as ActivityPhotoRow[]) || [])];
    const storagePaths = Array.from(new Set(allPhotoRows.map((row) => row.storage_path)));

    const { data: signedUrls, error: signedUrlError } = storagePaths.length
      ? await storageClient.storage.from(bucket).createSignedUrls(storagePaths, 60 * 60 * 24 * 7)
      : { data: null, error: null };

    if (signedUrlError) {
      return { projects: [], error: "Failed to generate photo links. Check Supabase storage permissions." };
    }

    const signedUrlLookup = new Map<string, string | null>();
    (signedUrls ?? []).forEach((signedUrl) => {
      if (!signedUrl?.path) return;
      signedUrlLookup.set(signedUrl.path, signedUrl.signedUrl ?? null);
    });

    const toPhoto = (row: ProjectPhotoRow | ActivityPhotoRow) => {
      const signedUrl = signedUrlLookup.get(row.storage_path) || null;
      const { data } = storageClient.storage.from(bucket).getPublicUrl(row.storage_path);
      return {
        id: row.id,
        storagePath: row.storage_path,
        url: signedUrl || data.publicUrl,
        createdAt: row.created_at,
      };
    };

    const projectPhotosByProject = new Map<string, ReturnType<typeof toPhoto>[]>();
    ((projectPhotoRows as ProjectPhotoRow[]) || []).forEach((row) => {
      const photos = projectPhotosByProject.get(row.project_id) || [];
      photos.push(toPhoto(row));
      projectPhotosByProject.set(row.project_id, photos);
    });

    const activityPhotosByActivity = new Map<string, ReturnType<typeof toPhoto>[]>();
    ((activityPhotoRows as ActivityPhotoRow[]) || []).forEach((row) => {
      const photos = activityPhotosByActivity.get(row.activity_id) || [];
      photos.push(toPhoto(row));
      activityPhotosByActivity.set(row.activity_id, photos);
    });

    const activitiesByProject = new Map<string, ActivityRow[]>();
    typedActivities.forEach((activity) => {
      const list = activitiesByProject.get(activity.project_id) || [];
      list.push(activity);
      activitiesByProject.set(activity.project_id, list);
    });

    const projects: PotteryProject[] = typedProjects.map((project) => {
      const projectPhotos = projectPhotosByProject.get(project.id) || [];
      const activitiesForProject = activitiesByProject.get(project.id) || [];

      const activities = activitiesForProject.map((activity) => ({
        id: activity.id,
        type: activity.type,
        notes: activity.notes,
        glazeName: activity.glaze?.glaze_name || undefined,
        coats: activity.coats,
        cone: activity.cone,
        coneTemperature: activity.coneRef?.temperature || null,
        createdAt: activity.created_at,
        photos: activityPhotosByActivity.get(activity.id) || [],
      }));

      const glazesUsed = Array.from(
        new Set(
          activities
            .filter((activity) => activity.type === "glaze" && activity.glazeName)
            .map((activity) => activity.glazeName as string),
        ),
      );

      const thumbnailUrl = projectPhotos[0]?.url ?? null;

      return {
        id: project.id,
        title: project.title,
        notes: project.notes,
        clayBody: project.clay?.clay_body || "Unknown clay body",
        createdAt: project.created_at,
        updatedAt: project.updated_at,
        thumbnailUrl,
        glazesUsed,
        projectPhotos,
        activities,
      };
    });

    return { projects };
  } catch (cause) {
    console.error("Failed to load pottery projects from Supabase", cause);
    return {
      projects: [],
      error: "Unable to load pottery projects. Verify NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    };
  }
}

async function fetchActiveClays(): Promise<{ clays: { id: string; name: string }[]; error?: string }> {
  try {
    const supabase = getSupabaseAnonClient();
    const { data, error } = await supabase
      .from("Clays")
      .select("id, clay_body")
      .eq("status", "active")
      .order("clay_body", { ascending: true });

    if (error) {
      return { clays: [], error: "Unable to load clays." };
    }

    const clays = (data as ClayRow[] | null)?.map((clay) => ({ id: clay.id, name: clay.clay_body })) ?? [];
    return { clays };
  } catch {
    return { clays: [], error: "Unable to load clays." };
  }
}
