import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { ensureStorageBucketExists, getSupabaseServiceRoleClient } from "@/lib/storage";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "You must be signed in to log an activity." }, { status: 401 });
    }

    const clerk = await clerkClient();
    const clerkUser = await clerk.users.getUser(userId);
    const email = clerkUser.emailAddresses.find((address) => address.id === clerkUser.primaryEmailAddressId)?.emailAddress;

    if (!email) {
      return NextResponse.json(
        { error: "Unable to save activity. Your account is missing a primary email address in Clerk." },
        { status: 400 },
      );
    }

    const formData = await request.formData();
    const projectId = (formData.get("projectId") as string | null)?.trim();
    const type = (formData.get("type") as string | null)?.trim() as "glaze" | "fire" | null;
    const glazeId = (formData.get("glazeId") as string | null)?.trim() || null;
    const coatsRaw = (formData.get("coats") as string | null)?.trim();
    const cone = (formData.get("cone") as string | null)?.trim() || null;
    const notes = (formData.get("notes") as string | null)?.trim() || null;
    const photos = formData.getAll("photos").filter((file): file is File => file instanceof File && file.size > 0);

    const coats = coatsRaw ? Number.parseInt(coatsRaw, 10) : null;

    if (!projectId) {
      return NextResponse.json({ error: "A project is required to log an activity." }, { status: 400 });
    }

    if (type !== "glaze" && type !== "fire") {
      return NextResponse.json({ error: "Activity type must be glaze or fire." }, { status: 400 });
    }

    if (type === "glaze" && (!glazeId || coats === null || Number.isNaN(coats) || coats <= 0)) {
      return NextResponse.json({ error: "Glaze and layers are required for glaze activities." }, { status: 400 });
    }

    if (type === "fire" && !cone) {
      return NextResponse.json({ error: "Cone is required for firing activities." }, { status: 400 });
    }

    const supabase = getSupabaseServiceRoleClient();
    const bucket = await ensureStorageBucketExists(process.env.SUPABASE_STORAGE_BUCKET || "attachments");

    const { data: existingUsers, error: listUsersError } = await supabase.auth.admin.listUsers();

    if (listUsersError) {
      console.error("Supabase auth user lookup by email failed", listUsersError);
      return NextResponse.json(
        { error: "Unable to save activity because Supabase user lookup failed. Try again or contact support." },
        { status: 500 },
      );
    }

    const matchedUser = existingUsers?.users?.find(
      (user) => user.email?.toLowerCase() === email.toLowerCase(),
    );

    let supabaseUserId = matchedUser?.id;

    if (!supabaseUserId) {
      const { data: createdUser, error: createUserError } = await supabase.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: {
          clerkUserId: userId,
          name: clerkUser.fullName || undefined,
        },
      });

      if (createUserError || !createdUser?.user) {
        console.error("Supabase auth user creation failed", createUserError);
        return NextResponse.json(
          {
            error:
              "Unable to save activity because a Supabase user could not be provisioned for your account. Please check Supabase auth settings.",
          },
          { status: 500 },
        );
      }

      supabaseUserId = createdUser.user.id;
    }

    const { data: activityInsert, error: activityError } = await supabase
      .from("Activities")
      .insert({
        project_id: projectId,
        user_id: supabaseUserId,
        type,
        glaze_id: type === "glaze" ? glazeId : null,
        coats: type === "glaze" ? coats : null,
        cone: type === "fire" ? cone : null,
        notes,
      })
      .select("id, created_at")
      .single();

    if (activityError || !activityInsert) {
      console.error("Pottery activity insert failed", activityError);
      return NextResponse.json(
        { error: "Unable to save activity. Check Supabase table permissions and try again." },
        { status: 500 },
      );
    }

    const activityId = activityInsert.id as string;
    const uploadedPhotos: { storage_path: string }[] = [];

    for (const file of photos) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const extension = file.name.includes(".") ? file.name.split(".").pop() : "jpg";
      const storagePath = `${projectId}/${activityId}/${crypto.randomUUID()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(storagePath, buffer, { contentType: file.type || "image/jpeg", upsert: false });

      if (uploadError) {
        console.error("Pottery activity photo upload failed", uploadError);
        return NextResponse.json(
          { error: "Failed to upload activity photo. Confirm the storage bucket exists and credentials are valid." },
          { status: 500 },
        );
      }

      uploadedPhotos.push({ storage_path: storagePath });
    }

    let photoRows: { id: string; storage_path: string; created_at: string }[] = [];

    if (uploadedPhotos.length) {
      const { data: insertedPhotos, error: photoInsertError } = await supabase
        .from("ActivityPhotos")
        .insert(
          uploadedPhotos.map((photo) => ({
            activity_id: activityId,
            project_id: projectId,
            storage_path: photo.storage_path,
          })),
        )
        .select("id, storage_path, created_at");

      if (photoInsertError) {
        console.error("Pottery activity photo insert failed", photoInsertError);
        return NextResponse.json(
          { error: "Failed to save activity photo references. Check ActivityPhotos permissions." },
          { status: 500 },
        );
      }

      photoRows = insertedPhotos ?? [];
    }

    // Keep project cards ordered by recency.
    const now = new Date().toISOString();
    await supabase.from("Projects").update({ updated_at: now }).eq("id", projectId);

    const { data: activityRow, error: fetchActivityError } = await supabase
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
      .eq("id", activityId)
      .single();

    if (fetchActivityError || !activityRow) {
      console.error("Failed to read back activity", fetchActivityError);
      return NextResponse.json(
        { error: "Activity saved, but failed to load details. Refresh to see the log." },
        { status: 500 },
      );
    }

    const storagePaths = photoRows.map((row) => row.storage_path);
    const signedUrlLookup = new Map<string, string | null>();

    if (storagePaths.length) {
      await Promise.all(
        storagePaths.map(async (path) => {
          const needsTransform = [".heic", ".heif", ".hevc", ".heix", ".heifs"].some((ext) =>
            path.toLowerCase().endsWith(ext),
          );

          const { data, error } = await supabase.storage
            .from(bucket)
            .createSignedUrl(
              path,
              60 * 60 * 24 * 7,
              needsTransform ? { transform: { format: "webp" } } : undefined,
            );

          if (error || !data?.signedUrl) {
            console.error("Failed to generate activity photo URL", { path, error });
            signedUrlLookup.set(path, null);
            return;
          }

          signedUrlLookup.set(path, data.signedUrl);
        }),
      );
    }

    const toPhoto = (row: (typeof photoRows)[number]) => {
      const needsTransform = [".heic", ".heif", ".hevc", ".heix", ".heifs"].some((ext) =>
        row.storage_path.toLowerCase().endsWith(ext),
      );
      const signedUrl = signedUrlLookup.get(row.storage_path) || null;
      const { data: publicUrlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(row.storage_path, needsTransform ? { transform: { format: "webp" } } : undefined);
      return {
        id: row.id,
        storagePath: row.storage_path,
        url: signedUrl || publicUrlData.publicUrl,
        createdAt: row.created_at,
      };
    };

    const glazeRelation = activityRow.glaze as { glaze_name?: string }[] | { glaze_name?: string } | null | undefined;
    const coneRelation = activityRow.coneRef as
      | { temperature?: number }[]
      | { temperature?: number }
      | null
      | undefined;
    const activity = {
      id: activityRow.id as string,
      type: activityRow.type as "glaze" | "fire",
      notes: (activityRow.notes as string | null) ?? null,
      glazeName: Array.isArray(glazeRelation)
        ? glazeRelation[0]?.glaze_name || undefined
        : glazeRelation?.glaze_name || undefined,
      coats: activityRow.coats as number | null,
      cone: activityRow.cone as string | null,
      coneTemperature: Array.isArray(coneRelation)
        ? coneRelation[0]?.temperature || null
        : coneRelation?.temperature || null,
      createdAt: activityRow.created_at as string,
      photos: photoRows.map(toPhoto),
    };

    revalidatePath("/pottery");

    return NextResponse.json({ activity }, { status: 201 });
  } catch (error) {
    console.error("Unexpected error creating pottery activity", error);
    return NextResponse.json(
      { error: "Unexpected error creating activity. Verify Supabase environment variables and try again." },
      { status: 500 },
    );
  }
}
