import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { authorizeStudioMember } from "@/lib/studio/access";
import { getSupabaseServiceRoleClient } from "@/lib/storage";
import { StudioMembershipRole } from "@/lib/types";

export const runtime = "nodejs";

const validStatuses = new Set(["active", "retired"]);

export async function PATCH(request: Request, context: { params: { glazeId: string } }) {
  const { userId } = await auth();
  const authorization = await authorizeStudioMember({
    userId: userId ?? undefined,
    requiredRole: StudioMembershipRole.Admin,
  });

  if ("error" in authorization) {
    return NextResponse.json({ error: authorization.error.message }, { status: authorization.error.status });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const { glazeName, brand, status } = (body ?? {}) as { glazeName?: unknown; brand?: unknown; status?: unknown };
  const updates: { glaze_name?: string; brand?: string; status?: string } = {};

  if (typeof glazeName === "string" && glazeName.trim()) {
    updates.glaze_name = glazeName.trim();
  }

  if (typeof brand === "string" && brand.trim()) {
    updates.brand = brand.trim();
  }

  if (typeof status === "string" && validStatuses.has(status.trim().toLowerCase())) {
    updates.status = status.trim().toLowerCase();
  } else if (status !== undefined) {
    return NextResponse.json({ error: "Status must be active or retired." }, { status: 400 });
  }

  if (!updates.glaze_name && !updates.brand && !updates.status) {
    return NextResponse.json({ error: "Provide a glaze name, brand, or status to update." }, { status: 400 });
  }

  try {
    const supabase = getSupabaseServiceRoleClient();
    const { data, error } = await supabase
      .from("Glazes")
      .update(updates)
      .eq("id", context.params.glazeId)
      .select("id, glaze_name, brand, status")
      .single();

    if (error) {
      console.error("Failed to update glaze", error);
      return NextResponse.json({ error: "Unable to update glaze right now. Please try again." }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "Glaze not found." }, { status: 404 });
    }

    return NextResponse.json({ glaze: data });
  } catch (error) {
    console.error("Unexpected error updating glaze", error);
    return NextResponse.json({ error: "Unable to update glaze right now. Please try again." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: { params: { glazeId: string } }) {
  const { userId } = await auth();
  const authorization = await authorizeStudioMember({
    userId: userId ?? undefined,
    requiredRole: StudioMembershipRole.Admin,
  });

  if ("error" in authorization) {
    return NextResponse.json({ error: authorization.error.message }, { status: authorization.error.status });
  }

  try {
    const supabase = getSupabaseServiceRoleClient();
    const { error } = await supabase.from("Glazes").delete().eq("id", context.params.glazeId);

    if (error) {
      console.error("Failed to delete glaze", error);
      return NextResponse.json({ error: "Unable to delete glaze right now. Please try again." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Unexpected error deleting glaze", error);
    return NextResponse.json({ error: "Unable to delete glaze right now. Please try again." }, { status: 500 });
  }
}
