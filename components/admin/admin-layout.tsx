import type { ReactNode } from "react";
import { UserButton } from "@clerk/nextjs";

export function AdminLayout({
  children,
  title,
  description,
}: {
  children: ReactNode;
  title: string;
  description?: string;
}) {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl flex-col gap-8 px-6 py-10">
      <header className="flex flex-col gap-3 border-b pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Administrative area</p>
          <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
          {description ? (
            <p className="text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        <UserButton
          appearance={{
            elements: {
              userButtonAvatarBox: "h-12 w-12",
            },
          }}
          showName
        />
      </header>
      <div className="flex-1 pb-12">{children}</div>
    </div>
  );
}
