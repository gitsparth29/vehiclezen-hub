import { createFileRoute } from "@tanstack/react-router";
import { ModulePlaceholder } from "@/components/app/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/trip-logs")({
  component: () => (
    <ModulePlaceholder
      title="Trip Logs"
      description="Record trips with auto-calculated duration, distance, and average speed."
    />
  ),
});
