export function formatConeLabel(cone?: string | null): string {
  if (!cone) {
    return "";
  }

  const trimmed = cone.trim();
  const withoutPrefix = trimmed.replace(/^cone\s*/i, "").trim();
  const value = withoutPrefix || trimmed;

  return `Cone ${value}`.trim();
}
