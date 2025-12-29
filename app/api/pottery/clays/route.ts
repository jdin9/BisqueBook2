import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { authorizeStudioMember } from "@/lib/studio/access";
import { getSupabaseServiceRoleClient } from "@/lib/storage";
import { StudioMembershipRole } from "@/lib/types";

export const runtime = "nodejs";

const validStatuses = new Set(["active", "retired"]);

export async function GET() {
  const { userId } = await auth();
  const authorization = await authorizeStudioMember({ userId: userId ?? undefined });

  if ("error" in authorization) {
    return NextResponse.json({ error: authorization.error.message }, { status: authorization.error.status });
  }

  try {
    const supabase = getSupabaseServiceRoleClient();
    const { data, error } = await supabase
      .from("Clays")
      .select("id, clay_body, status")
      .order("clay_body", { ascending: true });

    if (error) {
      console.error("Failed to load clays", error);
      return NextResponse.json({ error: "Unable to load clays." }, { status: 500 });
    }

    return NextResponse.json({ clays: data ?? [] });
  } catch (error) {
    console.error("Unexpected error loading clays", error);
    return NextResponse.json({ error: "Unable to load clays." }, { status: 500 });
  }
}

export async function POST(request: Request) {
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
  const trimmedBody = typeof clayBody === "string" ? clayBody.trim() : "";
  const normalizedStatus = typeof status === "string" ? status.trim().toLowerCase() : "active";

  if (!trimmedBody) {
    return NextResponse.json({ error: "Clay body is required." }, { status: 400 });
  }

  if (!validStatuses.has(normalizedStatus)) {
    return NextResponse.json({ error: "Status must be active or retired." }, { status: 400 });
  }

  try {
    const supabase = getSupabaseServiceRoleClient();
    const { data, error } = await supabase
      .from("Clays")
      .insert({ clay_body: trimmedBody, status: normalizedStatus })
      .select("id, clay_body, status")
      .single();

    if (error || !data) {
      console.error("Failed to create clay", error);
      return NextResponse.json({ error: "Unable to add clay body right now. Please try again." }, { status: 500 });
    }

    return NextResponse.json({ clay: data }, { status: 201 });
  } catch (error) {
    console.error("Unexpected error creating clay", error);
    return NextResponse.json({ error: "Unable to add clay body right now. Please try again." }, { status: 500 });
  }
}
