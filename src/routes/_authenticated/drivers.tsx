import { createFileRoute } from "@tanstack/react-router";
import { ModulePlaceholder } from "@/components/app/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/drivers")({
  component: () => (
    <ModulePlaceholder
      title="Drivers"
      description="Manage driver profiles, license expiry, contact details, and vehicle assignments."
    />
  ),
});
