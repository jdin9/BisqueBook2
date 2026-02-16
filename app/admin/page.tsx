"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useUser } from "@clerk/nextjs";
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

type StudioRecord = {
  id: string;
  name: string;
  admin_user_id: string;
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

export default function AdminPage() {
  const { user } = useUser();
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

  const [studios, setStudios] = useState<StudioRecord[]>([]);
  const [activeStudioName, setActiveStudioName] = useState<string | null>(null);
  const [joinStudioName, setJoinStudioName] = useState("");
  const [joinStudioPassword, setJoinStudioPassword] = useState("");
  const [newStudioName, setNewStudioName] = useState("");
  const [newStudioPassword, setNewStudioPassword] = useState("");
  const [studioError, setStudioError] = useState<string | null>(null);
  const [studioSuccess, setStudioSuccess] = useState<string | null>(null);
  const [isSubmittingStudio, setIsSubmittingStudio] = useState(false);

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


  const activeStudio = useMemo(
    () => studios.find((studio) => studio.name === activeStudioName) ?? null,
    [studios, activeStudioName],
  );
  const isActiveStudioAdmin = Boolean(activeStudio && user?.id && activeStudio.admin_user_id === user.id);
  const canManageStudioResources = Boolean(activeStudioName && isActiveStudioAdmin);

  const fetchStudios = useCallback(async () => {
    setStudioError(null);

    const { data, error } = await supabase.from("Studios").select("id, name, admin_user_id").order("name");

    if (error) {
      setStudioError(
        isMissingTable(error)
          ? "Studios table not found. For existing projects, run supabase/existing_project_studio_migration.sql in Supabase SQL editor."
          : "Unable to load studios. Please try again.",
      );
      return;
    }

    const loadedStudios = (data as StudioRecord[]) || [];
    setStudios(loadedStudios);

    if (activeStudioName && loadedStudios.some((studio) => studio.name === activeStudioName)) {
      return;
    }

    const ownedStudio = loadedStudios.find((studio) => studio.admin_user_id === user?.id);
    setActiveStudioName(ownedStudio?.name ?? null);
  }, [activeStudioName, supabase, user?.id]);

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

    if (!activeStudioName) {
      setKilns([]);
      setIsLoadingKilns(false);
      return;
    }

    const { data, error } = await supabase
      .from("Kilns")
      .select("id, kiln_id, kiln_type, controls, dial_settings, switch_count, status")
      .eq("studio_name", activeStudioName)
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
  }, [activeStudioName, supabase]);

  const fetchClays = useCallback(async () => {
    setIsLoadingClays(true);
    setClayError(null);

    if (!activeStudioName) {
      setClays([]);
      setIsLoadingClays(false);
      return;
    }

    const { data, error } = await supabase
      .from("Clays")
      .select("id, clay_body, status")
      .eq("studio_name", activeStudioName)
      .order("clay_body", { ascending: true });

    if (error) {
      setClayError(
        isMissingTable(error)
          ? "Clays table not found. Please create it in Supabase using supabase/kilns.sql."
          : "Unable to load clay bodies. Please try again.",
      );
      setIsLoadingClays(false);
      return;
    }

    setClays((data as ClayRecord[]) || []);
    setIsLoadingClays(false);
  }, [activeStudioName, supabase]);

  const fetchGlazes = useCallback(async () => {
    setIsLoadingGlazes(true);
    setGlazeError(null);

    if (!activeStudioName) {
      setGlazes([]);
      setIsLoadingGlazes(false);
      return;
    }

    const { data, error } = await supabase
      .from("Glazes")
      .select("id, glaze_name, brand, status")
      .eq("studio_name", activeStudioName)
      .order("glaze_name", { ascending: true });

    if (error) {
      setGlazeError(
        isMissingTable(error)
          ? "Glazes table not found. Please create it in Supabase using supabase/kilns.sql."
          : "Unable to load glazes. Please try again.",
      );
      setIsLoadingGlazes(false);
      return;
    }

    setGlazes((data as GlazeRecord[]) || []);
    setIsLoadingGlazes(false);
  }, [activeStudioName, supabase]);

  const handleJoinStudio = async () => {
    setStudioError(null);
    setStudioSuccess(null);

    const trimmedName = joinStudioName.trim();
    const trimmedPassword = joinStudioPassword.trim();

    if (!trimmedName || !trimmedPassword) {
      setStudioError("Studio name and password are required to join.");
      return;
    }

    setIsSubmittingStudio(true);

    const { data, error } = await supabase
      .from("Studios")
      .select("name, admin_user_id")
      .eq("name", trimmedName)
      .eq("password", trimmedPassword)
      .single();

    if (error || !data) {
      setStudioError("Studio name/password did not match. Please try again.");
      setIsSubmittingStudio(false);
      return;
    }

    setActiveStudioName(trimmedName);
    setStudioSuccess(
      data.admin_user_id === user?.id
        ? `Using your admin studio: ${trimmedName}`
        : `Joined studio: ${trimmedName}. Kiln and Pottery admin settings are only available to this studio admin.`,
    );
    setJoinStudioPassword("");
    setIsSubmittingStudio(false);
  };

  const handleCreateStudio = async () => {
    setStudioError(null);
    setStudioSuccess(null);

    const trimmedName = newStudioName.trim();
    const trimmedPassword = newStudioPassword.trim();

    if (!trimmedName || !trimmedPassword) {
      setStudioError("Studio name and password are required to create a studio.");
      return;
    }

    if (!user?.id) {
      setStudioError("You must be signed in to create a studio.");
      return;
    }

    setIsSubmittingStudio(true);

    const { error } = await supabase.from("Studios").insert({
      name: trimmedName,
      password: trimmedPassword,
      admin_user_id: user.id,
    });

    if (error) {
      setStudioError(
        error.code === "23505"
          ? "That studio name is already taken. Please choose a different name."
          : "Unable to create studio right now. Please try again.",
      );
      setIsSubmittingStudio(false);
      return;
    }

    setStudioSuccess(`Studio created: ${trimmedName}`);
    setActiveStudioName(trimmedName);
    setJoinStudioName(trimmedName);
    setNewStudioName("");
    setNewStudioPassword("");
    await fetchStudios();
    setIsSubmittingStudio(false);
  };

  // We need to populate Supabase-backed admin tables on mount; state updates are contained within each fetch helper.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    void fetchStudios();
  }, [fetchStudios]);

  useEffect(() => {
    void fetchKilns();
    void fetchClays();
    void fetchGlazes();
  }, [fetchKilns, fetchClays, fetchGlazes, activeStudioName]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleKilnSubmit = async () => {
    setKilnError(null);

    if (!activeStudioName) {
      setKilnError("Join or create a studio first.");
      return;
    }

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
      studio_name: activeStudioName,
    };

    const { error } = editingKilnId
      ? await supabase.from("Kilns").update(payload).eq("id", editingKilnId).eq("studio_name", activeStudioName)
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

    if (!activeStudioName) {
      setClayError("Join or create a studio first.");
      return;
    }

    const trimmedBody = clayBody.trim();
    if (!trimmedBody) {
      setClayError("Clay body is required.");
      return;
    }

    setIsSubmittingClay(true);

    const { error } = await supabase
      .from("Clays")
      .insert({ clay_body: trimmedBody, status: clayStatus, studio_name: activeStudioName });

    if (error) {
      setClayError(
        isMissingTable(error)
          ? "Clays table not found. Please create it in Supabase using supabase/kilns.sql."
          : "Unable to add clay body right now. Please try again.",
      );
      setIsSubmittingClay(false);
      return;
    }

    resetClayForm();
    await fetchClays();
    setIsSubmittingClay(false);
  };

  const handleGlazeSubmit = async () => {
    setGlazeError(null);

    if (!activeStudioName) {
      setGlazeError("Join or create a studio first.");
      return;
    }

    const trimmedName = glazeName.trim();
    const trimmedBrand = glazeBrand.trim();

    if (!trimmedName || !trimmedBrand) {
      setGlazeError("Glaze name and brand are required.");
      return;
    }

    setIsSubmittingGlaze(true);

    const { error } = await supabase
      .from("Glazes")
      .insert({ glaze_name: trimmedName, brand: trimmedBrand, status: glazeStatus, studio_name: activeStudioName });

    if (error) {
      setGlazeError(
        isMissingTable(error)
          ? "Glazes table not found. Please create it in Supabase using supabase/kilns.sql."
          : "Unable to add glaze right now. Please try again.",
      );
      setIsSubmittingGlaze(false);
      return;
    }

    resetGlazeForm();
    await fetchGlazes();
    setIsSubmittingGlaze(false);
  };

  const toggleKilnStatus = async (kiln: KilnRecord) => {
    const nextStatus: Status = kiln.status === "active" ? "retired" : "active";
    const { error } = await supabase.from("Kilns").update({ status: nextStatus }).eq("id", kiln.id).eq("studio_name", activeStudioName);

    if (error) {
      setKilnError("Unable to update kiln status. Please try again.");
      return;
    }

    await fetchKilns();
    setSelectedKilnId(kiln.id);
  };

  const toggleClayStatus = async (clay: ClayRecord) => {
    const nextStatus: Status = clay.status === "active" ? "retired" : "active";
    const { error } = await supabase.from("Clays").update({ status: nextStatus }).eq("id", clay.id).eq("studio_name", activeStudioName);

    if (error) {
      setClayError("Unable to update clay status. Please try again.");
      return;
    }

    await fetchClays();
  };

  const toggleGlazeStatus = async (glaze: GlazeRecord) => {
    const nextStatus: Status = glaze.status === "active" ? "retired" : "active";
    const { error } = await supabase.from("Glazes").update({ status: nextStatus }).eq("id", glaze.id).eq("studio_name", activeStudioName);

    if (error) {
      setGlazeError("Unable to update glaze status. Please try again.");
      return;
    }

    await fetchGlazes();
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
          {canManageStudioResources ? <TabsTrigger value="kiln">Kiln</TabsTrigger> : null}
          {canManageStudioResources ? <TabsTrigger value="pottery">Pottery</TabsTrigger> : null}
        </TabsList>

        <TabsContent value="studio" className="space-y-4">
          <Tabs defaultValue="join-studio" className="space-y-4">
            <TabsList>
              <TabsTrigger value="join-studio">Join an existing studio</TabsTrigger>
              <TabsTrigger value="start-studio">Start a new studio</TabsTrigger>
            </TabsList>

            <TabsContent value="join-studio">
              <Card>
                <CardHeader>
                  <CardTitle>Join an existing studio</CardTitle>
                  <CardDescription>Use the studio credentials shared by your studio admin.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {studioError ? (
                    <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                      {studioError}
                    </div>
                  ) : null}
                  {studioSuccess ? (
                    <div className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700">
                      {studioSuccess}
                    </div>
                  ) : null}

                  <div className="rounded-lg border bg-muted/20 px-3 py-2 text-sm">
                    <span className="text-muted-foreground">Active studio:</span>{" "}
                    <span className="font-medium">{activeStudioName ?? "None selected"}</span>
                  </div>

                  <div className="rounded-lg border bg-muted/20 px-3 py-2 text-sm">
                    <span className="text-muted-foreground">Admin access:</span>{" "}
                    <span className="font-medium">
                      {canManageStudioResources
                        ? "You can manage kiln and pottery admin settings for this studio."
                        : "Only the studio admin can manage kiln and pottery settings."}
                    </span>
                  </div>

                  {studios.length ? (
                    <div className="space-y-2">
                      <Label htmlFor="existing-studio-picker">Available studios</Label>
                      <select
                        id="existing-studio-picker"
                        className={selectClassName}
                        value={activeStudioName ?? ""}
                        onChange={(event) => setActiveStudioName(event.target.value || null)}
                      >
                        <option value="" disabled>
                          Select a studio
                        </option>
                        {studios.map((studio) => (
                          <option key={studio.id} value={studio.name}>
                            {studio.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : null}

                  <div className="space-y-2">
                    <Label htmlFor="join-studio-name">Studio Name</Label>
                    <Input
                      id="join-studio-name"
                      placeholder="Enter studio name"
                      value={joinStudioName}
                      onChange={(event) => setJoinStudioName(event.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="join-studio-password">Studio Password</Label>
                    <Input
                      id="join-studio-password"
                      type="password"
                      placeholder="Enter studio password"
                      value={joinStudioPassword}
                      onChange={(event) => setJoinStudioPassword(event.target.value)}
                    />
                  </div>

                  <Button type="button" onClick={() => void handleJoinStudio()} disabled={isSubmittingStudio}>
                    {isSubmittingStudio ? "Joining..." : "Join studio"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="start-studio">
              <Card>
                <CardHeader>
                  <CardTitle>Start a new studio</CardTitle>
                  <CardDescription>Create a new studio space and set an initial access password.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-studio-name">Studio Name</Label>
                    <Input
                      id="new-studio-name"
                      placeholder="Enter a new studio name"
                      value={newStudioName}
                      onChange={(event) => setNewStudioName(event.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-studio-password">Studio Password</Label>
                    <Input
                      id="new-studio-password"
                      type="password"
                      placeholder="Create a studio password"
                      value={newStudioPassword}
                      onChange={(event) => setNewStudioPassword(event.target.value)}
                    />
                  </div>

                  <Button type="button" onClick={() => void handleCreateStudio()} disabled={isSubmittingStudio}>
                    {isSubmittingStudio ? "Creating..." : "Create studio"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
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
                  <Button type="button" onClick={() => void handleKilnSubmit()} disabled={isSubmittingKiln || !canManageStudioResources}>
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
                  <Button type="button" onClick={() => void handleClaySubmit()} disabled={isSubmittingClay || !canManageStudioResources}>
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
                  <Button type="button" onClick={() => void handleGlazeSubmit()} disabled={isSubmittingGlaze || !canManageStudioResources}>
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
