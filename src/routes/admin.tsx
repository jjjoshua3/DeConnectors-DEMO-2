import { createFileRoute } from "@tanstack/react-router";
import { AdminPage } from "@/components/admin-page";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Beheer · DE CONNECTORS" }] }),
  component: AdminPage,
});
