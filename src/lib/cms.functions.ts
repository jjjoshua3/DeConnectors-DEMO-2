import { createServerFn } from "@tanstack/react-start";
import { mergePage, type PageCopy } from "@/data/page-copy";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";

const SITE = process.env.SITE_KEY || "demo2";

export type Role = "admin" | "editor" | "author";

export type PublicProject = {
  id: number;
  title: string;
  img: string;
  media: string;
  kind: "image" | "video";
  text: string;
};

export type PublicClient = { id: number; href: string; img: string; alt: string };

export type PublicPost = {
  id: number;
  slug: string;
  title: string;
  month: string;
  day: string;
  year: string;
  excerpt: string;
  image: string;
  html?: string;
};

type Profile = { userId: string; email: string; name: string; role: Role };

const ROLES: Role[] = ["admin", "editor", "author"];
const IMAGE_MIME = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);

async function ready() {
  const { seedCms } = await import("./cms-seed.server");
  await seedCms();
  return getSql();
}

function clip(value: unknown, max: number) {
  return String(value ?? "").slice(0, max);
}

function cleanUrl(value: unknown, allowEmpty = true) {
  const url = clip(value, 2000).trim();
  if (!url) {
    if (allowEmpty) return "";
    throw new Error("Een afbeelding is verplicht.");
  }
  if (url.startsWith("/media/") || url.startsWith("/uploads/")) return url;
  if (url.startsWith("https://") || url.startsWith("http://")) return url;
  throw new Error("Gebruik een bestand, een /media-pad of een http-link.");
}

function asBool(value: unknown) {
  return value === true || value === "true";
}

function asId(value: unknown) {
  const id = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(id) || id < 0 || id > 1_000_000_000) throw new Error("Ongeldig item.");
  return id;
}

function slugify(value: string) {
  const base = value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
  return base || "bericht";
}

function blocks(value: unknown, max: number) {
  if (!Array.isArray(value)) return [];
  return value.slice(0, max).map((item) => {
    const row = item && typeof item === "object" ? (item as { title?: unknown; body?: unknown }) : {};
    return { title: clip(row.title, 180).trim(), body: clip(row.body, 2000).trim() };
  });
}

function cleanPage(input: unknown): PageCopy {
  const source = input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  const merged = mergePage({
    ...source,
    styleCards: blocks(source.styleCards, 3),
    services: blocks(source.services, 8).filter((item) => item.title || item.body),
  });
  const textKeys: Array<keyof PageCopy> = [
    "heroStrong",
    "heroLine",
    "aboutTitle",
    "aboutLeadBefore",
    "aboutLeadHighlight",
    "aboutLeadAfter",
    "aboutLeftStrong",
    "aboutLeftRest",
    "aboutRightStrong",
    "aboutRightRest",
    "styleTitle",
    "workCta",
    "servicesTitle",
    "celebrateTitle",
    "celebrateCta",
    "teamTitle",
    "teamLead",
    "teamName",
    "teamRole",
    "strategyBefore",
    "strategyHighlight",
    "strategyAfter",
    "clientsTitleBefore",
    "clientsTitleHighlight",
    "portfolioTitle",
    "contactTitle",
    "contactName",
    "footer",
  ];
  for (const key of textKeys) {
    const value = merged[key];
    if (typeof value === "string") merged[key] = clip(value, 4000) as never;
  }
  merged.crowdImage = cleanUrl(merged.crowdImage);
  merged.clientsImage = cleanUrl(merged.clientsImage);
  merged.teamPhoto = cleanUrl(merged.teamPhoto);
  merged.teamEmail = clip(merged.teamEmail, 200).trim();
  merged.teamX = cleanUrl(merged.teamX);
  merged.teamLinkedin = cleanUrl(merged.teamLinkedin);
  merged.contactEmail = clip(merged.contactEmail, 200).trim();
  if (merged.services.length === 0) throw new Error("Minstens één dienst is nodig.");
  return merged;
}

