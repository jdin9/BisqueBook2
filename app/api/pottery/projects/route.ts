import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { ensureStorageBucketExists, getSupabaseServiceRoleClient } from "@/lib/storage";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "You must be signed in to create a project." }, { status: 401 });
    }

    const clerk = await clerkClient();
    const clerkUser = await clerk.users.getUser(userId);
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

    const { data: existingUserByEmail, error: userLookupError } = await supabase.auth.admin.getUserByEmail(email);

    if (userLookupError) {
      console.error("Supabase auth user lookup by email failed", userLookupError);
      return NextResponse.json(
        { error: "Unable to save project because Supabase user lookup failed. Try again or contact support." },
        { status: 500 },
      );
    }

    let supabaseUserId = existingUserByEmail?.user?.id;

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
