import { clients, projects } from "@/data/content";
import { posts } from "@/data/blog";
import { defaultPage } from "@/data/page-copy";
import { getSql, type Sql } from "@/lib/db";

/** Fill empty tables once from the original site copy. Later deletes stay deleted. */
export async function seedCms() {
  const sql = await getSql();
  const flag = `seeded-${SITE}`;
  const flagged = await sql<{ key: string }>`select key from cms_flags where key = ${flag}`;
  if (flagged.length > 0) return;

  const projectCount = await sql<{ n: number }>`select count(*) as n from projects where site = ${SITE}`;
  if (Number(projectCount[0]?.n ?? 0) === 0) {
    for (let index = 0; index < projects.length; index += 1) {
      const item = projects[index];
      await sql`insert into projects (title, img, media, kind, body, sort_order, published, site)
        values (${item.title}, ${item.img}, ${item.media}, ${item.kind}, ${item.text}, ${index}, true, ${SITE})`;
    }
  }

  const clientCount = await sql<{ n: number }>`select count(*) as n from clients where site = ${SITE}`;
  if (Number(clientCount[0]?.n ?? 0) === 0) {
    for (let index = 0; index < clients.length; index += 1) {
      const item = clients[index];
      await sql`insert into clients (href, img, alt, sort_order, published, site)
        values (${item.href}, ${item.img}, ${item.alt}, ${index}, true, ${SITE})`;
    }
  }

  const postCount = await sql<{ n: number }>`select count(*) as n from posts where site = ${SITE}`;
  if (Number(postCount[0]?.n ?? 0) === 0) {
    for (let index = 0; index < posts.length; index += 1) {
      const item = posts[index];
      await sql`insert into posts (slug, title, month, day, year, excerpt, image, html, published, author_id, sort_order, site)
        values (${item.slug}, ${item.title}, ${item.month}, ${item.day}, ${item.year}, ${item.excerpt}, ${item.image}, ${item.html}, true, null, ${index}, ${SITE})`;
    }
  }

  const page = await sql<{ id: number }>`select id from page_settings where id = 1 and site = ${SITE}`;
  if (page.length === 0) {
    await sql`insert into page_settings (id, data, site) values (1, ${JSON.stringify(defaultPage)}::jsonb, ${SITE})`;
  }

  await sql`insert into cms_flags (key, value) values (${flag}, '1') on conflict (key) do nothing`;
}

export async function readPage(sql: Sql) {
  const rows = await sql<{ data: unknown }>`select data from page_settings where id = 1 and site = ${SITE}`;
  return rows[0]?.data ?? null;
}