async function profileFor(userId: string): Promise<Profile> {
  const sql = await ready();
  const existing = await sql<{ user_id: string; email: string; name: string; role: string }>`
    select user_id, email, name, role from profiles where user_id = ${userId}`;
  if (existing[0] && ROLES.includes(existing[0].role as Role)) {
    return {
      userId,
      email: existing[0].email,
      name: existing[0].name,
      role: existing[0].role as Role,
    };
  }
  const users = await sql<{ email: string; name: string }>`
    select email, name from "user" where id = ${userId}`;
  const email = users[0]?.email ?? "";
  const name = users[0]?.name ?? "";
  const admins = await sql<{ user_id: string }>`select user_id from profiles where role = 'admin' limit 1`;
  const role: Role = admins.length === 0 ? "admin" : "author";
  await sql`insert into profiles (user_id, email, name, role)
    values (${userId}, ${email}, ${name}, ${role})
    on conflict (user_id) do nothing`;
  const again = await sql<{ email: string; name: string; role: string }>`
    select email, name, role from profiles where user_id = ${userId}`;
  const stored = ROLES.includes(again[0]?.role as Role) ? (again[0].role as Role) : role;
  return { userId, email: again[0]?.email ?? email, name: again[0]?.name ?? name, role: stored };
}

function assertSite(role: Role) {
  if (role !== "admin" && role !== "editor") {
    throw new Error("Alleen een beheerder of redacteur mag dit aanpassen.");
  }
}

async function mapProjects(publishedOnly: boolean): Promise<PublicProject[]> {
  const sql = await ready();
  const rows = await sql<{
    id: number;
    title: string;
    img: string;
    media: string;
    kind: string;
    body: string;
  }>`select id, title, img, media, kind, body from projects
     where site = ${SITE} and (${publishedOnly} = false or published = true)
     order by sort_order, id`;
  return rows.map((row) => ({
    id: Number(row.id),
    title: row.title,
    img: row.img,
    media: row.media,
    kind: row.kind === "video" ? "video" : "image",
    text: row.body,
  }));
}

export const getPublicSite = createServerFn({ method: "GET" }).handler(async () => {
  const sql = await ready();
  const raw = await sql<{ data: unknown }>`select data from page_settings where id = 1 and site = ${SITE}`;
  const projects = await mapProjects(true);
  const clients = await sql<PublicClient>`
    select id, href, img, alt from clients where site = ${SITE} and published = true order by sort_order, id`;
  return {
    page: mergePage(raw[0]?.data ?? null),
    projects,
    clients: clients.map((row) => ({ ...row, id: Number(row.id) })),
  };
});

export const getPublicPosts = createServerFn({ method: "GET" }).handler(async () => {
  const sql = await ready();
  const rows = await sql<PublicPost>`
    select id, slug, title, month, day, year, excerpt, image
    from posts where site = ${SITE} and published = true order by sort_order, id`;
  return rows.map((row) => ({ ...row, id: Number(row.id) }));
});

export const getPublicPost = createServerFn({ method: "GET" })
  .validator((slug: string) => clip(slug, 120).trim())
  .handler(async ({ data: slug }) => {
    const sql = await ready();
    const rows = await sql<PublicPost>`
      select id, slug, title, month, day, year, excerpt, image, html
      from posts where site = ${SITE} and slug = ${slug} and published = true limit 1`;
    const row = rows[0];
    return row ? { ...row, id: Number(row.id) } : null;
  });

export const registrationOpen = createServerFn({ method: "GET" }).handler(async () => {
  const sql = await ready();
  const admins = await sql<{ user_id: string }>`select user_id from profiles where role = 'admin' limit 1`;
  return { open: admins.length === 0 };
});

