import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenantId } from "@/hooks/use-tenant";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useUiStore } from "@/stores/ui-store";
import { Moon, Sun } from "lucide-react";
import { useEffect } from "react";

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
});

const companySchema = z.object({
  name: z.string().min(2, "Name is required"),
});
const profileSchema = z.object({
  full_name: z.string().min(2, "Full name is required"),
});

function SettingsPage() {
  const { data: tenantId } = useTenantId();
  const qc = useQueryClient();
  const { theme, setTheme } = useUiStore();

  const { data: tenant, isLoading: tLoading } = useQuery({
    queryKey: ["tenant", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase.from("tenants").select("*").eq("id", tenantId!).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: profile, isLoading: pLoading } = useQuery({
    queryKey: ["my-profile"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      const { data, error } = await supabase.from("profiles").select("*").eq("id", u.user.id).single();
      if (error) throw error;
      return data;
    },
  });

  const companyForm = useForm<z.infer<typeof companySchema>>({ resolver: zodResolver(companySchema), defaultValues: { name: "" } });
  const profileForm = useForm<z.infer<typeof profileSchema>>({ resolver: zodResolver(profileSchema), defaultValues: { full_name: "" } });

  useEffect(() => { if (tenant) companyForm.reset({ name: tenant.name }); }, [tenant]);
  useEffect(() => { if (profile) profileForm.reset({ full_name: profile.full_name || "" }); }, [profile]);

  const saveCompany = useMutation({
    mutationFn: async (v: z.infer<typeof companySchema>) => {
      const { error } = await supabase.from("tenants").update({ name: v.name }).eq("id", tenantId!);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Company updated"); qc.invalidateQueries({ queryKey: ["tenant"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const saveProfile = useMutation({
    mutationFn: async (v: z.infer<typeof profileSchema>) => {
      const { data: u } = await supabase.auth.getUser();
      const { error } = await supabase.from("profiles").update({ full_name: v.full_name }).eq("id", u.user!.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Profile updated"); qc.invalidateQueries({ queryKey: ["my-profile"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your company profile and preferences.</p>
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-medium">Company Profile</h2>
        <p className="text-sm text-muted-foreground">Your organization name shown across the app.</p>
        {tLoading ? <Skeleton className="mt-4 h-10" /> : (
          <form onSubmit={companyForm.handleSubmit((v) => saveCompany.mutate(v))} className="mt-4 space-y-4">
            <div>
              <Label htmlFor="company-name">Company Name</Label>
              <Input id="company-name" {...companyForm.register("name")} className="mt-1" />
              {companyForm.formState.errors.name && <p className="mt-1 text-xs text-destructive">{companyForm.formState.errors.name.message}</p>}
            </div>
            <Button type="submit" disabled={saveCompany.isPending}>Save</Button>
          </form>
        )}
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-medium">Your Profile</h2>
        {pLoading ? <Skeleton className="mt-4 h-10" /> : (
          <form onSubmit={profileForm.handleSubmit((v) => saveProfile.mutate(v))} className="mt-4 space-y-4">
            <div>
              <Label htmlFor="full-name">Full Name</Label>
              <Input id="full-name" {...profileForm.register("full_name")} className="mt-1" />
              {profileForm.formState.errors.full_name && <p className="mt-1 text-xs text-destructive">{profileForm.formState.errors.full_name.message}</p>}
            </div>
            <div>
              <Label>Email</Label>
              <Input value={profile?.email || ""} disabled className="mt-1" />
            </div>
            <Button type="submit" disabled={saveProfile.isPending}>Save</Button>
          </form>
        )}
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-medium">Preferences</h2>
        <div className="mt-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Appearance</p>
            <p className="text-xs text-muted-foreground">Toggle between light and dark theme.</p>
          </div>
          <Button variant="outline" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
            {theme === "dark" ? <Sun className="mr-2 size-4" /> : <Moon className="mr-2 size-4" />}
            {theme === "dark" ? "Light" : "Dark"} mode
          </Button>
        </div>
      </Card>
    </div>
  );
}
