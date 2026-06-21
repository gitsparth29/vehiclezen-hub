import { createFileRoute } from "@tanstack/react-router";
import { ModulePlaceholder } from "@/components/app/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/services")({
  component: () => (
    <ModulePlaceholder
      title="Services"
      description="Log oil changes, tire rotations, brakes, inspections and engine repairs with cost tracking."
    />
  ),
});
