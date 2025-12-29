"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Status = "active" | "retired";
type KilnType = "digital" | "manual";
type KilnControls = "dials" | "switches";

type KilnRecord = {
  id: string;
  kiln_id: string;
  kiln_type: KilnType;
  controls: KilnControls | null;
  dial_settings: string[] | null;
  switch_count: number | null;
  status: Status;
};

type ClayRecord = {
  id: string;
  clay_body: string;
  status: Status;
};

type GlazeRecord = {
  id: string;
  glaze_name: string;
  brand: string;
  status: Status;
};

const coneChart = [
  { cone: "Cone 10", temperature: "2381°F" },
  { cone: "Cone 9", temperature: "2336°F" },
  { cone: "Cone 8", temperature: "2305°F" },
  { cone: "Cone 7", temperature: "2264°F" },
  { cone: "Cone 6", temperature: "2232°F" },
  { cone: "Cone 5", temperature: "2194°F" },
  { cone: "Cone 4", temperature: "2157°F" },
  { cone: "Cone 3", temperature: "2134°F" },
  { cone: "Cone 2", temperature: "2124°F" },
  { cone: "Cone 1", temperature: "2118°F" },
  { cone: "Cone 01", temperature: "2084°F" },
  { cone: "Cone 02", temperature: "2068°F" },
  { cone: "Cone 03", temperature: "2052°F" },
  { cone: "Cone 04", temperature: "2030°F" },
  { cone: "Cone 05", temperature: "2014°F" },
  { cone: "Cone 06", temperature: "1940°F" },
  { cone: "Cone 07", temperature: "1888°F" },
  { cone: "Cone 08", temperature: "1830°F" },
  { cone: "Cone 09", temperature: "1789°F" },
  { cone: "Cone 010", temperature: "1753°F" },
  { cone: "Cone 011", temperature: "1693°F" },
  { cone: "Cone 012", temperature: "1673°F" },
  { cone: "Cone 013", temperature: "1641°F" },
  { cone: "Cone 014", temperature: "1623°F" },
  { cone: "Cone 015", temperature: "1607°F" },
  { cone: "Cone 016", temperature: "1566°F" },
  { cone: "Cone 017", temperature: "1540°F" },
  { cone: "Cone 018", temperature: "1450°F" },
  { cone: "Cone 019", temperature: "1377°F" },
  { cone: "Cone 020", temperature: "1323°F" },
  { cone: "Cone 021", temperature: "1261°F" },
  { cone: "Cone 022", temperature: "1180°F" },
];

const selectClassName =
  "h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs transition-[color,box-shadow] outline-none " +
  "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]";

