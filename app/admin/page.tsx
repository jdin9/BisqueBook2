"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const selectClassName =
  "h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs transition-[color,box-shadow] outline-none " +
  "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]";

type KilnType = "digital" | "manual";
type ManualControl = "switches" | "dials";

type KilnDetails = {
  id: string;
  name: string;
  type: KilnType;
  manualControl: ManualControl;
  switchCount: string;
  dialCount: string;
  dialSettings: string[];
};

function Modal({
  title,
  open,
  onClose,
  children,
}: {
  title: string;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-3xl overflow-hidden rounded-lg bg-background shadow-lg ring-1 ring-border">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="text-lg font-semibold">{title}</h3>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground"
            aria-label="Close dialog"
            onClick={onClose}
          >
            ×
          </Button>
        </div>
        <div className="max-h-[75vh] overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [kilns, setKilns] = useState<KilnDetails[]>([
    {
      id: "k1",
      name: "Skutt 1027",
      type: "digital",
      manualControl: "switches",
      switchCount: "0",
      dialCount: "0",
      dialSettings: [],
    },
    {
      id: "k2",
      name: "Manual studio kiln",
      type: "manual",
      manualControl: "dials",
      switchCount: "0",
      dialCount: "3",
      dialSettings: ["Low", "2", "3", "Medium", "5", "High"],
    },
  ]);
  const [kilnType, setKilnType] = useState<KilnType>("digital");
  const [manualControl, setManualControl] = useState<ManualControl>("switches");
  const [switchCount, setSwitchCount] = useState("1");
  const [dialCount, setDialCount] = useState("1");
  const [dialSettings, setDialSettings] = useState<string[]>(["Low"]);
  const [newDialSetting, setNewDialSetting] = useState("");
  const [kilnName, setKilnName] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedKilnId, setSelectedKilnId] = useState<string | null>(null);

  const showManualDetails = kilnType === "manual";
  const showSwitches = showManualDetails && manualControl === "switches";
  const showDials = showManualDetails && manualControl === "dials";

  const dialSettingPlaceholder = useMemo(() => {
    return dialSettings.length ? `Example: ${dialSettings.join(", ")}` : "Example: Low, 2, 3, Med, 5, 6, High, Off";
  }, [dialSettings]);

  const handleDialSettingChange = (index: number, value: string) => {
    const updated = [...dialSettings];
    updated[index] = value;
    setDialSettings(updated);
  };

  const handleAddDialSetting = () => {
    const trimmed = newDialSetting.trim();
    if (!trimmed) return;
    setDialSettings((current) => [...current, trimmed]);
    setNewDialSetting("");
  };

  const resetKilnForm = () => {
    setKilnName("");
    setKilnType("digital");
    setManualControl("switches");
    setSwitchCount("1");
    setDialCount("1");
    setDialSettings(["Low"]);
    setNewDialSetting("");
  };

  const handleAddKiln = (event: React.FormEvent) => {
    event.preventDefault();
    const newKiln: KilnDetails = {
      id: crypto.randomUUID(),
      name: kilnName || "Untitled kiln",
      type: kilnType,
      manualControl,
      switchCount,
      dialCount,
      dialSettings,
    };
    setKilns((current) => [...current, newKiln]);
    setAddDialogOpen(false);
    resetKilnForm();
  };

  const selectedKiln = kilns.find((kiln) => kiln.id === selectedKilnId) ?? null;

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
              <CardDescription>Capture how each kiln is controlled to keep firing notes accurate.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>Track what&apos;s loaded, confirm cone targets, and keep ventilation and safety checks consistent.</p>
                  <p>Use this form to note whether a kiln is digital or manual, and detail how manual settings work.</p>
                </div>
                <Button type="button" onClick={() => setAddDialogOpen(true)} className="sm:self-start">
                  Add kiln
                </Button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm font-medium text-muted-foreground">
                  <p>Studio kilns</p>
                  <p>{kilns.length} total</p>
                </div>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {kilns.map((kiln) => (
                    <button
                      key={kiln.id}
                      type="button"
                      onClick={() => setSelectedKilnId(kiln.id)}
                      className="group flex flex-col gap-2 rounded-lg border p-4 text-left shadow-xs transition hover:-translate-y-0.5 hover:border-ring hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-base font-semibold text-foreground">{kiln.name}</p>
                        <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium capitalize text-secondary-foreground">
                          {kiln.type}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {kiln.type === "digital"
                          ? "Digital controls"
                          : kiln.manualControl === "switches"
                            ? `${kiln.switchCount} switches`
                            : `${kiln.dialCount} dial settings`}
                      </p>
                      <p className="text-xs text-primary opacity-0 transition group-hover:opacity-100">View details</p>
                    </button>
                  ))}
                  {kilns.length === 0 ? (
                    <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                      No kilns added yet. Use the Add kiln button to capture your first kiln.
                    </div>
                  ) : null}
                </div>
              </div>
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

    <Modal title="Add kiln" open={addDialogOpen} onClose={() => setAddDialogOpen(false)}>
      <form onSubmit={handleAddKiln} className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="kiln-name">Kiln Name</Label>
            <Input
              id="kiln-name"
              placeholder="Studio kiln label (e.g., Skutt 1027)"
              value={kilnName}
              onChange={(event) => setKilnName(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="kiln-type">Kiln Type</Label>
            <select
              id="kiln-type"
              className={selectClassName}
              value={kilnType}
              onChange={(event) => setKilnType(event.target.value as KilnType)}
            >
              <option value="digital">Digital (no follow-up controls)</option>
              <option value="manual">Manual</option>
            </select>
          </div>
        </div>

        {showManualDetails ? (
          <div className="space-y-4 rounded-lg border p-4">
            <div className="space-y-1">
              <Label htmlFor="manual-control">Manual control type</Label>
              <p className="text-sm text-muted-foreground">
                Choose whether the kiln uses switches or dial markings so you can record the right counts and ranges.
              </p>
              <select
                id="manual-control"
                className={selectClassName}
                value={manualControl}
                onChange={(event) => setManualControl(event.target.value as ManualControl)}
              >
                <option value="switches">Switches</option>
                <option value="dials">Dials</option>
              </select>
            </div>

            {showSwitches ? (
              <div className="grid gap-2 sm:w-1/2">
                <Label htmlFor="switch-count">Number of switches</Label>
                <Input
                  id="switch-count"
                  type="number"
                  min={1}
                  value={switchCount}
                  onChange={(event) => setSwitchCount(event.target.value)}
                  placeholder="Enter how many switches are on the kiln"
                />
              </div>
            ) : null}

            {showDials ? (
              <div className="space-y-4">
                <div className="grid gap-2 sm:w-1/2">
                  <Label htmlFor="dial-count">Number of dials</Label>
                  <Input
                    id="dial-count"
                    type="number"
                    min={1}
                    value={dialCount}
                    onChange={(event) => setDialCount(event.target.value)}
                    placeholder="Enter how many dials are on the kiln"
                  />
                </div>

                <div className="space-y-2">
                  <div>
                    <p className="text-sm font-medium leading-6 text-foreground">Dial setting range</p>
                    <p className="text-sm text-muted-foreground">
                      List every label your dials cycle through so other potters can line up the exact heat steps.
                    </p>
                  </div>
                  <div className="space-y-3">
                    {dialSettings.map((setting, index) => (
                      <div key={`${setting}-${index}`} className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Setting {index + 1}</Label>
                        <Input
                          value={setting}
                          onChange={(event) => handleDialSettingChange(index, event.target.value)}
                          placeholder={dialSettingPlaceholder}
                        />
                      </div>
                    ))}
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <Input
                        value={newDialSetting}
                        onChange={(event) => setNewDialSetting(event.target.value)}
                        placeholder={dialSettingPlaceholder}
                      />
                      <Button type="button" onClick={handleAddDialSetting} className="sm:w-40">
                        Add setting
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="rounded-lg border p-4 text-sm text-muted-foreground">
            Digital kilns don&apos;t need extra input—log schedules elsewhere and keep this card for quick reference.
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => setAddDialogOpen(false)}>
            Cancel
          </Button>
          <Button type="submit">Save kiln</Button>
        </div>
      </form>
    </Modal>

    <Modal
      title={selectedKiln?.name ?? "Kiln details"}
      open={selectedKiln !== null}
      onClose={() => setSelectedKilnId(null)}
    >
      {selectedKiln ? (
        <div className="space-y-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Kiln type</p>
            <p className="text-base font-semibold capitalize">{selectedKiln.type}</p>
          </div>
          {selectedKiln.type === "manual" ? (
            <div className="space-y-3 rounded-lg border p-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Manual control</p>
                <p className="font-medium capitalize text-foreground">{selectedKiln.manualControl}</p>
              </div>
              {selectedKiln.manualControl === "switches" ? (
                <p className="text-sm text-muted-foreground">{selectedKiln.switchCount} switches on the panel.</p>
              ) : (
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>{selectedKiln.dialCount} dials with these labels:</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedKiln.dialSettings.map((setting, index) => (
                      <span key={`${setting}-${index}`} className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                        {setting}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="rounded-lg border p-4 text-sm text-muted-foreground">
              Digital kiln—control panel settings are logged separately.
            </p>
          )}
        </div>
      ) : null}
    </Modal>
  );
}
