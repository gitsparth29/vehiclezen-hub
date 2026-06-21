import { createFileRoute } from "@tanstack/react-router";
import { ModulePlaceholder } from "@/components/app/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/settings")({
  component: () => (
    <ModulePlaceholder
      title="Settings"
      description="Company profile, user roles (admin/manager/driver), theme, currency and timezone preferences."
    />
  ),
});
