import { StudioManagement } from "@/components/admin/studio-management";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getPrismaClient } from "@/lib/prisma";

const tabContent = {
  studio: {
    title: "Studios",
    description: "Create, update, and organize studios across your organization.",
  },
  kiln: {
    title: "Kilns",
    description: "Assign kilns to studios, track firings, and schedule maintenance.",
  },
  pottery: {
    title: "Pottery",
    description: "Manage glaze tests, firing logs, and finished pieces inventory.",
  },
} as const;

export default async function AdminPage() {
  const prisma = getPrismaClient();
  const studios = await prisma.studio.findMany({
    include: {
      members: {
        include: { user: true },
        orderBy: { createdAt: "asc" },
      },
      owner: true,
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="space-y-6">
      <Tabs defaultValue="studio" className="w-full">
        <TabsList>
          <TabsTrigger value="studio">Studio</TabsTrigger>
          <TabsTrigger value="kiln">Kiln</TabsTrigger>
          <TabsTrigger value="pottery">Pottery</TabsTrigger>
        </TabsList>

        <TabsContent value="studio" className="space-y-6">
          <Section {...tabContent.studio} />
          <StudioManagement initialStudios={studios} />
        </TabsContent>
        <TabsContent value="kiln">
          <Section {...tabContent.kiln} />
        </TabsContent>
        <TabsContent value="pottery">
          <Section {...tabContent.pottery} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Section({ title, description }: { title: string; description: string }) {
  return (
    <div className="space-y-2">
      <h2 className="text-2xl font-semibold leading-tight">{title}</h2>
      <p className="text-sm text-muted-foreground">{description}</p>
      <div className="mt-4 rounded-md border border-dashed bg-muted/30 p-6 text-sm text-muted-foreground">
        Placeholder tools and metrics will live here.
      </div>
    </div>
  );
}