export const getAdminState = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const me = await profileFor(context.userId);
    const sql = await getSql();
    const pageRaw = await sql<{ data: unknown }>`select data from page_settings where id = 1 and site = ${SITE}`;
    const projects = await sql<{
      id: number;
      title: string;
      img: string;
      media: string;
      kind: string;
      body: string;
      published: boolean;
    }>`select id, title, img, media, kind, body, published from projects order by sort_order, id`;
    const clients = await sql<{
      id: number;
      href: string;
      img: string;
      alt: string;
      published: boolean;
    }>`select id, href, img, alt, published from clients order by sort_order, id`;
    const posts = await sql<{
      id: number;
      slug: string;
      title: string;
      month: string;
      day: string;
      year: string;
      excerpt: string;
      image: string;
      html: string;
      published: boolean;
      author_id: string | null;
    }>`select id, slug, title, month, day, year, excerpt, image, html, published, author_id
       from posts
       where (${me.role} <> 'author' or author_id = ${me.userId})
       order by sort_order, id`;
    const users =
      me.role === "admin"
        ? await sql<{ user_id: string; email: string; name: string; role: string }>`
            select user_id, email, name, role from profiles order by created_at, email`
        : [];
    return {
      me,
      page: mergePage(pageRaw[0]?.data ?? null),
      projects: projects.map((row) => ({
        id: Number(row.id),
        title: row.title,
        img: row.img,
        media: row.media,
        kind: row.kind === "video" ? "video" : "image",
        text: row.body,
        published: Boolean(row.published),
      })),
      clients: clients.map((row) => ({ ...row, id: Number(row.id), published: Boolean(row.published) })),
      posts: posts.map((row) => ({ ...row, id: Number(row.id), published: Boolean(row.published) })),
      users: users.map((row) => ({
        userId: row.user_id,
        email: row.email,
        name: row.name,
        role: row.role as Role,
      })),
    };
  });

export const savePage = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: PageCopy) => cleanPage(input))
  .handler(async ({ context, data }) => {
    const me = await profileFor(context.userId);
    assertSite(me.role);
    const sql = await getSql();
    await sql`insert into page_settings (id, data) values (1, ${JSON.stringify(data)}::jsonb)
      on conflict (id) do update set data = excluded.data, updated_at = now()`;
    return { ok: true as const };
  });

type ProjectInput = {
  id: number;
  title: string;
  img: string;
  media: string;
  kind: "image" | "video";
  text: string;
  published: boolean;
};

function cleanProject(input: ProjectInput): ProjectInput {
  const title = clip(input?.title, 180).trim();
  if (!title) throw new Error("Een project heeft een titel nodig.");
  const kind = input?.kind === "video" ? "video" : "image";
  return {
    id: asId(input?.id ?? 0),
    title,
    img: cleanUrl(input?.img, false),
    media: cleanUrl(input?.media),
    kind,
    text: clip(input?.text, 20000),
    published: asBool(input?.published),
  };
}

export const saveProject = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: ProjectInput) => cleanProject(input))
  .handler(async ({ context, data }) => {
    const me = await profileFor(context.userId);
    assertSite(me.role);
    const sql = await getSql();
    if (data.id === 0) {
      const order = await sql<{ n: number }>`select coalesce(max(sort_order), -1) + 1 as n from projects`;
      const rows = await sql<{ id: number }>`insert into projects (title, img, media, kind, body, sort_order, published)
        values (${data.title}, ${data.img}, ${data.media}, ${data.kind}, ${data.text}, ${Number(order[0]?.n ?? 0)}, ${data.published})
        returning id`;
      return { id: Number(rows[0]?.id ?? 0) };
    }
    const updated = await sql<{ id: number }>`update projects
      set title = ${data.title}, img = ${data.img}, media = ${data.media}, kind = ${data.kind},
          body = ${data.text}, published = ${data.published}, updated_at = now()
      where id = ${data.id} returning id`;
    if (!updated[0]) throw new Error("Project niet gevonden.");
    return { id: data.id };
  });

export const deleteProject = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((id: number) => asId(id))
  .handler(async ({ context, data: id }) => {
    const me = await profileFor(context.userId);
    assertSite(me.role);
    const sql = await getSql();
    await sql`delete from projects where id = ${id}`;
    return { ok: true as const };
  });

type ClientInput = { id: number; href: string; img: string; alt: string; published: boolean };

function cleanClient(input: ClientInput): ClientInput {
  const alt = clip(input?.alt, 180).trim();
  if (!alt) throw new Error("Een logo heeft een naam nodig.");
  return {
    id: asId(input?.id ?? 0),
    href: cleanUrl(input?.href),
    img: cleanUrl(input?.img, false),
    alt,
    published: asBool(input?.published),
  };
}

