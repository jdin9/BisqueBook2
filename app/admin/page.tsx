"use client";

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

export default function AdminPage() {
  const [kilnType, setKilnType] = useState<KilnType>("digital");
  const [manualControl, setManualControl] = useState<ManualControl>("switches");
  const [switchCount, setSwitchCount] = useState("1");
  const [dialCount, setDialCount] = useState("1");
  const [dialSettings, setDialSettings] = useState<string[]>([
    "Low",
    "2",
    "3",
    "Med",
    "5",
    "6",
    "High",
    "Off",
  ]);
  const [newDialSetting, setNewDialSetting] = useState("");

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
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>Track what&apos;s loaded, confirm cone targets, and keep ventilation and safety checks consistent.</p>
                <p>Use this form to note whether a kiln is digital or manual, and detail how manual settings work.</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="kiln-name">Kiln Name</Label>
                  <Input id="kiln-name" placeholder="Studio kiln label (e.g., Skutt 1027)" />
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
