import { createFileRoute } from "@tanstack/react-router";
import { ModulePlaceholder } from "@/components/app/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/vehicles")({
  component: () => (
    <ModulePlaceholder
      title="Vehicles"
      description="Full CRUD with registration, make, model, status, insurance & MOT expiry tracking, and driver assignment."
    />
  ),
});
