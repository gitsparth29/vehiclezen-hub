import { createFileRoute } from "@tanstack/react-router";
import { ModulePlaceholder } from "@/components/app/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/reports")({
  component: () => (
    <ModulePlaceholder
      title="Reports & Analytics"
      description="Cost-by-category, monthly expense trends, fuel consumption, and driver performance reports."
    />
  ),
});
