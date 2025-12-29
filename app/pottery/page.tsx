import { clerkClient, currentUser } from "@clerk/nextjs/server";
import { unstable_noStore as noStore } from "next/cache";
import { type PotteryConeOption, type PotteryGlazeFilterOption, type PotteryGlazeOption, type PotteryProject } from "@/components/pottery/types";
import { getSupabaseAnonClient, getSupabaseServiceRoleClient } from "@/lib/storage";
import { PotteryPageClient } from "@/components/pottery/pottery-page-client";
import { WelcomeModal } from "@/components/welcome-modal";
import { requireStudioMembership } from "@/lib/studio/access";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function PotteryPage() {
  await requireStudioMembership({ returnBackUrl: "/pottery", redirectPath: "/join" });

  const { activeClays, allClays } = await fetchClays();
  const { activeGlazes, allGlazes, error: glazeError } = await fetchGlazesWithStatus();
  const { cones, error: coneError } = await fetchCones();
  const user = await currentUser();
  const safeUsername = user?.username && !user.username.includes("@") ? user.username : undefined;
  const makerName = user
    ? user.primaryEmailAddress?.emailAddress ||
      user.emailAddresses?.[0]?.emailAddress ||
      user.fullName ||
      [user.firstName, user.lastName].filter(Boolean).join(" ") ||
      safeUsername ||
      null
    : null;
  const { projects, error } = await fetchPotteryProjects({
    clerkUserId: user?.id ?? null,
    makerName,
  });
  const errors = [error, glazeError, coneError].filter((value): value is string => Boolean(value));

  return (
    <div className="space-y-8">
      <WelcomeModal />
      <PotteryPageClient
        projects={projects}
        activeGlazes={activeGlazes}
        allGlazes={allGlazes}
        cones={cones}
        clays={activeClays}
        allClays={allClays}
        makerName={makerName}
        errors={errors}
      />
    </div>
  );
}

type ProjectRow = {
  id: string;
  title: string;
  notes: string | null;
  clay_id: string;
  user_id: string;
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
  status: string | null;
};

type GlazeRow = {
  id: string;
  glaze_name: string;
  brand: string;
  status: string | null;
};

type ConeRow = {
  cone: string;
  temperature: string;
};

type CurrentMaker = {
  clerkUserId: string | null;
  makerName: string | null;
};

