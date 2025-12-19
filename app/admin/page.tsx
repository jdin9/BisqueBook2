import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AdminPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Centralize studio controls and kiln monitoring.</p>
        <h1 className="text-3xl font-semibold">Admin</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Jump between studio planning, kiln checks, and pottery tracking from a single workspace.
        </p>
      </div>

      <Tabs defaultValue="studio">
        <TabsList>
          <TabsTrigger value="studio">Studio</TabsTrigger>
          <TabsTrigger value="kiln">Kiln</TabsTrigger>
          <TabsTrigger value="pottery">Pottery</TabsTrigger>
        </TabsList>

        <TabsContent value="studio" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Studio schedule</CardTitle>
              <CardDescription>Outline work sessions, classes, and team access.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>Keep track of who&apos;s on the wheel, when glazes are mixed, and what tools are in use.</p>
              <p>Use this tab to align your studio calendar with kiln firings and pottery deadlines.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Studio access</CardTitle>
              <CardDescription>Define shared details for sign-ins around the studio.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="studio-name">Studio Name</Label>
                <Input id="studio-name" placeholder="Enter studio name" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="studio-password">Studio Password</Label>
                <Input id="studio-password" type="password" placeholder="Enter studio password" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="kiln" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Kiln oversight</CardTitle>
              <CardDescription>Monitor firing plans and readiness before each run.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>Track what&apos;s loaded, confirm cone targets, and log cooling periods.</p>
              <p>Make sure ventilation, shelves, and safety checks are completed before starting the cycle.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pottery" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pottery inventory</CardTitle>
              <CardDescription>Placeholder space for finished pieces and works in progress.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>Catalog upcoming pieces, glazing notes, and pickup timelines once this section is wired up.</p>
              <p>For now, use the studio and kiln tabs to keep everything moving until pottery tracking goes live.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