export const saveClient = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: ClientInput) => cleanClient(input))
  .handler(async ({ context, data }) => {
    const me = await profileFor(context.userId);
    assertSite(me.role);
    const sql = await getSql();
    if (data.id === 0) {
      const order = await sql<{ n: number }>`select coalesce(max(sort_order), -1) + 1 as n from clients`;
      const rows = await sql<{ id: number }>`insert into clients (href, img, alt, sort_order, published)
        values (${data.href}, ${data.img}, ${data.alt}, ${Number(order[0]?.n ?? 0)}, ${data.published})
        returning id`;
      return { id: Number(rows[0]?.id ?? 0) };
    }
    const updated = await sql<{ id: number }>`update clients
      set href = ${data.href}, img = ${data.img}, alt = ${data.alt}, published = ${data.published}
      where id = ${data.id} returning id`;
    if (!updated[0]) throw new Error("Logo niet gevonden.");
    return { id: data.id };
  });

export const deleteClient = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((id: number) => asId(id))
  .handler(async ({ context, data: id }) => {
    const me = await profileFor(context.userId);
    assertSite(me.role);
    const sql = await getSql();
    await sql`delete from clients where id = ${id}`;
    return { ok: true as const };
  });

export const moveItem = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { table: "projects" | "clients" | "posts"; id: number; dir: -1 | 1 }) => {
    if (input?.table !== "projects" && input?.table !== "clients" && input?.table !== "posts") {
      throw new Error("Ongeldige lijst.");
    }
    if (input.dir !== -1 && input.dir !== 1) throw new Error("Ongeldige richting.");
    return { table: input.table, id: asId(input.id), dir: input.dir };
  })
  .handler(async ({ context, data }) => {
    const me = await profileFor(context.userId);
    if (data.table === "posts") {
      if (me.role === "author") throw new Error("Een auteur kan de volgorde niet wijzigen.");
    } else {
      assertSite(me.role);
    }
    const sql = await getSql();
    const rows =
      data.table === "projects"
        ? await sql<{ id: number; sort_order: number }>`select id, sort_order from projects order by sort_order, id`
        : data.table === "clients"
          ? await sql<{ id: number; sort_order: number }>`select id, sort_order from clients order by sort_order, id`
          : await sql<{ id: number; sort_order: number }>`select id, sort_order from posts order by sort_order, id`;
    const index = rows.findIndex((row) => Number(row.id) === data.id);
    const swap = index + data.dir;
    if (index < 0 || swap < 0 || swap >= rows.length) return { ok: true as const };
    const a = rows[index];
    const b = rows[swap];
    if (data.table === "projects") {
      await sql`update projects set sort_order = ${Number(b.sort_order)} where id = ${Number(a.id)}`;
      await sql`update projects set sort_order = ${Number(a.sort_order)} where id = ${Number(b.id)}`;
    } else if (data.table === "clients") {
      await sql`update clients set sort_order = ${Number(b.sort_order)} where id = ${Number(a.id)}`;
      await sql`update clients set sort_order = ${Number(a.sort_order)} where id = ${Number(b.id)}`;
    } else {
      await sql`update posts set sort_order = ${Number(b.sort_order)} where id = ${Number(a.id)}`;
      await sql`update posts set sort_order = ${Number(a.sort_order)} where id = ${Number(b.id)}`;
    }
    if (Number(a.sort_order) === Number(b.sort_order)) {
      if (data.table === "projects") await sql`update projects set sort_order = ${Number(a.sort_order) + data.dir} where id = ${Number(b.id)}`;
      if (data.table === "clients") await sql`update clients set sort_order = ${Number(a.sort_order) + data.dir} where id = ${Number(b.id)}`;
      if (data.table === "posts") await sql`update posts set sort_order = ${Number(a.sort_order) + data.dir} where id = ${Number(b.id)}`;
    }
    return { ok: true as const };
  });

type PostInput = {
  id: number;
  title: string;
  slug: string;
  month: string;
  day: string;
  year: string;
  excerpt: string;
  image: string;
  html: string;
  published: boolean;
};

