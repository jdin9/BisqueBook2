import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { getSupabaseServiceRoleClient } from "@/lib/storage";

type CreateProjectPayload = {
  title?: string;
  clayId?: string;
  notes?: string | null;
};

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "You must be signed in to create a project." },
        { status: 401 },
      );
    }

    const body = (await request.json().catch(() => ({}))) as CreateProjectPayload;
    const title = body.title?.trim();
    const clayId = body.clayId?.trim();
    const notes = body.notes?.trim() || null;

    if (!title || !clayId) {
      return NextResponse.json(
        { error: "Both title and clayId are required to create a project." },
        { status: 400 },
      );
    }

    const supabase = getSupabaseServiceRoleClient();

    const { data, error } = await supabase
      .from("Projects")
      .insert({
        title,
        clay_id: clayId,
        notes,
        user_id: userId,
      })
      .select("id")
      .single();

    if (error || !data) {
      console.error("Failed to insert pottery project", error);
      return NextResponse.json(
        { error: "Unable to create the project right now. Please try again later." },
        { status: 500 },
      );
    }

    return NextResponse.json({ id: data.id, message: "Project created." });
  } catch (error) {
    console.error("Unhandled error creating pottery project", error);
    return NextResponse.json(
      { error: "Something went wrong while creating the project." },
      { status: 500 },
    );
  }
}
