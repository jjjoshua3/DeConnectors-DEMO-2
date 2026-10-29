import { createFileRoute } from "@tanstack/react-router";
import { getSql } from "@/lib/db";

export const Route = createFileRoute("/uploads/$id")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const id = Number(params.id);
        if (!Number.isInteger(id) || id < 1) return new Response("Not found", { status: 404 });
        const sql = await getSql();
        const rows = await sql<{ mime: string; data: string }>`
          select mime, data from media_files where id = ${id} limit 1`;
        const row = rows[0];
        if (!row) return new Response("Not found", { status: 404 });
        const bytes = Buffer.from(row.data, "base64");
        return new Response(bytes, {
          status: 200,
          headers: {
            "content-type": row.mime,
            "cache-control": "public, max-age=31536000, immutable",
          },
        });
      },
    },
  },
});
