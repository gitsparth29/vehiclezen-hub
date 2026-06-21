import { createFileRoute } from "@tanstack/react-router";
import { ModulePlaceholder } from "@/components/app/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/alerts")({
  component: () => (
    <ModulePlaceholder
      title="Alerts"
      description="Inbox for expired documents, service due, maintenance, and license expiry alerts."
    />
  ),
});