async function fetchPotteryProjects(currentMaker: CurrentMaker): Promise<{ projects: PotteryProject[]; error?: string }> {
  try {
    noStore();

    const supabase = getSupabaseAnonClient();
    const storageClient = getSupabaseServiceRoleClient();
    const bucket = process.env.SUPABASE_STORAGE_BUCKET || "attachments";
    const clerk = await clerkClient();

    const { data: projectRows, error: projectError } = await supabase
      .from("Projects")
      .select(
        `
        id,
        title,
        notes,
        clay_id,
        user_id,
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
        user_id: row.user_id,
        created_at: row.created_at,
        updated_at: row.updated_at,
        clay,
      };
    });

    if (!typedProjects.length) {
      return { projects: [] };
    }

    const projectIds = typedProjects.map((project) => project.id);
    const makerIds = Array.from(new Set(typedProjects.map((project) => project.user_id)));
    const makerLookup = new Map<string, string>();

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

    if (makerIds.length) {
      await Promise.all(
        makerIds.map(async (makerId) => {
          if (makerLookup.has(makerId)) {
            return;
          }

          try {
            const { data, error } = await storageClient.auth.admin.getUserById(makerId);

            if (error || !data?.user) {
              console.error("Unable to load maker name", { makerId, error });
              return;
            }

            const metadata = data.user.user_metadata as Record<string, unknown> | null;
            const firstName = metadata && typeof metadata.first_name === "string" ? metadata.first_name : undefined;
            const lastName = metadata && typeof metadata.last_name === "string" ? metadata.last_name : undefined;
            const fullNameFromParts = [firstName, lastName].filter(Boolean).join(" ").trim();
            const clerkUserId = metadata && typeof metadata.clerkUserId === "string" ? metadata.clerkUserId : undefined;

            let name: string | undefined = typeof data.user.email === "string" ? data.user.email : undefined;

            if (clerkUserId && currentMaker.clerkUserId && clerkUserId === currentMaker.clerkUserId) {
              name = currentMaker.makerName ?? undefined;
            }

            if (clerkUserId && currentMaker.clerkUserId && clerkUserId === currentMaker.clerkUserId) {
              name = currentMaker.makerName ?? undefined;
            }

            if (clerkUserId) {
              try {
                const clerkUser = await clerk.users.getUser(clerkUserId);
                const safeClerkUsername =
                  clerkUser.username && !clerkUser.username.includes("@") ? clerkUser.username : undefined;
                name =
                  [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ").trim() ||
                  clerkUser.fullName ||
                  safeClerkUsername ||
                  undefined;
              } catch (clerkError) {
                console.error("Unable to load maker name from Clerk", { makerId, clerkUserId, error: clerkError });
              }
            }

            if (!name) {
              name =
                fullNameFromParts ||
                (metadata && typeof metadata.email === "string" ? metadata.email : undefined) ||
                (metadata && typeof metadata.full_name === "string" ? metadata.full_name : undefined) ||
                (metadata && typeof metadata.name === "string" ? metadata.name : undefined) ||
                undefined;
            }

            makerLookup.set(makerId, name || "Unknown maker");
          } catch (lookupError) {
            console.error("Unexpected maker lookup failure", lookupError);
          }
        }),
      );
    }

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

    const signedUrlLookup = new Map<string, string | null>();
    type SignedUrlOptions = { download?: string | boolean; transform?: { width?: number; height?: number; resize?: "cover" | "contain" | "fill"; quality?: number; format?: "origin" } };
    const heicTransform: SignedUrlOptions = { transform: { quality: 90 } };

    if (storagePaths.length) {
      await Promise.all(
        storagePaths.map(async (path) => {
          const needsTransform = [".heic", ".heif", ".hevc", ".heix", ".heifs"].some((ext) =>
            path.toLowerCase().endsWith(ext),
          );

          const { data, error } = await storageClient.storage
            .from(bucket)
            .createSignedUrl(path, 60 * 60 * 24 * 7, needsTransform ? heicTransform : undefined);

          if (error || !data?.signedUrl) {
            console.error("Failed to sign pottery photo", { path, error });
            signedUrlLookup.set(path, null);
            return;
          }

          signedUrlLookup.set(path, data.signedUrl);
        }),
      );
    }

    const toPhoto = (row: ProjectPhotoRow | ActivityPhotoRow) => {
      const needsTransform = [".heic", ".heif", ".hevc", ".heix", ".heifs"].some((ext) =>
        row.storage_path.toLowerCase().endsWith(ext),
      );
      const signedUrl = signedUrlLookup.get(row.storage_path) || null;
      const { data } = storageClient.storage
        .from(bucket)
        .getPublicUrl(row.storage_path, needsTransform ? heicTransform : undefined);
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
        glazeId: activity.glaze_id,
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

      const glazeIdsUsed = Array.from(
        new Set(
          activities
            .filter((activity) => activity.type === "glaze" && activity.glazeId)
            .map((activity) => activity.glazeId as string),
        ),
      );

      const thumbnailUrl = projectPhotos[0]?.url ?? null;

      return {
        id: project.id,
        title: project.title,
        notes: project.notes,
        clayId: project.clay_id,
        clayBody: project.clay?.clay_body || "Unknown clay body",
        makerId: project.user_id,
        makerName: makerLookup.get(project.user_id) || "Unknown maker",
        createdAt: project.created_at,
        updatedAt: project.updated_at,
        thumbnailUrl,
        glazesUsed,
        glazeIdsUsed,
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

async function fetchClays(): Promise<{ activeClays: { id: string; name: string }[]; allClays: { id: string; name: string; status?: string | null }[]; error?: string }> {
  try {
    const supabase = getSupabaseAnonClient();
    const { data, error } = await supabase.from("Clays").select("id, clay_body, status").order("clay_body", { ascending: true });

    if (error) {
      return { activeClays: [], allClays: [], error: "Unable to load clays." };
    }

    const allClays =
      (data as ClayRow[] | null)?.map((clay) => ({ id: clay.id, name: clay.clay_body, status: clay.status })) ?? [];
    const activeClays = allClays.filter((clay) => clay.status === "active");
    return { activeClays, allClays };
  } catch {
    return { activeClays: [], allClays: [], error: "Unable to load clays." };
  }
}

async function fetchGlazesWithStatus(): Promise<{ activeGlazes: PotteryGlazeOption[]; allGlazes: PotteryGlazeFilterOption[]; error?: string }> {
  try {
    const supabase = getSupabaseAnonClient();
    const { data, error } = await supabase
      .from("Glazes")
      .select("id, glaze_name, brand, status")
      .order("glaze_name", { ascending: true });

    if (error) {
      return { activeGlazes: [], allGlazes: [], error: "Unable to load glazes." };
    }

    const glazes =
      (data as GlazeRow[] | null)?.map((glaze) => ({
        id: glaze.id,
        name: glaze.glaze_name,
        brand: glaze.brand,
        status: glaze.status,
      })) ?? [];

    const activeGlazes = glazes.filter((glaze) => glaze.status === "active");

    return { activeGlazes, allGlazes: glazes };
  } catch {
    return { activeGlazes: [], allGlazes: [], error: "Unable to load glazes." };
  }
}

async function fetchCones(): Promise<{ cones: PotteryConeOption[]; error?: string }> {
  try {
    const supabase = getSupabaseAnonClient();
    const { data, error } = await supabase.from("Cones").select("cone, temperature").order("cone", { ascending: true });

    if (error) {
      return { cones: [], error: "Unable to load cones." };
    }

    const cones = (data as ConeRow[] | null)?.map((cone) => ({ cone: cone.cone, temperature: cone.temperature })) ?? [];
    return { cones };
  } catch {
    return { cones: [], error: "Unable to load cones." };
  }
}