export default function AdminPageClient() {
  const [kilnType, setKilnType] = useState<KilnType>("digital");
  const [kilnControls, setKilnControls] = useState<KilnControls>("switches");
  const [kilnIdentifier, setKilnIdentifier] = useState("");
  const [switchCount, setSwitchCount] = useState("1");
  const [dialSettings, setDialSettings] = useState<string[]>(["Low"]);
  const [newDialSetting, setNewDialSetting] = useState("");
  const [kilnStatus, setKilnStatus] = useState<Status>("active");
  const [editingKilnId, setEditingKilnId] = useState<string | null>(null);

  const [clayBody, setClayBody] = useState("");
  const [clayStatus, setClayStatus] = useState<Status>("active");

  const [glazeName, setGlazeName] = useState("");
  const [glazeBrand, setGlazeBrand] = useState("");
  const [glazeStatus, setGlazeStatus] = useState<Status>("active");

  const [kilns, setKilns] = useState<KilnRecord[]>([]);
  const [clays, setClays] = useState<ClayRecord[]>([]);
  const [glazes, setGlazes] = useState<GlazeRecord[]>([]);
  const [selectedKilnId, setSelectedKilnId] = useState<string | null>(null);

  const [kilnError, setKilnError] = useState<string | null>(null);
  const [clayError, setClayError] = useState<string | null>(null);
  const [glazeError, setGlazeError] = useState<string | null>(null);

  const [isLoadingKilns, setIsLoadingKilns] = useState(false);
  const [isLoadingClays, setIsLoadingClays] = useState(false);
  const [isLoadingGlazes, setIsLoadingGlazes] = useState(false);

  const [isSubmittingKiln, setIsSubmittingKiln] = useState(false);
  const [isSubmittingClay, setIsSubmittingClay] = useState(false);
  const [isSubmittingGlaze, setIsSubmittingGlaze] = useState(false);

  const supabase = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !anonKey) {
      throw new Error("Missing Supabase environment variables.");
    }

    return createClient(url, anonKey, { auth: { persistSession: false } });
  }, []);

  const showManualDetails = kilnType === "manual";
  const showDials = showManualDetails && kilnControls === "dials";

  const dialSettingPlaceholder = useMemo(() => {
    return dialSettings.length ? `Example: ${dialSettings.join(", ")}` : "Example: Low, 2, 3, Med, 5, 6, High, Off";
  }, [dialSettings]);

  const isMissingTable = (error: { code?: string; message?: string } | null) =>
    Boolean(error?.code === "42P01" || error?.message?.toLowerCase().includes("relation"));

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
    setKilnIdentifier("");
    setKilnType("digital");
    setKilnControls("switches");
    setSwitchCount("1");
    setDialSettings(["Low"]);
    setNewDialSetting("");
    setKilnStatus("active");
    setEditingKilnId(null);
  };

  const resetClayForm = () => {
    setClayBody("");
    setClayStatus("active");
  };

  const resetGlazeForm = () => {
    setGlazeName("");
    setGlazeBrand("");
    setGlazeStatus("active");
  };

  const fetchKilns = useCallback(async () => {
    setIsLoadingKilns(true);
    setKilnError(null);

    const { data, error } = await supabase
      .from("Kilns")
      .select("id, kiln_id, kiln_type, controls, dial_settings, switch_count, status")
      .order("kiln_id", { ascending: true });

    if (error) {
      setKilnError(
        isMissingTable(error)
          ? "Kilns table not found. Please create it in Supabase using supabase/kilns.sql."
          : "Unable to load kilns. Please try again.",
      );
      setIsLoadingKilns(false);
      return;
    }

    setKilns((data as KilnRecord[]) || []);
    setIsLoadingKilns(false);
  }, [supabase]);

  const fetchClays = useCallback(async () => {
    setIsLoadingClays(true);
    setClayError(null);

    try {
      const response = await fetch("/api/pottery/clays", { cache: "no-store" });
      const payload = (await response.json()) as { clays?: ClayRecord[]; error?: string };

      if (!response.ok) {
        throw new Error(payload?.error || "Unable to load clay bodies. Please try again.");
      }

      setClays(payload.clays || []);
    } catch (error) {
      setClayError(
        error instanceof Error ? error.message : "Unable to load clay bodies. Please try again.",
      );
    } finally {
      setIsLoadingClays(false);
    }
  }, []);

  const fetchGlazes = useCallback(async () => {
    setIsLoadingGlazes(true);
    setGlazeError(null);

    try {
      const response = await fetch("/api/pottery/glazes", { cache: "no-store" });
      const payload = (await response.json()) as { glazes?: GlazeRecord[]; error?: string };

      if (!response.ok) {
        throw new Error(payload?.error || "Unable to load glazes. Please try again.");
      }

      setGlazes(payload.glazes || []);
    } catch (error) {
      setGlazeError(error instanceof Error ? error.message : "Unable to load glazes. Please try again.");
    } finally {
      setIsLoadingGlazes(false);
    }
  }, []);

  useEffect(() => {
    void fetchKilns();
    void fetchClays();
    void fetchGlazes();
  }, [fetchKilns, fetchClays, fetchGlazes]);

  const handleKilnSubmit = async () => {
    setKilnError(null);

    const trimmedIdentifier = kilnIdentifier.trim();
    if (!trimmedIdentifier) {
      setKilnError("Kiln ID is required.");
      return;
    }

    const cleanedDialSettings = dialSettings.map((setting) => setting.trim()).filter(Boolean);

    if (kilnType === "manual") {
      if (!kilnControls) {
        setKilnError("Controls are required for manual kilns.");
        return;
      }

      const countNumber = Number(switchCount);
      if (kilnControls === "switches" && (Number.isNaN(countNumber) || countNumber <= 0)) {
        setKilnError("Please enter the number of switches (must be greater than 0).");
        return;
      }

      if (kilnControls === "dials" && cleanedDialSettings.length === 0) {
        setKilnError("Please list at least one dial setting.");
        return;
      }
    }

    setIsSubmittingKiln(true);

    const payload = {
      kiln_id: trimmedIdentifier,
      kiln_type: kilnType,
      controls: kilnType === "manual" ? kilnControls : null,
      dial_settings: kilnType === "manual" && kilnControls === "dials" ? cleanedDialSettings : null,
      switch_count: kilnType === "manual" && kilnControls === "switches" ? Number(switchCount) : null,
      status: kilnStatus,
    } satisfies Omit<KilnRecord, "id">;

    const { error } = editingKilnId
      ? await supabase.from("Kilns").update(payload).eq("id", editingKilnId)
      : await supabase.from("Kilns").insert(payload);

    if (error) {
      setKilnError(
        isMissingTable(error)
          ? "Kilns table not found. Please create it in Supabase using supabase/kilns.sql."
          : editingKilnId
            ? "Unable to update kiln right now. Please try again."
            : "Unable to add kiln right now. Please try again.",
      );
      setIsSubmittingKiln(false);
      return;
    }

    resetKilnForm();
    await fetchKilns();
    setIsSubmittingKiln(false);
  };

  const handleEditKiln = (kiln: KilnRecord) => {
    setEditingKilnId(kiln.id);
    setKilnIdentifier(kiln.kiln_id);
    setKilnType(kiln.kiln_type);
    setKilnControls(kiln.controls ?? "switches");
    setSwitchCount((kiln.switch_count ?? 1).toString());
    setDialSettings(kiln.dial_settings?.length ? kiln.dial_settings : ["Low"]);
    setKilnStatus(kiln.status);
    setNewDialSetting("");
    if (kiln.kiln_type === "digital") {
      setKilnControls("switches");
      setDialSettings(["Low"]);
      setSwitchCount("1");
    }
  };

  const handleClaySubmit = async () => {
    setClayError(null);

    const trimmedBody = clayBody.trim();
    if (!trimmedBody) {
      setClayError("Clay body is required.");
      return;
    }

    setIsSubmittingClay(true);

    try {
      const response = await fetch("/api/pottery/clays", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clayBody: trimmedBody, status: clayStatus }),
      });
      const payload = (await response.json()) as { clay?: ClayRecord; error?: string };

      if (!response.ok) {
        throw new Error(
          payload?.error || "Unable to add clay body right now. Please try again.",
        );
      }

      if (payload.clay) {
        setClays((current) => [...current, payload.clay as ClayRecord]);
      }

      resetClayForm();
      await fetchClays();
    } catch (error) {
      setClayError(
        error instanceof Error ? error.message : "Unable to add clay body right now. Please try again.",
      );
    } finally {
      setIsSubmittingClay(false);
    }
  };

  const handleGlazeSubmit = async () => {
    setGlazeError(null);

    const trimmedName = glazeName.trim();
    const trimmedBrand = glazeBrand.trim();

    if (!trimmedName || !trimmedBrand) {
      setGlazeError("Glaze name and brand are required.");
      return;
    }

    setIsSubmittingGlaze(true);

    try {
      const response = await fetch("/api/pottery/glazes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ glazeName: trimmedName, brand: trimmedBrand, status: glazeStatus }),
      });
      const payload = (await response.json()) as { glaze?: GlazeRecord; error?: string };

      if (!response.ok) {
        throw new Error(payload?.error || "Unable to add glaze right now. Please try again.");
      }

      if (payload.glaze) {
        setGlazes((current) => [...current, payload.glaze as GlazeRecord]);
      }

      resetGlazeForm();
      await fetchGlazes();
    } catch (error) {
      setGlazeError(error instanceof Error ? error.message : "Unable to add glaze right now. Please try again.");
    } finally {
      setIsSubmittingGlaze(false);
    }
  };

  const toggleKilnStatus = async (kiln: KilnRecord) => {
    const nextStatus: Status = kiln.status === "active" ? "retired" : "active";
    const { error } = await supabase.from("Kilns").update({ status: nextStatus }).eq("id", kiln.id);

    if (error) {
      setKilnError("Unable to update kiln status. Please try again.");
      return;
    }

    await fetchKilns();
    setSelectedKilnId(kiln.id);
  };

  const toggleClayStatus = async (clay: ClayRecord) => {
    const nextStatus: Status = clay.status === "active" ? "retired" : "active";

    try {
      const response = await fetch(`/api/pottery/clays/${clay.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const payload = (await response.json()) as { clay?: ClayRecord; error?: string };

      if (!response.ok) {
        throw new Error(payload?.error || "Unable to update clay status. Please try again.");
      }

      await fetchClays();
    } catch (error) {
      setClayError(error instanceof Error ? error.message : "Unable to update clay status. Please try again.");
    }
  };

  const toggleGlazeStatus = async (glaze: GlazeRecord) => {
    const nextStatus: Status = glaze.status === "active" ? "retired" : "active";

    try {
      const response = await fetch(`/api/pottery/glazes/${glaze.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const payload = (await response.json()) as { glaze?: GlazeRecord; error?: string };

      if (!response.ok) {
        throw new Error(payload?.error || "Unable to update glaze status. Please try again.");
      }

      await fetchGlazes();
    } catch (error) {
      setGlazeError(error instanceof Error ? error.message : "Unable to update glaze status. Please try again.");
    }
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
                {kilnError ? (
                  <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {kilnError}
                  </div>
                ) : null}
                {isLoadingKilns ? (
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
                              <p className="text-sm font-medium">{kiln.kiln_id}</p>
                              <p className="text-xs text-muted-foreground">
                                Type: {kiln.kiln_type === "manual" ? "Manual" : "Digital"} · Status:{" "}
                                <span className={kiln.status === "active" ? "text-emerald-600" : "text-muted-foreground"}>
                                  {kiln.status === "active" ? "Active" : "Retired"}
                                </span>
                              </p>
                            </div>
                            <span className="text-xs text-muted-foreground">{isOpen ? "Hide" : "Details"}</span>
                          </button>

                          {isOpen ? (
                            <div className="space-y-3 border-t px-4 py-3 text-sm">
                              {kiln.kiln_type === "manual" ? (
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Controls</p>
                                    <span className="rounded-full bg-muted px-2 py-1 text-xs font-medium capitalize">
                                      {kiln.controls}
                                    </span>
                                  </div>
                                  {kiln.controls === "switches" ? (
                                    <p className="text-muted-foreground">
                                      {kiln.switch_count || 0} switch{kiln.switch_count === 1 ? "" : "es"}
                                    </p>
                                  ) : null}
                                  {kiln.controls === "dials" && kiln.dial_settings?.length ? (
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
                                <p className="text-muted-foreground">Digital kiln — manual controls not required.</p>
                              )}

                              <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Status</p>
                                  <p className="font-medium capitalize">{kiln.status}</p>
                                </div>
                                <div className="flex gap-2">
                                  <Button type="button" variant="secondary" onClick={() => void toggleKilnStatus(kiln)}>
                                    {kiln.status === "active" ? "Retire kiln" : "Reactivate kiln"}
                                  </Button>
                                  <Button type="button" onClick={() => handleEditKiln(kiln)}>
                                    Edit
                                  </Button>
                                </div>
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
                  {editingKilnId
                    ? "Update kiln details. Form-only validation matches the admin panel requirements."
                    : "Capture how each kiln is controlled. Form-only validation matches the admin panel requirements."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {editingKilnId ? (
                  <div className="flex flex-col gap-2 rounded-md border border-muted bg-muted/40 px-3 py-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-medium text-foreground">Editing kiln</p>
                      <p className="text-xs">ID: {kilnIdentifier || editingKilnId}</p>
                    </div>
                    <Button variant="ghost" onClick={resetKilnForm} className="sm:w-auto">
                      Cancel edit
                    </Button>
                  </div>
                ) : null}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="kiln-id">Kiln ID</Label>
                    <Input
                      id="kiln-id"
                      placeholder="Freeform kiln identifier"
                      value={kilnIdentifier}
                      onChange={(event) => setKilnIdentifier(event.target.value)}
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
                      <option value="digital">Digital</option>
                      <option value="manual">Manual</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="kiln-status">Status</Label>
                    <select
                      id="kiln-status"
                      className={selectClassName}
                      value={kilnStatus}
                      onChange={(event) => setKilnStatus(event.target.value as Status)}
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
                      <Label htmlFor="manual-control">Controls</Label>
                      <p className="text-sm text-muted-foreground">
                        Choose whether the manual kiln uses switches or dial markings.
                      </p>
                      <select
                        id="manual-control"
                        className={selectClassName}
                        value={kilnControls}
                        onChange={(event) => setKilnControls(event.target.value as KilnControls)}
                        required
                      >
                        <option value="switches">Switches</option>
                        <option value="dials">Dials</option>
                      </select>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="switch-count">
                          {kilnControls === "switches" ? "Number of switches" : "Number of dials"}
                        </Label>
                        <Input
                          id="switch-count"
                          type="number"
                          min={1}
                          value={switchCount}
                          onChange={(event) => setSwitchCount(event.target.value)}
                          placeholder={
                            kilnControls === "switches"
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
                    Digital kilns don’t need extra input—enter the kiln ID and status to save it.
                  </div>
                )}

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm text-muted-foreground">
                    Kiln ID, type, and status are required. Manual kilns need controls and either switch counts or dial settings.
                  </div>
                  <Button type="button" onClick={() => void handleKilnSubmit()} disabled={isSubmittingKiln}>
                    {isSubmittingKiln ? (editingKilnId ? "Saving..." : "Adding...") : editingKilnId ? "Save changes" : "Add kiln"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Cone chart</CardTitle>
              <CardDescription>Quick reference for cone-to-temperature firing targets.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b">
                    <tr className="[&>th]:py-2 [&>th]:text-left [&>th]:text-xs [&>th]:uppercase [&>th]:tracking-wide [&>th]:text-muted-foreground">
                      <th scope="col">Cone</th>
                      <th scope="col">Temperature (°F)</th>
                    </tr>
                  </thead>
                  <tbody className="[&>tr:not(:last-child)]:border-b">
                    {coneChart.map((row) => (
                      <tr key={row.cone} className="[&>td]:py-2">
                        <td className="font-medium">{row.cone}</td>
                        <td className="text-muted-foreground">{row.temperature}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pottery" className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Clay bodies</CardTitle>
                <CardDescription>Track active and retired clay bodies for studio use.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {clayError ? (
                  <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {clayError}
                  </div>
                ) : null}
                {isLoadingClays ? (
                  <p className="text-sm text-muted-foreground">Loading clay bodies...</p>
                ) : clays.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No clay bodies added yet.</p>
                ) : (
                  <div className="space-y-3">
                    {clays.map((clay) => (
                      <div key={clay.id} className="flex items-center justify-between rounded-lg border px-4 py-3">
                        <div>
                          <p className="text-sm font-medium">{clay.clay_body}</p>
                          <p className="text-xs text-muted-foreground capitalize">Status: {clay.status}</p>
                        </div>
                        <Button type="button" variant="secondary" onClick={() => void toggleClayStatus(clay)}>
                          {clay.status === "active" ? "Retire" : "Reactivate"}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="h-full">
              <CardHeader>
                <CardTitle>Add clay</CardTitle>
                <CardDescription>Log new clay bodies with their current status.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="clay-body">Clay Body</Label>
                  <Input
                    id="clay-body"
                    placeholder="e.g., B-Mix"
                    value={clayBody}
                    onChange={(event) => setClayBody(event.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clay-status">Status</Label>
                  <select
                    id="clay-status"
                    className={selectClassName}
                    value={clayStatus}
                    onChange={(event) => setClayStatus(event.target.value as Status)}
                    required
                  >
                    <option value="active">Active</option>
                    <option value="retired">Retired</option>
                  </select>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-muted-foreground">Clay body and status are required.</p>
                  <Button type="button" onClick={() => void handleClaySubmit()} disabled={isSubmittingClay}>
                    {isSubmittingClay ? "Adding..." : "Add clay"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Glazes</CardTitle>
                <CardDescription>Manage glaze name, brand, and availability.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {glazeError ? (
                  <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {glazeError}
                  </div>
                ) : null}
                {isLoadingGlazes ? (
                  <p className="text-sm text-muted-foreground">Loading glazes...</p>
                ) : glazes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No glazes added yet.</p>
                ) : (
                  <div className="space-y-3">
                    {glazes.map((glaze) => (
                      <div key={glaze.id} className="flex items-center justify-between rounded-lg border px-4 py-3">
                        <div>
                          <p className="text-sm font-medium">{glaze.glaze_name}</p>
                          <p className="text-xs text-muted-foreground">
                            Brand: {glaze.brand} · Status: <span className="capitalize">{glaze.status}</span>
                          </p>
                        </div>
                        <Button type="button" variant="secondary" onClick={() => void toggleGlazeStatus(glaze)}>
                          {glaze.status === "active" ? "Retire" : "Reactivate"}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="h-full">
              <CardHeader>
                <CardTitle>Add glaze</CardTitle>
                <CardDescription>Add glaze names, brands, and their current status.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="glaze-name">Glaze Name</Label>
                  <Input
                    id="glaze-name"
                    placeholder="e.g., Chun Blue"
                    value={glazeName}
                    onChange={(event) => setGlazeName(event.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="glaze-brand">Brand</Label>
                  <Input
                    id="glaze-brand"
                    placeholder="e.g., Amaco"
                    value={glazeBrand}
                    onChange={(event) => setGlazeBrand(event.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="glaze-status">Status</Label>
                  <select
                    id="glaze-status"
                    className={selectClassName}
                    value={glazeStatus}
                    onChange={(event) => setGlazeStatus(event.target.value as Status)}
                    required
                  >
                    <option value="active">Active</option>
                    <option value="retired">Retired</option>
                  </select>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-muted-foreground">Glaze name, brand, and status are required.</p>
                  <Button type="button" onClick={() => void handleGlazeSubmit()} disabled={isSubmittingGlaze}>
                    {isSubmittingGlaze ? "Adding..." : "Add glaze"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
