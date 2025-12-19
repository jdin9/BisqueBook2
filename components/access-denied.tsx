import Link from "next/link";
import { ShieldX } from "lucide-react";

import { Button } from "@/components/ui/button";

export function AccessDenied({
  title = "Access denied",
  description = "You do not have permission to view this area.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="mx-auto max-w-xl space-y-4 rounded-lg border bg-card px-6 py-10 text-center shadow-sm">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <ShieldX className="h-6 w-6 text-muted-foreground" />
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="flex items-center justify-center gap-3">
        <Button variant="secondary" asChild>
          <Link href="/">Go home</Link>
        </Button>
        <Button asChild>
          <Link href="/sign-in">Sign in</Link>
        </Button>
      </div>
    </div>
  );
}
