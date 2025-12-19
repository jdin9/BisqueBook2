"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const MAX_DIAL_SETTINGS = 11;

export default function AdminPage() {
  const [kilnType, setKilnType] = useState<"digital" | "manual">("digital");
  const [manualMode, setManualMode] = useState<"switches" | "dials">("switches");
  const [switchCount, setSwitchCount] = useState("");
  const [dialCount, setDialCount] = useState("");
  const [dialSettings, setDialSettings] = useState<string[]>([""]);

  const canAddDialSetting = useMemo(() => dialSettings.length < MAX_DIAL_SETTINGS, [dialSettings.length]);

  const handleDialSettingChange = (index: number, value: string) => {
    setDialSettings((prev) => prev.map((setting, idx) => (idx === index ? value : setting)));
  };

  const handleAddDialSetting = () => {
    if (canAddDialSetting) {
      setDialSettings((prev) => [...prev, ""]);
    }
  };

  const handleRemoveDialSetting = (index: number) => {
    setDialSettings((prev) => (prev.length === 1 ? prev : prev.filter((_, idx) => idx !== index)));
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Centralize studio controls from one place.</p>
        <h1 className="text-3xl font-semibold">Admin</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Jump between studio planning, kiln checks, and pottery tracking from a single workspace.
        </p>
      </div>

      <Tabs defaultValue="studio">
        <TabsList>
          <TabsTrigger value="studio">Studio</TabsTrigger>
          <TabsTrigger value="kiln">Kiln</TabsTrigger>
        </TabsList>

        <TabsContent value="studio" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Studio access</CardTitle>
              <CardDescription>Keep one shared set of credentials for studio sign-ins.</CardDescription>
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
              <CardTitle>Kiln management</CardTitle>
              <CardDescription>Track kiln types and manual control details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="kiln-name">Kiln Name</Label>
                  <Input id="kiln-name" placeholder="e.g., Skutt KM1231 or Manual 18" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="kiln-type">Kiln Type</Label>
                  <select
                    id="kiln-type"
                    className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
                    value={kilnType}
                    onChange={(event) => setKilnType(event.target.value as "digital" | "manual")}
                  >
                    <option value="digital">Digital</option>
                    <option value="manual">Manual</option>
                  </select>
                  <p className="text-xs text-muted-foreground">Digital kilns don&apos;t require manual control details.</p>
                </div>
              </div>

              {kilnType === "manual" && (
                <div className="space-y-4 rounded-lg border border-dashed border-border/60 bg-muted/30 p-4">
                  <div className="space-y-2">
                    <Label htmlFor="manual-mode">Manual controls</Label>
                    <select
                      id="manual-mode"
                      className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
                      value={manualMode}
                      onChange={(event) => {
                        const nextMode = event.target.value as "switches" | "dials";
                        setManualMode(nextMode);
                        if (nextMode === "switches") {
                          setDialSettings([""]);
                        }
                      }}
                    >
                      <option value="switches">Switches</option>
                      <option value="dials">Dials</option>
                    </select>
                    <p className="text-xs text-muted-foreground">Choose whether this kiln uses toggle switches or dial settings.</p>
                  </div>

                  {manualMode === "switches" && (
                    <div className="space-y-2">
                      <Label htmlFor="switch-count">Number of switches</Label>
                      <Input
                        id="switch-count"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder="e.g., 3"
                        value={switchCount}
                        onChange={(event) => setSwitchCount(event.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">Specify how many on/off switch positions this kiln has.</p>
                    </div>
                  )}

                  {manualMode === "dials" && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="dial-count">Number of dials</Label>
                        <Input
                          id="dial-count"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          placeholder="e.g., 3"
                          value={dialCount}
                          onChange={(event) => setDialCount(event.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">Count each dial that controls temperature or cone stages.</p>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Dial settings</Label>
                            <p className="text-xs text-muted-foreground">List each dial position in order (max {MAX_DIAL_SETTINGS}).</p>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleAddDialSetting}
                            disabled={!canAddDialSetting}
                          >
                            Add setting
                          </Button>
                        </div>

                        <div className="space-y-3">
                          {dialSettings.map((setting, index) => (
                            <div key={`dial-setting-${index}`} className="flex gap-2">
                              <Input
                                aria-label={`Dial setting ${index + 1}`}
                                placeholder={index === 0 ? "e.g., Low" : "Add another setting"}
                                value={setting}
                                onChange={(event) => handleDialSettingChange(index, event.target.value)}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                className="shrink-0"
                                onClick={() => handleRemoveDialSetting(index)}
                                aria-label={`Remove dial setting ${index + 1}`}
                                disabled={dialSettings.length === 1}
                              >
                                ✕
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
