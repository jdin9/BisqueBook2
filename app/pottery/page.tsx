import type { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateProjectDialog, type CreateProjectState } from "@/components/pottery/create-project-dialog";
import { getCurrentUserProfile } from "@/lib/auth";
import { getPrismaClient, isDatabaseConfigured } from "@/lib/prisma";

async function fetchProjectLog() {
  if (!isDatabaseConfigured()) {
    return {
      projects: [],
      error: "Database connection is not configured. Set DATABASE_URL to view pottery projects.",
    };
  }

  try {
    const prisma = getPrismaClient();
    const projects = await prisma.project.findMany({
      include: {
        studio: true,
        clay: true,
        glaze: true,
        createdBy: true,
        firings: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return { projects };
  } catch (error) {
    console.error("Failed to load pottery projects", error);
    return {
      projects: [],
      error: "Unable to load pottery projects. Verify the database connection.",
    };
  }
}

type ProjectLogResult = Awaited<ReturnType<typeof fetchProjectLog>>;
type ProjectWithRelations = ProjectLogResult["projects"][number];

type ClayOption = {
  id: string;
  name: string;
};

type ClayFetchResult = {
  clays: ClayOption[];
  clayError?: string;
};

async function fetchActiveClays(studioId: string | null): Promise<ClayFetchResult> {
  if (!isDatabaseConfigured() || !studioId) return { clays: [], clayError: undefined };

  const prisma = getPrismaClient();
  try {
    const activeClayWhere = { studioId, isActive: true } as Prisma.ClayWhereInput;
    const clays = await prisma.clay.findMany({
      where: activeClayWhere,
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    });

    return { clays };
  } catch (error) {
    console.error("Failed to load active clays with isActive filter; falling back", error);
    try {
      const fallbackClayWhere = { studioId } as Prisma.ClayWhereInput;
      const clays = await prisma.clay.findMany({
        where: fallbackClayWhere,
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      });
      return {
        clays,
        clayError: "Active-clay filter unavailable; showing all clays. Run latest migrations to enable filtering.",
      };
    } catch (innerError) {
      console.error("Failed to load clays", innerError);
      return { clays: [], clayError: "Unable to load clay list right now." };
    }
  }
}

function buildStudioSummaries(projects: ProjectLogResult["projects"]) {
  type StudioAccumulator = {
    studioId: string;
    studioName: string;
    totalProjects: number;
    clayNames: Set<string>;
    glazeNames: Set<string>;
    creators: Set<string>;
    latestProjectAt: Date | null;
  };

  const summaries = new Map<string, StudioAccumulator>();

  for (const project of projects) {
    const summary =
      summaries.get(project.studioId) ||
      ({
        studioId: project.studioId,
        studioName: project.studio.name,
        totalProjects: 0,
        clayNames: new Set<string>(),
        glazeNames: new Set<string>(),
        creators: new Set<string>(),
        latestProjectAt: null,
      } satisfies StudioAccumulator);

    summary.totalProjects += 1;
    if (project.clay?.name) summary.clayNames.add(project.clay.name);
    if (project.glaze?.name) summary.glazeNames.add(project.glaze.name);
    if (project.createdBy?.id) summary.creators.add(project.createdBy.id);
    summary.latestProjectAt =
      !summary.latestProjectAt || project.createdAt > summary.latestProjectAt
        ? project.createdAt
        : summary.latestProjectAt;

    summaries.set(project.studioId, summary);
  }

  return Array.from(summaries.values()).map((summary) => ({
    studioId: summary.studioId,
    studioName: summary.studioName,
    totalProjects: summary.totalProjects,
    clayCount: summary.clayNames.size,
    glazeCount: summary.glazeNames.size,
    distinctCreators: summary.creators.size,
    latestProjectAt: summary.latestProjectAt,
  }));
}

function formatDate(date: Date | null) {
  if (!date) return "Not recorded";

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

async function createProjectAction(prevState: CreateProjectState, formData: FormData): Promise<CreateProjectState> {
  "use server";

  if (!isDatabaseConfigured()) {
    return { status: "error", message: "Database connection is not configured." };
  }

  const profile = await getCurrentUserProfile();

  if (!profile) {
    return { status: "error", message: "Sign in to create a project." };
  }

  if (!profile.studioId) {
    return { status: "error", message: "Join a studio to log a project." };
  }

  const title = (formData.get("title") as string | null)?.trim();
  const notes = (formData.get("notes") as string | null)?.trim();
  const clayId = (formData.get("clayId") as string | null)?.trim() || null;

  if (!title) {
    return { status: "error", message: "Title is required." };
  }

  const prisma = getPrismaClient();

  try {
    if (clayId) {
      const clay = await prisma.clay.findFirst({
        where: { id: clayId, studioId: profile.studioId, isActive: true },
        select: { id: true },
      });

      if (!clay) {
        return { status: "error", message: "Selected clay is not available for your studio." };
      }
    }

    await prisma.project.create({
      data: {
        studioId: profile.studioId,
        name: title,
        description: notes || null,
        clayId,
        createdById: profile.id,
      },
    });
  } catch (error) {
    console.error("Failed to create project", error);
    return { status: "error", message: "Unable to save project. Run migrations and try again." };
  }

  revalidatePath("/pottery");

  return { status: "success", message: "Project added to the log." };
}

function ProjectDetails({ project }: { project: ProjectWithRelations }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-lg">{project.name}</CardTitle>
          <span className="text-xs text-muted-foreground">{formatDate(project.createdAt)}</span>
        </div>
        <CardDescription>{project.description || "No description recorded for this project."}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <div className="flex flex-wrap gap-2 text-foreground">
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            Studio: {project.studio.name}
          </span>
          {project.clay?.name && (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
              Clay: {project.clay.name}
            </span>
          )}
          {project.glaze?.name && (
            <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-800">
              Glaze: {project.glaze.name}
            </span>
          )}
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800">
            Firings recorded: {project.firings.length}
          </span>
        </div>
        <div className="grid gap-2 text-foreground sm:grid-cols-2">
          <div className="space-y-1">
            <p className="text-xs uppercase text-muted-foreground">Created by</p>
            <p className="text-sm font-medium">
              {project.createdBy?.name ||
                project.createdBy?.email ||
                project.createdBy?.userId ||
                "Creator not specified"}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs uppercase text-muted-foreground">Studio ID</p>
            <p className="text-sm font-medium">{project.studioId}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default async function PotteryPage() {
  const profile = await getCurrentUserProfile();
  const { projects, error } = await fetchProjectLog();
  const clayResult = profile ? await fetchActiveClays(profile.studioId) : { clays: [], clayError: undefined };
  const clays: ClayOption[] = clayResult.clays;
  const makerName = profile?.name || null;
  const canSubmit = Boolean(profile && profile.studioId && isDatabaseConfigured());
  const unavailableReason = !isDatabaseConfigured()
    ? "Add DATABASE_URL to enable project creation."
    : !profile
      ? "Sign in to add projects."
      : !profile.studioId
        ? "Join a studio to add projects."
        : undefined;

  const studioSummaries = buildStudioSummaries(projects);

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
            clays={clays}
            makerName={makerName}
            canSubmit={canSubmit}
            unavailableReason={unavailableReason}
          />
        </div>
        <p className="text-muted-foreground">
          Track every project from every studio and see how makers are using clay bodies, glazes, and kilns over time.
        </p>
        {clayResult.clayError && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            {clayResult.clayError}
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {error}
        </div>
      )}

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-semibold">Project log</h2>
            <p className="text-sm text-muted-foreground">
              Chronological record of all projects created by members across every studio.
            </p>
          </div>
          <span className="text-sm text-muted-foreground">
            {projects.length} {projects.length === 1 ? "project" : "projects"}
          </span>
        </div>
        <div className="grid gap-4">
          {projects.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>No projects available</CardTitle>
                <CardDescription>
                  Projects will appear here as soon as makers create them in their studios.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            projects.map((project) => <ProjectDetails key={project.id} project={project} />)
          )}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-semibold">Studios overview</h2>
            <p className="text-sm text-muted-foreground">
              See how each studio is contributing to the pottery log and which materials they are using most.
            </p>
          </div>
          <span className="text-sm text-muted-foreground">
            {studioSummaries.length} {studioSummaries.length === 1 ? "studio" : "studios"}
          </span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {studioSummaries.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>No studio activity yet</CardTitle>
                <CardDescription>When studios start projects, their summaries will appear here.</CardDescription>
              </CardHeader>
            </Card>
          ) : (
            studioSummaries.map((summary) => (
              <Card key={summary.studioId}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{summary.studioName}</CardTitle>
                  <CardDescription>Studio ID: {summary.studioId}</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 text-sm text-foreground">
                  <div className="flex items-center justify-between rounded-lg bg-primary/5 px-3 py-2">
                    <span className="text-muted-foreground">Projects logged</span>
                    <span className="text-base font-semibold text-primary">{summary.totalProjects}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2">
                      <p className="text-xs text-amber-800">Clay varieties</p>
                      <p className="text-base font-semibold text-amber-900">{summary.clayCount}</p>
                    </div>
                    <div className="rounded-lg border border-sky-100 bg-sky-50 px-3 py-2">
                      <p className="text-xs text-sky-800">Glaze varieties</p>
                      <p className="text-base font-semibold text-sky-900">{summary.glazeCount}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2">
                    <span className="text-xs uppercase text-emerald-800">Distinct creators</span>
                    <span className="text-base font-semibold text-emerald-900">{summary.distinctCreators}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-muted/30 px-3 py-2">
                    <span className="text-xs uppercase text-muted-foreground">Latest project</span>
                    <span className="text-sm font-medium">{formatDate(summary.latestProjectAt)}</span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
