import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { authorizeStudioMember } from "@/lib/studio/access";
import { ensureStorageBucketExists, getSupabaseServiceRoleClient } from "@/lib/storage";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    const authorization = await authorizeStudioMember({ userId: userId ?? undefined });

    if ("error" in authorization) {
      return NextResponse.json({ error: authorization.error.message }, { status: authorization.error.status });
    }

    const resolvedUserId = userId ?? authorization.profile.userId;
    const clerk = await clerkClient();
    const clerkUser = await clerk.users.getUser(resolvedUserId);
    const email = clerkUser.emailAddresses.find((address) => address.id === clerkUser.primaryEmailAddressId)?.emailAddress;

    if (!email) {
      return NextResponse.json(
        { error: "Unable to save project. Your account is missing a primary email address in Clerk." },
        { status: 400 },
      );
    }

    const formData = await request.formData();
    const title = (formData.get("projectName") as string | null)?.trim();
    const clayId = (formData.get("clayId") as string | null)?.trim();
    const notes = (formData.get("notes") as string | null)?.trim() || null;
    const photos = formData.getAll("photos").filter((file): file is File => file instanceof File && file.size > 0);

    if (!title || !clayId) {
      return NextResponse.json({ error: "Project name and clay are required." }, { status: 400 });
    }

    const supabase = getSupabaseServiceRoleClient();
    const bucket = process.env.SUPABASE_STORAGE_BUCKET || "attachments";
    await ensureStorageBucketExists(bucket);

    const { data: existingUsers, error: listUsersError } = await supabase.auth.admin.listUsers();

    if (listUsersError) {
      console.error("Supabase auth user lookup by email failed", listUsersError);
      return NextResponse.json(
        { error: "Unable to save project because Supabase user lookup failed. Try again or contact support." },
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
          clerkUserId: resolvedUserId,
          name: clerkUser.fullName || undefined,
        },
      });

      if (createUserError || !createdUser?.user) {
        console.error("Supabase auth user creation failed", createUserError);
        return NextResponse.json(
          {
            error:
              "Unable to save project because a Supabase user could not be provisioned for your account. Please check Supabase auth settings.",
          },
          { status: 500 },
        );
      }

      supabaseUserId = createdUser.user.id;
    }

    const { data: projectInsert, error: projectError } = await supabase
      .from("Projects")
      .insert({ title, clay_id: clayId, user_id: supabaseUserId, notes })
      .select("id")
      .single();

    if (projectError || !projectInsert) {
      console.error("Pottery project insert failed", projectError);
      return NextResponse.json(
        {
          error: `Unable to save project. Check Supabase table permissions. ${projectError?.message ?? ""}`.trim(),
        },
        { status: 500 },
      );
    }

    const projectId = projectInsert.id as string;
    const uploadedPhotos: { storage_path: string }[] = [];

    for (const file of photos) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const extension = file.name.includes(".") ? file.name.split(".").pop() : "jpg";
      const storagePath = `${projectId}/${crypto.randomUUID()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(storagePath, buffer, { contentType: file.type || "image/jpeg", upsert: false });

      if (uploadError) {
        console.error("Pottery project photo upload failed", uploadError);
        return NextResponse.json(
          { error: "Failed to upload photo. Confirm the storage bucket exists and credentials are valid." },
          { status: 500 },
        );
      }

      uploadedPhotos.push({ storage_path: storagePath });
    }

    if (uploadedPhotos.length) {
      const photoRows = uploadedPhotos.map((photo) => ({
        project_id: projectId,
        storage_path: photo.storage_path,
      }));

      const { error: photoInsertError } = await supabase.from("ProjectPhotos").insert(photoRows);

      if (photoInsertError) {
        console.error("Pottery project photo insert failed", photoInsertError);
        return NextResponse.json(
          { error: "Failed to save photo references. Check ProjectPhotos permissions." },
          { status: 500 },
        );
      }
    }

    revalidatePath("/pottery");

    return NextResponse.json({ projectId, photos: uploadedPhotos.length }, { status: 201 });
  } catch (error) {
    console.error("Unexpected error creating pottery project", error);
    return NextResponse.json(
      { error: "Unexpected error creating project. Verify Supabase environment variables and try again." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { userId } = await auth();

    const authorization = await authorizeStudioMember({ userId: userId ?? undefined });

    if ("error" in authorization) {
      return NextResponse.json({ error: authorization.error.message }, { status: authorization.error.status });
    }

    const body = await request.json().catch(() => null);
    const projectId = (body?.projectId as string | null)?.trim();

    if (!projectId) {
      return NextResponse.json({ error: "A project ID is required to delete a project." }, { status: 400 });
    }

    const supabase = getSupabaseServiceRoleClient();
    const bucket = await ensureStorageBucketExists(process.env.SUPABASE_STORAGE_BUCKET || "attachments");

    const [{ data: projectPhotos, error: projectPhotosError }, { data: activityPhotos, error: activityPhotosError }] =
      await Promise.all([
        supabase.from("ProjectPhotos").select("storage_path").eq("project_id", projectId),
        supabase.from("ActivityPhotos").select("storage_path").eq("project_id", projectId),
      ]);

    if (projectPhotosError || activityPhotosError) {
      console.error("Failed to look up pottery photos for deletion", { projectPhotosError, activityPhotosError });
      return NextResponse.json(
        { error: "Unable to delete project photos. Try again or verify Supabase permissions." },
        { status: 500 },
      );
    }

    const storagePaths = Array.from(
      new Set(
        [...(projectPhotos || []), ...(activityPhotos || [])]
          .map((photo) => photo.storage_path as string | null)
          .filter(Boolean) as string[],
      ),
    );

    if (storagePaths.length) {
      const { error: storageError } = await supabase.storage.from(bucket).remove(storagePaths);

      if (storageError) {
        console.error("Failed to delete pottery storage objects", storageError);
        return NextResponse.json(
          { error: "Unable to delete project files from storage. Confirm bucket permissions." },
          { status: 500 },
        );
      }
    }

    const { error: activityPhotosDeleteError } = await supabase.from("ActivityPhotos").delete().eq("project_id", projectId);

    if (activityPhotosDeleteError) {
      console.error("Failed to delete pottery activity photos", activityPhotosDeleteError);
      return NextResponse.json(
        { error: "Unable to delete activity photos for this project." },
        { status: 500 },
      );
    }

    const { error: projectPhotosDeleteError } = await supabase.from("ProjectPhotos").delete().eq("project_id", projectId);

    if (projectPhotosDeleteError) {
      console.error("Failed to delete pottery project photos", projectPhotosDeleteError);
      return NextResponse.json(
        { error: "Unable to delete photos attached to this project." },
        { status: 500 },
      );
    }

    const { error: activitiesDeleteError } = await supabase.from("Activities").delete().eq("project_id", projectId);

    if (activitiesDeleteError) {
      console.error("Failed to delete pottery activities", activitiesDeleteError);
      return NextResponse.json(
        { error: "Unable to delete activities for this project." },
        { status: 500 },
      );
    }

    const { error: projectDeleteError } = await supabase.from("Projects").delete().eq("id", projectId);

    if (projectDeleteError) {
      console.error("Failed to delete pottery project", projectDeleteError);
      return NextResponse.json(
        { error: "Unable to delete project record from Supabase." },
        { status: 500 },
      );
    }

    revalidatePath("/pottery");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Unexpected error deleting pottery project", error);
    return NextResponse.json(
      { error: "Unexpected error deleting project. Verify Supabase environment variables and try again." },
      { status: 500 },
    );
  }
}