function cleanPost(input: PostInput): PostInput {
  const title = clip(input?.title, 180).trim();
  if (!title) throw new Error("Een blogbericht heeft een titel nodig.");
  const html = clip(input?.html, 200000);
  return {
    id: asId(input?.id ?? 0),
    title,
    slug: slugify(clip(input?.slug, 120).trim() || title),
    month: clip(input?.month, 12).trim(),
    day: clip(input?.day, 4).trim(),
    year: clip(input?.year, 8).trim(),
    excerpt: clip(input?.excerpt, 400).trim(),
    image: cleanUrl(input?.image),
    html: html.includes("<") ? html : plainToHtml(html),
    published: asBool(input?.published),
  };
}

function plainToHtml(text: string) {
  return text
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => `<p>${escapeHtml(part).replace(/\n/g, "<br />")}</p>`)
    .join("\n");
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&")
    .replace(/</g, "<")
    .replace(/>/g, ">");
}

async function uniqueSlug(sql: Awaited<ReturnType<typeof getSql>>, slug: string, id: number) {
  let next = slug;
  for (let attempt = 2; attempt < 50; attempt += 1) {
    const rows = await sql<{ id: number }>`select id from posts where slug = ${next} and id <> ${id} limit 1`;
    if (!rows[0]) return next;
    next = `${slug}-${attempt}`.slice(0, 90);
  }
  return `${slug}-${Date.now()}`;
}

export const savePost = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: PostInput) => cleanPost(input))
  .handler(async ({ context, data }) => {
    const me = await profileFor(context.userId);
    const sql = await getSql();
    const slug = await uniqueSlug(sql, data.slug, data.id);
    if (data.id === 0) {
      const order = await sql<{ n: number }>`select coalesce(min(sort_order), 1) - 1 as n from posts`;
      const rows = await sql<{ id: number }>`insert into posts
        (slug, title, month, day, year, excerpt, image, html, published, author_id, sort_order)
        values (${slug}, ${data.title}, ${data.month}, ${data.day}, ${data.year}, ${data.excerpt}, ${data.image}, ${data.html}, ${data.published}, ${me.userId}, ${Number(order[0]?.n ?? 0)})
        returning id`;
      return { id: Number(rows[0]?.id ?? 0) };
    }
    const current = await sql<{ author_id: string | null }>`select author_id from posts where id = ${data.id}`;
    if (!current[0]) throw new Error("Bericht niet gevonden.");
    if (me.role === "author" && current[0].author_id !== me.userId) {
      throw new Error("Je kunt alleen je eigen berichten aanpassen.");
    }
    await sql`update posts set slug = ${slug}, title = ${data.title}, month = ${data.month}, day = ${data.day},
      year = ${data.year}, excerpt = ${data.excerpt}, image = ${data.image}, html = ${data.html},
      published = ${data.published}, updated_at = now()
      where id = ${data.id}`;
    return { id: data.id };
  });

export const deletePost = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((id: number) => asId(id))
  .handler(async ({ context, data: id }) => {
    const me = await profileFor(context.userId);
    const sql = await getSql();
    const current = await sql<{ author_id: string | null }>`select author_id from posts where id = ${id}`;
    if (!current[0]) return { ok: true as const };
    if (me.role === "author" && current[0].author_id !== me.userId) {
      throw new Error("Je kunt alleen je eigen berichten verwijderen.");
    }
    await sql`delete from posts where id = ${id}`;
    return { ok: true as const };
  });

export const uploadMedia = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { filename: string; mime: string; dataBase64: string }) => {
    const mime = clip(input?.mime, 80);
    if (!IMAGE_MIME.has(mime)) throw new Error("Alleen jpg, png, gif of webp.");
    const dataBase64 = String(input?.dataBase64 ?? "");
    if (dataBase64.length < 32 || dataBase64.length > 1_400_000) {
      throw new Error("Bestand is te groot. Houd het onder 900 KB.");
    }
    return { filename: clip(input?.filename, 180), mime, dataBase64 };
  })
  .handler(async ({ context, data }) => {
    await profileFor(context.userId);
    const sql = await getSql();
    const rows = await sql<{ id: number }>`insert into media_files (filename, mime, data, created_by)
      values (${data.filename}, ${data.mime}, ${data.dataBase64}, ${context.userId})
      returning id`;
    return { url: `/uploads/${Number(rows[0]?.id ?? 0)}` };
  });

