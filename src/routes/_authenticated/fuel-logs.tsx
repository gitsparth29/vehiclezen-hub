import { createFileRoute } from "@tanstack/react-router";
import { ModulePlaceholder } from "@/components/app/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/fuel-logs")({
  component: () => (
    <ModulePlaceholder
      title="Fuel Logs"
      description="Track fuel consumption per vehicle with monthly cost charts and average MPG."
    />
  ),
});
