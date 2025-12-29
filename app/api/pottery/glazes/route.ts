import { NextRequest, NextResponse } from "next/server";
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
      .from("Glazes")
      .select("id, glaze_name, brand, status")
      .order("glaze_name", { ascending: true });

    if (error) {
      console.error("Failed to load glazes", error);
      return NextResponse.json({ error: "Unable to load glazes." }, { status: 500 });
    }

    return NextResponse.json({ glazes: data ?? [] });
  } catch (error) {
    console.error("Unexpected error loading glazes", error);
    return NextResponse.json({ error: "Unable to load glazes." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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
  const trimmedName = typeof glazeName === "string" ? glazeName.trim() : "";
  const trimmedBrand = typeof brand === "string" ? brand.trim() : "";
  const normalizedStatus = typeof status === "string" ? status.trim().toLowerCase() : "active";

  if (!trimmedName || !trimmedBrand) {
    return NextResponse.json({ error: "Glaze name and brand are required." }, { status: 400 });
  }

  if (!validStatuses.has(normalizedStatus)) {
    return NextResponse.json({ error: "Status must be active or retired." }, { status: 400 });
  }

  try {
    const supabase = getSupabaseServiceRoleClient();
    const { data, error } = await supabase
      .from("Glazes")
      .insert({ glaze_name: trimmedName, brand: trimmedBrand, status: normalizedStatus })
      .select("id, glaze_name, brand, status")
      .single();

    if (error || !data) {
      console.error("Failed to create glaze", error);
      return NextResponse.json({ error: "Unable to add glaze right now. Please try again." }, { status: 500 });
    }

    return NextResponse.json({ glaze: data }, { status: 201 });
  } catch (error) {
    console.error("Unexpected error creating glaze", error);
    return NextResponse.json({ error: "Unable to add glaze right now. Please try again." }, { status: 500 });
  }
}