type NewUser = { name: string; email: string; password: string; role: Role };

export const createMember = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: NewUser) => {
    const name = clip(input?.name, 120).trim();
    const email = clip(input?.email, 200).trim().toLowerCase();
    const password = String(input?.password ?? "");
    const role = input?.role;
    if (!name) throw new Error("Vul een naam in.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Dit e-mailadres klopt niet.");
    if (password.length < 8) throw new Error("Het wachtwoord moet minstens 8 tekens zijn.");
    if (!ROLES.includes(role)) throw new Error("Kies een rol.");
    return { name, email, password, role };
  })
  .handler(async ({ context, data }) => {
    const me = await profileFor(context.userId);
    if (me.role !== "admin") throw new Error("Alleen een beheerder kan gebruikers aanmaken.");
    const sql = await getSql();
    const taken = await sql<{ id: string }>`select id from "user" where lower(email) = ${data.email} limit 1`;
    if (taken[0]) throw new Error("Er bestaat al een account met dit e-mailadres.");
    const { hashPassword } = await import("better-auth/crypto");
    const hash = await hashPassword(data.password);
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    await sql`insert into "user" (id, name, email, "emailVerified", "createdAt", "updatedAt")
      values (${id}, ${data.name}, ${data.email}, true, ${now}, ${now})`;
    await sql`insert into "account" (id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt")
      values (${crypto.randomUUID()}, ${id}, 'credential', ${id}, ${hash}, ${now}, ${now})`;
    await sql`insert into profiles (user_id, email, name, role) values (${id}, ${data.email}, ${data.name}, ${data.role})`;
    return { ok: true as const };
  });

export const updateMemberRole = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { userId: string; role: Role }) => {
    const userId = clip(input?.userId, 80).trim();
    if (!userId) throw new Error("Gebruiker ontbreekt.");
    if (!ROLES.includes(input?.role)) throw new Error("Kies een rol.");
    return { userId, role: input.role };
  })
  .handler(async ({ context, data }) => {
    const me = await profileFor(context.userId);
    if (me.role !== "admin") throw new Error("Alleen een beheerder kan rollen wijzigen.");
    const sql = await getSql();
    if (data.role !== "admin") {
      const admins = await sql<{ user_id: string }>`select user_id from profiles where role = 'admin'`;
      if (admins.length === 1 && admins[0].user_id === data.userId) {
        throw new Error("Er moet minstens één beheerder blijven.");
      }
    }
    const updated = await sql<{ user_id: string }>`update profiles set role = ${data.role} where user_id = ${data.userId} returning user_id`;
    if (!updated[0]) throw new Error("Gebruiker niet gevonden.");
    return { ok: true as const };
  });

export const deleteMember = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((userId: string) => {
    const id = clip(userId, 80).trim();
    if (!id) throw new Error("Gebruiker ontbreekt.");
    return id;
  })
  .handler(async ({ context, data: userId }) => {
    const me = await profileFor(context.userId);
    if (me.role !== "admin") throw new Error("Alleen een beheerder kan gebruikers verwijderen.");
    if (userId === me.userId) throw new Error("Je kunt je eigen account hier niet verwijderen.");
    const sql = await getSql();
    const target = await sql<{ role: string }>`select role from profiles where user_id = ${userId}`;
    if (target[0]?.role === "admin") {
      const admins = await sql<{ n: number }>`select count(*) as n from profiles where role = 'admin'`;
      if (Number(admins[0]?.n ?? 0) <= 1) throw new Error("Er moet minstens één beheerder blijven.");
    }
    await sql`delete from "user" where id = ${userId}`;
    await sql`delete from profiles where user_id = ${userId}`;
    return { ok: true as const };
  });
