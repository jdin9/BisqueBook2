import type { ReactNode } from "react";

import { AdminGuard } from "@/components/admin/admin-guard";
import { AdminLayout } from "@/components/admin/admin-layout";

export default function AdminShellLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <AdminGuard>
      <AdminLayout
        description="Manage studios, kilns, and pottery inventory."
        title="Admin"
      >
        {children}
      </AdminLayout>
    </AdminGuard>
  );
}
