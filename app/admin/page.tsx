"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type KilnType = "digital" | "manual";
type ManualControl = "switches" | "dials";

type KilnRecord = {
  id: string | number;
  name: string;
  controller: "digital" | "manual";
  manual_type: "switches" | "dials" | null;
  trigger_count: number | null;
  dial_settings: string[] | null;
  status: "active" | "retired";
};

const selectClassName =
  "h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs transition-[color,box-shadow] outline-none " +
  "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]";

export default function AdminPage() {
  const [kilnType, setKilnType] = useState<KilnType>("digital");
  const [manualControl, setManualControl] = useState<ManualControl>("switches");
  const [kilnName, setKilnName] = useState("");
  const [triggerCount, setTriggerCount] = useState("1");
  const [dialSettings, setDialSettings] = useState<string[]>(["Low"]);
  const [newDialSetting, setNewDialSetting] = useState("");
  const [status, setStatus] = useState<"active" | "retired">("active");

  const [kilns, setKilns] = useState<KilnRecord[]>([]);
  const [selectedKilnId, setSelectedKilnId] = useState<string | number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !anonKey) {
      throw new Error("Missing Supabase environment variables.");
    }

    return createClient(url, anonKey, { auth: { persistSession: false } });
  }, []);

  const showManualDetails = kilnType === "manual";
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

  const resetForm = () => {
    setKilnName("");
    setKilnType("digital");
    setManualControl("switches");
    setTriggerCount("1");
    setDialSettings(["Low"]);
    setNewDialSetting("");
    setStatus("active");
  };

  const fetchKilns = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from("Kilns")
      .select("id, name, controller, manual_type, trigger_count, dial_settings, status")
      .order("name", { ascending: true });

    if (fetchError) {
      setError("Unable to load kilns. Please try again.");
      setIsLoading(false);
      return;
    }

    setKilns((data as KilnRecord[]) || []);
    setIsLoading(false);
  }, [supabase]);

  useEffect(() => {
    void fetchKilns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async () => {
    setError(null);

    const trimmedName = kilnName.trim();
    if (!trimmedName) {
      setError("Kiln name is required.");
      return;
    }

    if (kilnType === "manual") {
      const countNumber = Number(triggerCount);
      if (!triggerCount || Number.isNaN(countNumber) || countNumber <= 0) {
        setError("Please provide how many switches or dials the kiln has.");
        return;
      }

      if (manualControl === "dials" && (!dialSettings.length || dialSettings.some((setting) => !setting.trim()))) {
        setError("Please list at least one dial setting.");
        return;
      }
    }

    setIsSubmitting(true);

    const payload = {
      name: trimmedName,
      controller: kilnType,
      manual_type: kilnType === "manual" ? manualControl : null,
      trigger_count: kilnType === "manual" ? Number(triggerCount) : null,
      dial_settings: kilnType === "manual" && manualControl === "dials" ? dialSettings : [],
      status,
    } satisfies Omit<KilnRecord, "id">;

    const { error: insertError } = await supabase.from("Kilns").insert(payload);

    if (insertError) {
      setError("Unable to add kiln right now. Please try again.");
      setIsSubmitting(false);
      return;
    }

    resetForm();
    await fetchKilns();
    setIsSubmitting(false);
  };

  const toggleKilnStatus = async (kiln: KilnRecord) => {
    const nextStatus = kiln.status === "active" ? "retired" : "active";
    const { error: updateError } = await supabase
      .from("Kilns")
      .update({ status: nextStatus })
      .eq("id", kiln.id);

    if (updateError) {
      setError("Unable to update kiln status. Please try again.");
      return;
    }

    await fetchKilns();
    setSelectedKilnId(kiln.id);
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
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Kilns</CardTitle>
                <CardDescription>Review and manage all tracked kilns.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {error ? (
                  <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {error}
                  </div>
                ) : null}
                {isLoading ? (
                  <p className="text-sm text-muted-foreground">Loading kilns...</p>
                ) : kilns.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No kilns added yet.</p>
                ) : (
                  <div className="space-y-3">
                    {kilns.map((kiln) => {
                      const isOpen = selectedKilnId === kiln.id;
                      return (
                        <div key={kiln.id} className="rounded-lg border">
                          <button
                            type="button"
                            onClick={() => setSelectedKilnId(isOpen ? null : kiln.id)}
                            className="flex w-full items-center justify-between rounded-lg px-4 py-3 text-left transition-colors hover:bg-muted/60"
                          >
                            <div className="space-y-1">
                              <p className="text-sm font-medium">{kiln.name}</p>
                              <p className="text-xs text-muted-foreground">
                                Controller: {kiln.controller === "manual" ? "Manual" : "Digital"} · Status: {" "}
                                <span className={kiln.status === "active" ? "text-emerald-600" : "text-muted-foreground"}>
                                  {kiln.status === "active" ? "Active" : "Retired"}
                                </span>
                              </p>
                            </div>
                            <span className="text-xs text-muted-foreground">{isOpen ? "Hide" : "Details"}</span>
                          </button>

                          {isOpen ? (
                            <div className="space-y-3 border-t px-4 py-3 text-sm">
                              {kiln.controller === "manual" ? (
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Manual control</p>
                                    <span className="rounded-full bg-muted px-2 py-1 text-xs font-medium">
                                      {kiln.manual_type === "dials" ? "Dials" : "Switches"}
                                    </span>
                                  </div>
                                  <p className="text-muted-foreground">
                                    {kiln.trigger_count || 0} {kiln.manual_type === "switches" ? "switch" : "dial"}
                                    {kiln.trigger_count === 1 ? "" : "s"}
                                  </p>
                                  {kiln.manual_type === "dials" && kiln.dial_settings?.length ? (
                                    <div className="space-y-1">
                                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Dial settings</p>
                                      <div className="flex flex-wrap gap-2">
                                        {kiln.dial_settings.map((setting) => (
                                          <span
                                            key={`${kiln.id}-${setting}`}
                                            className="rounded-full bg-muted px-2 py-1 text-xs"
                                          >
                                            {setting}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  ) : null}
                                </div>
                              ) : (
                                <p className="text-muted-foreground">Digital kiln — no manual controls to log.</p>
                              )}

                              <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Status</p>
                                  <p className="font-medium capitalize">{kiln.status}</p>
                                </div>
                                <Button type="button" variant="secondary" onClick={() => void toggleKilnStatus(kiln)}>
                                  {kiln.status === "active" ? "Retire kiln" : "Reactivate kiln"}
                                </Button>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="h-full">
              <CardHeader>
                <CardTitle>Add kiln</CardTitle>
                <CardDescription>
                  Capture how each kiln is controlled. All fields are required before adding the kiln.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="kiln-name">Kiln Name</Label>
                    <Input
                      id="kiln-name"
                      placeholder="Studio kiln label (e.g., Skutt 1027)"
                      value={kilnName}
                      onChange={(event) => setKilnName(event.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="kiln-type">Kiln Type</Label>
                    <select
                      id="kiln-type"
                      className={selectClassName}
                      value={kilnType}
                      onChange={(event) => setKilnType(event.target.value as KilnType)}
                      required
                    >
                      <option value="digital">Digital (no follow-up controls)</option>
                      <option value="manual">Manual</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="kiln-status">Status</Label>
                    <select
                      id="kiln-status"
                      className={selectClassName}
                      value={status}
                      onChange={(event) => setStatus(event.target.value as "active" | "retired")}
                      required
                    >
                      <option value="active">Active</option>
                      <option value="retired">Retired</option>
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
                        required
                      >
                        <option value="switches">Switches</option>
                        <option value="dials">Dials</option>
                      </select>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="trigger-count">
                          {manualControl === "switches" ? "Number of switches" : "Number of dials"}
                        </Label>
                        <Input
                          id="trigger-count"
                          type="number"
                          min={1}
                          value={triggerCount}
                          onChange={(event) => setTriggerCount(event.target.value)}
                          placeholder={
                            manualControl === "switches"
                              ? "Enter how many switches are on the kiln"
                              : "Enter how many dials are on the kiln"
                          }
                          required
                        />
                      </div>
                    </div>

                    {showDials ? (
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
                                required
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
                    ) : null}
                  </div>
                ) : (
                  <div className="rounded-lg border p-4 text-sm text-muted-foreground">
                    Digital kilns don&apos;t need extra input—log schedules elsewhere and keep this card for quick reference.
                  </div>
                )}

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm text-muted-foreground">
                    All fields are required to add a kiln to the list. Details save directly to Supabase.
                  </div>
                  <Button type="button" onClick={() => void handleSubmit()} disabled={isSubmitting}>
                    {isSubmitting ? "Adding..." : "Add kiln"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
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
