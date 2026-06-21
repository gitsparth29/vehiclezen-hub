import { createFileRoute } from "@tanstack/react-router";
import { ModulePlaceholder } from "@/components/app/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/documents")({
  component: () => (
    <ModulePlaceholder
      title="Documents"
      description="Upload PDFs and images, preview, download, and get automatic expiry alerts."
    />
  ),
});
