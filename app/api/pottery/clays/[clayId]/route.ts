import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { authorizeStudioMember } from "@/lib/studio/access";
import { getSupabaseServiceRoleClient } from "@/lib/storage";
import { StudioMembershipRole } from "@/lib/types";

export const runtime = "nodejs";

const validStatuses = new Set(["active", "retired"]);

export async function PATCH(request: Request, context: { params: { clayId: string } }) {
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

  const { clayBody, status } = (body ?? {}) as { clayBody?: unknown; status?: unknown };
  const updates: { clay_body?: string; status?: string } = {};

  if (typeof clayBody === "string" && clayBody.trim()) {
    updates.clay_body = clayBody.trim();
  }

  if (typeof status === "string" && validStatuses.has(status.trim().toLowerCase())) {
    updates.status = status.trim().toLowerCase();
  } else if (status !== undefined) {
    return NextResponse.json({ error: "Status must be active or retired." }, { status: 400 });
  }

  if (!updates.clay_body && !updates.status) {
    return NextResponse.json({ error: "Provide a clay body or status to update." }, { status: 400 });
  }

  try {
    const supabase = getSupabaseServiceRoleClient();
    const { data, error } = await supabase
      .from("Clays")
      .update(updates)
      .eq("id", context.params.clayId)
      .select("id, clay_body, status")
      .single();

    if (error) {
      console.error("Failed to update clay", error);
      return NextResponse.json({ error: "Unable to update clay body right now. Please try again." }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "Clay body not found." }, { status: 404 });
    }

    return NextResponse.json({ clay: data });
  } catch (error) {
    console.error("Unexpected error updating clay", error);
    return NextResponse.json({ error: "Unable to update clay body right now. Please try again." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: { params: { clayId: string } }) {
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
    const { error } = await supabase.from("Clays").delete().eq("id", context.params.clayId);

    if (error) {
      console.error("Failed to delete clay", error);
      return NextResponse.json({ error: "Unable to delete clay body right now. Please try again." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Unexpected error deleting clay", error);
    return NextResponse.json({ error: "Unable to delete clay body right now. Please try again." }, { status: 500 });
  }
}
