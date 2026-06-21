import { createFileRoute } from "@tanstack/react-router";
import { ModulePlaceholder } from "@/components/app/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/maintenance")({
  component: () => (
    <ModulePlaceholder
      title="Maintenance"
      description="Track maintenance issues by priority and status. Table view and Kanban board coming next."
    />
  ),
});
