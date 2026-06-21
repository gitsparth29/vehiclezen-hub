import { createFileRoute } from "@tanstack/react-router";
import { ModulePlaceholder } from "@/components/app/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/rentals")({
  component: () => (
    <ModulePlaceholder
      title="Rentals"
      description="Manage rental bookings with customer, dates, daily price and auto-calculated totals."
    />
  ),
});
