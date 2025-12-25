import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseServiceRoleClient } from "@/lib/storage";

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "You must be signed in to create a project." }, { status: 401 });
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

  const { data: projectInsert, error: projectError } = await supabase
    .from("Projects")
    .insert({ title, clay_id: clayId, user_id: userId, notes })
    .select("id")
    .single();

  if (projectError || !projectInsert) {
    return NextResponse.json({ error: "Unable to save project." }, { status: 500 });
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
      return NextResponse.json({ error: "Failed to upload photo." }, { status: 500 });
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
      return NextResponse.json({ error: "Failed to save photo references." }, { status: 500 });
    }
  }

  return NextResponse.json({ projectId, photos: uploadedPhotos.length }, { status: 201 });
}
