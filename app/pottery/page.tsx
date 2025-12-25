import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CreateProjectDialog,
  type ClayOption,
  type CreateProjectState,
  type MakerOption,
} from "@/components/pottery/create-project-dialog";
import { PotteryGallery } from "@/components/pottery/pottery-gallery";
import { type PotteryProject } from "@/components/pottery/types";
import { ensureStorageBucketExists, getSupabaseAnonClient, getSupabaseServiceRoleClient } from "@/lib/storage";

export default async function PotteryPage() {
  const [{ projects, error }, formOptions] = await Promise.all([fetchPotteryProjects(), fetchProjectFormOptions()]);

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">Community-wide record</p>
            <h1 className="text-3xl font-semibold">Pottery projects</h1>
          </div>
          <CreateProjectDialog
            action={createProjectAction}
            clays={formOptions.clays}
            makers={formOptions.makers}
            canSubmit={formOptions.canSubmit}
            unavailableReason={formOptions.unavailableReason}
          />
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

async function fetchProjectFormOptions(): Promise<{
  clays: ClayOption[];
  makers: MakerOption[];
  canSubmit: boolean;
  unavailableReason?: string;
}> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return {
      clays: [],
      makers: [],
      canSubmit: false,
      unavailableReason: "Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to create projects.",
    };
  }

  try {
    const supabase = getSupabaseServiceRoleClient();
    const [{ data: clayRows, error: clayError }, usersResult] = await Promise.all([
      supabase.from("Clays").select("id, clay_body, status").eq("status", "active").order("clay_body", {
        ascending: true,
      }),
      supabase.auth.admin.listUsers({ page: 1, perPage: 100 }),
    ]);

    const clays: ClayOption[] = (clayRows ?? []).map((clay) => ({
      id: clay.id,
      name: clay.clay_body,
    }));

    const makers: MakerOption[] = (usersResult.data?.users ?? []).map((user) => {
      const metadata = (user.user_metadata ?? {}) as { first_name?: string; last_name?: string; full_name?: string };
      const combinedName = [metadata.first_name, metadata.last_name].filter(Boolean).join(" ").trim();
      const fullName = metadata.full_name || combinedName || user.email_addresses?.[0]?.email_address || "Unknown user";

      return {
        id: user.id,
        name: fullName,
      };
    });

    let unavailableReason: string | undefined;
    if (clayError) {
      unavailableReason = "Unable to load clay options. Confirm the Clays table exists and allows reads.";
    }
    if (usersResult.error) {
      unavailableReason = "Unable to load makers from Supabase auth.";
    }

    const canSubmit = clays.length > 0 && makers.length > 0 && !clayError && !usersResult.error;

    if (!canSubmit && !unavailableReason) {
      if (!clays.length) {
        unavailableReason = "Add an active clay body in Supabase to create a project.";
      } else if (!makers.length) {
        unavailableReason = "Add makers with first and last names in Supabase auth.";
      }
    }

    return { clays, makers, canSubmit, unavailableReason };
  } catch (cause) {
    console.error("Failed to load project form options from Supabase", cause);
    return {
      clays: [],
      makers: [],
      canSubmit: false,
      unavailableReason: "Unable to load project form options. Check Supabase credentials and network access.",
    };
  }
}

async function fetchPotteryProjects(): Promise<{ projects: PotteryProject[]; error?: string }> {
  try {
    const supabase = getSupabaseAnonClient();
    const bucket = "attachments";

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

    const toPhoto = (row: ProjectPhotoRow | ActivityPhotoRow) => {
      const { data } = supabase.storage.from(bucket).getPublicUrl(row.storage_path);
      return {
        id: row.id,
        storagePath: row.storage_path,
        url: data.publicUrl,
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

async function createProjectAction(_: CreateProjectState, formData: FormData): Promise<CreateProjectState> {
  "use server";

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return {
      status: "error",
      message: "Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to enable project creation.",
    };
  }

  const title = formData.get("title")?.toString().trim() ?? "";
  const clayId = formData.get("clayId")?.toString();
  const makerId = formData.get("makerId")?.toString();
  const notes = formData.get("notes")?.toString().trim() || null;

  if (!title || !clayId || !makerId) {
    return { status: "error", message: "Title, clay body, and maker are required." };
  }

  const photoFiles = formData
    .getAll("photos")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);
  const oversizedPhoto = photoFiles.find((file) => file.size > 5 * 1024 * 1024);
  if (oversizedPhoto) {
    return {
      status: "error",
      message: `${oversizedPhoto.name} exceeds the 5 MB limit. Please choose a smaller photo.`,
    };
  }

  try {
    const supabase = getSupabaseServiceRoleClient();
    const bucket = await ensureStorageBucketExists(process.env.SUPABASE_STORAGE_BUCKET || "attachments");

    const { data: project, error: projectError } = await supabase
      .from("Projects")
      .insert({ title, clay_id: clayId, user_id: makerId, notes })
      .select("id")
      .single();

    if (projectError || !project) {
      console.error("Failed to insert project", projectError);
      return {
        status: "error",
        message: "Unable to save the project. Confirm the Projects table exists and accepts inserts.",
      };
    }

    const photoRows: { project_id: string; storage_path: string }[] = [];

    for (const file of photoFiles) {
      const safeName = (file.name || "upload").replace(/[^\w.-]/g, "_");
      const storagePath = `projects/${project.id}/${randomUUID()}-${safeName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(storagePath, file, {
          contentType: file.type || "application/octet-stream",
        });

      if (uploadError || !uploadData) {
        console.error("Failed to upload project photo", uploadError);
        continue;
      }

      photoRows.push({ project_id: project.id, storage_path: uploadData.path });
    }

    if (photoRows.length > 0) {
      const { error: photoInsertError } = await supabase.from("ProjectPhotos").insert(photoRows);

      if (photoInsertError) {
        console.error("Failed to insert project photos", photoInsertError);
        return {
          status: "error",
          message: "Project saved, but photos could not be linked. Try adding them again.",
        };
      }
    }

    revalidatePath("/pottery");
    return { status: "success", message: "Project saved! Your gallery will refresh with the new entry." };
  } catch (cause) {
    console.error("Failed to create pottery project", cause);
    return {
      status: "error",
      message: "Unable to create the project right now. Check Supabase credentials and try again.",
    };
  }
}
