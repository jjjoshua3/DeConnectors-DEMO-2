import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { RedirectToSignIn, UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { defaultPage, type PageCopy, type TextBlock } from "@/data/page-copy";
import {
  createMember,
  deleteClient,
  deleteMember,
  deletePost,
  deleteProject,
  getAdminState,
  moveItem,
  saveClient,
  savePage,
  savePost,
  saveProject,
  updateMemberRole,
  uploadMedia,
  type Role,
} from "@/lib/cms.functions";

type AdminData = Awaited<ReturnType<typeof getAdminState>>;
type Tab = "teksten" | "projecten" | "logos" | "blog" | "gebruikers";

const ROLE_LABEL: Record<Role, string> = {
  admin: "Beheerder",
  editor: "Redacteur",
  author: "Auteur",
};

function problem(err: unknown) {
  const raw = err instanceof Error ? err.message : "Er ging iets mis.";
  if (raw === "Unauthorized") return "Log opnieuw in.";
  return raw;
}

export function AdminPage() {
  const { user, isPending } = useCurrentUserState();
  if (isPending) {
    return (
      <main className="adm-loading">
        <p>Beheer laden…</p>
      </main>
    );
  }
  if (!user) return <RedirectToSignIn />;
  return <Desk />;
}

function Desk() {
  const [data, setData] = useState<AdminData | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("projecten");

  async function reload() {
    const next = await getAdminState();
    setData(next);
    setError("");
    return next;
  }

  useEffect(() => {
    reload().catch((err) => setError(problem(err)));
  }, []);

  const role = data?.me.role ?? "author";
  const siteEditor = role === "admin" || role === "editor";
  const tabs: Array<{ id: Tab; label: string }> = [
    ...(siteEditor ? [{ id: "teksten" as const, label: "Teksten" }, { id: "projecten" as const, label: "Projecten" }, { id: "logos" as const, label: "Logo’s" }] : []),
    { id: "blog", label: "Blog" },
    ...(role === "admin" ? [{ id: "gebruikers" as const, label: "Gebruikers" }] : []),
  ];

  useEffect(() => {
    if (!data) return;
    if (!tabs.some((item) => item.id === tab)) setTab(siteEditor ? "projecten" : "blog");
  }, [data, role, siteEditor, tab]);

  return (
    <div className="adm">
      <header className="adm-top">
        <div>
          <p className="auth-kicker">DE CONNECTORS</p>
          <h1>Beheer</h1>
        </div>
        <div className="adm-top-actions">
          <Link className="btn btn-default" to="/">
            Bekijk de site
          </Link>
          <UserButton />
        </div>
      </header>
      {data ? (
        <p className="adm-hello">
          Hoi {data.me.name || data.me.email || "daar"}. Jij bent <strong>{ROLE_LABEL[data.me.role]}</strong>.
          Wat je opslaat, staat meteen op de site.
        </p>
      ) : null}
      <nav className="adm-tabs" aria-label="Onderdelen">
        {tabs.map((item) => (
          <button key={item.id} type="button" aria-current={tab === item.id} onClick={() => setTab(item.id)}>
            {item.label}
          </button>
        ))}
      </nav>
      {error ? <p className="adm-error">{error}</p> : null}
      {!data ? <p className="adm-loading">Even de inhoud ophalen…</p> : null}
      {data && tab === "teksten" ? <PageEditor page={data.page} onSaved={reload} /> : null}
      {data && tab === "projecten" ? <ProjectEditor items={data.projects} onSaved={reload} /> : null}
      {data && tab === "logos" ? <LogoEditor items={data.clients} onSaved={reload} /> : null}
      {data && tab === "blog" ? <PostEditor items={data.posts} onSaved={reload} /> : null}
      {data && tab === "gebruikers" && data.me.role === "admin" ? (
        <UserEditor meId={data.me.userId} users={data.users} onSaved={reload} />
      ) : null}
    </div>
  );
}

function PageEditor({ page, onSaved }: { page: PageCopy; onSaved: () => Promise<unknown> }) {
  const [draft, setDraft] = useState(page);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => setDraft(page), [page]);

  function set<K extends keyof PageCopy>(key: K, value: PageCopy[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  async function save() {
    setBusy(true);
    setNote("");
    try {
      await savePage({ data: draft });
      await onSaved();
      setNote("Teksten opgeslagen.");
    } catch (err) {
      setNote(problem(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="adm-panel">
      <h2>Teksten op de homepage</h2>
      <p className="adm-help">Dit zijn de vaste stukken tekst. Projecten, logo’s en blogs staan in hun eigen tab.</p>
      <Field label="Grote titel" value={draft.heroStrong} onChange={(value) => set("heroStrong", value)} />
      <Field label="Ondertitel" value={draft.heroLine} onChange={(value) => set("heroLine", value)} />
      <Field label="Kop Over" value={draft.aboutTitle} onChange={(value) => set("aboutTitle", value)} />
      <Field label="Intro, vet" value={draft.aboutLeadHighlight} onChange={(value) => set("aboutLeadHighlight", value)} />
      <Field label="Intro, vervolg" value={draft.aboutLeadAfter} onChange={(value) => set("aboutLeadAfter", value)} area />
      <Field label="Linkertekst, vet" value={draft.aboutLeftStrong} onChange={(value) => set("aboutLeftStrong", value)} />
      <Field label="Linkertekst" value={draft.aboutLeftRest} onChange={(value) => set("aboutLeftRest", value)} area />
      <Field label="Rechtertekst, vet" value={draft.aboutRightStrong} onChange={(value) => set("aboutRightStrong", value)} />
      <Field label="Rechtertekst" value={draft.aboutRightRest} onChange={(value) => set("aboutRightRest", value)} area />
      <h3>Onze stijl</h3>
      {draft.styleCards.map((card, index) => (
        <div key={index} className="adm-block">
          <Field
            label={`Stijl ${index + 1} titel`}
            value={card.title}
            onChange={(value) => set("styleCards", replaceAt(draft.styleCards, index, { ...card, title: value }))}
          />
          <Field
            label={`Stijl ${index + 1} tekst`}
            value={card.body}
            area
            onChange={(value) => set("styleCards", replaceAt(draft.styleCards, index, { ...card, body: value }))}
          />
        </div>
      ))}
      <h3>Diensten</h3>
      {draft.services.map((card, index) => (
        <div key={index} className="adm-block">
          <Field
            label="Titel"
            value={card.title}
            onChange={(value) => set("services", replaceAt(draft.services, index, { ...card, title: value }))}
          />
          <Field
            label="Tekst"
            value={card.body}
            area
            onChange={(value) => set("services", replaceAt(draft.services, index, { ...card, body: value }))}
          />
          <button
            className="text-btn danger"
            type="button"
            onClick={() => set("services", draft.services.filter((_, item) => item !== index))}
          >
            Dienst weghalen
          </button>
        </div>
      ))}
      <button
        className="btn btn-default"
        type="button"
        onClick={() => set("services", [...draft.services, { title: "Nieuwe dienst", body: "" }])}
      >
        Dienst toevoegen
      </button>
      <Field label="Tussenkop" value={draft.celebrateTitle} onChange={(value) => set("celebrateTitle", value)} />
      <ImageField label="Foto bij die tussenkop" value={draft.crowdImage} onChange={(value) => set("crowdImage", value)} />
      <h3>Wie</h3>
      <Field label="Kop" value={draft.teamTitle} onChange={(value) => set("teamTitle", value)} />
      <Field label="Intro" value={draft.teamLead} onChange={(value) => set("teamLead", value)} area />
      <Field label="Naam" value={draft.teamName} onChange={(value) => set("teamName", value)} />
      <Field label="Rol" value={draft.teamRole} onChange={(value) => set("teamRole", value)} />
      <ImageField label="Foto" value={draft.teamPhoto} onChange={(value) => set("teamPhoto", value)} />
      <Field label="E-mail" value={draft.teamEmail} onChange={(value) => set("teamEmail", value)} />
      <Field label="X-link" value={draft.teamX} onChange={(value) => set("teamX", value)} />
      <Field label="LinkedIn-link" value={draft.teamLinkedin} onChange={(value) => set("teamLinkedin", value)} />
      <Field label="Strategie, voor het rode woord" value={draft.strategyBefore} onChange={(value) => set("strategyBefore", value)} />
      <Field label="Rode woord" value={draft.strategyHighlight} onChange={(value) => set("strategyHighlight", value)} />
      <Field label="Strategie, erna" value={draft.strategyAfter} onChange={(value) => set("strategyAfter", value)} />
      <ImageField label="Achtergrond bij de logo’s" value={draft.clientsImage} onChange={(value) => set("clientsImage", value)} />
      <Field label="Kop projecten" value={draft.portfolioTitle} onChange={(value) => set("portfolioTitle", value)} />
      <Field label="Contactkop" value={draft.contactTitle} onChange={(value) => set("contactTitle", value)} />
      <Field label="Contactnaam" value={draft.contactName} onChange={(value) => set("contactName", value)} />
      <Field label="Contact e-mail" value={draft.contactEmail} onChange={(value) => set("contactEmail", value)} />
      <Field label="Footer" value={draft.footer} onChange={(value) => set("footer", value)} />
      <div className="adm-actions">
        <button className="btn btn-primary" type="button" disabled={busy} onClick={() => void save()}>
          {busy ? "Opslaan…" : "Teksten opslaan"}
        </button>
        <button className="text-btn" type="button" onClick={() => setDraft(defaultPage)}>
          Originele teksten terug
        </button>
      </div>
      {note ? <p className={note.includes("opgeslagen") ? "adm-ok" : "adm-error"}>{note}</p> : null}
    </section>
  );
}

type ProjectItem = AdminData["projects"][number];

function ProjectEditor({ items, onSaved }: { items: ProjectItem[]; onSaved: () => Promise<unknown> }) {
  const blank: ProjectItem = { id: 0, title: "", img: "", media: "", kind: "image", text: "", published: true };
  const [draft, setDraft] = useState<ProjectItem | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!draft) return;
    setBusy(true);
    setNote("");
    try {
      await saveProject({
        data: { ...draft, kind: draft.kind === "video" ? "video" : "image" },
      });
      setDraft(null);
      await onSaved();
      setNote("Project opgeslagen.");
    } catch (err) {
      setNote(problem(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="adm-panel">
      <div className="adm-head">
        <h2>Projecten</h2>
        <button className="btn btn-primary" type="button" onClick={() => setDraft(blank)}>
          Nieuw project
        </button>
      </div>
      <p className="adm-help">Zet een project uit om het te verbergen, of haal het weg. Omhoog en omlaag bepalen de volgorde.</p>
      <ul className="adm-list">
        {items.map((item, index) => (
          <li key={item.id}>
            {item.img ? <img src={item.img} alt="" /> : <span className="adm-ph" />}
            <div>
              <strong>{item.title}</strong>
              <span>{item.published ? "Zichtbaar" : "Verborgen"}</span>
            </div>
            <div className="adm-row-actions">
              <button type="button" onClick={() => void move("projects", item.id, -1, onSaved, setNote)} disabled={index === 0}>
                Omhoog
              </button>
              <button
                type="button"
                onClick={() => void move("projects", item.id, 1, onSaved, setNote)}
                disabled={index === items.length - 1}
              >
                Omlaag
              </button>
              <button type="button" onClick={() => setDraft(item)}>
                Bewerken
              </button>
              <button
                type="button"
                className="danger"
                onClick={() => {
                  if (!window.confirm(`“${item.title}” van de site halen?`)) return;
                  deleteProject({ data: item.id }).then(onSaved).catch((err) => setNote(problem(err)));
                }}
              >
                Weghalen
              </button>
            </div>
          </li>
        ))}
      </ul>
      {draft ? (
        <div className="adm-editor">
          <h3>{draft.id ? "Project bewerken" : "Nieuw project"}</h3>
          <Field label="Titel" value={draft.title} onChange={(title) => setDraft({ ...draft, title })} />
          <ImageField label="Tegelbeeld" value={draft.img} onChange={(img) => setDraft({ ...draft, img })} />
          <label className="adm-field">
            Soort
            <select
              value={draft.kind}
              onChange={(event) => setDraft({ ...draft, kind: event.target.value === "video" ? "video" : "image" })}
            >
              <option value="image">Foto</option>
              <option value="video">Video (YouTube-link)</option>
            </select>
          </label>
          <Field
            label={draft.kind === "video" ? "YouTube-insluitlink" : "Grote foto"}
            value={draft.media}
            onChange={(media) => setDraft({ ...draft, media })}
          />
          <Field label="Tekst" value={draft.text} area onChange={(text) => setDraft({ ...draft, text })} />
          <Check
            label="Zichtbaar op de site"
            checked={draft.published}
            onChange={(published) => setDraft({ ...draft, published })}
          />
          <div className="adm-actions">
            <button className="btn btn-primary" type="button" disabled={busy} onClick={() => void save()}>
              {busy ? "Opslaan…" : "Opslaan"}
            </button>
            <button className="text-btn" type="button" onClick={() => setDraft(null)}>
              Annuleren
            </button>
          </div>
        </div>
      ) : null}
      {note ? <p className={note.includes("opgeslagen") ? "adm-ok" : "adm-error"}>{note}</p> : null}
    </section>
  );
}

type ClientItem = AdminData["clients"][number];

function LogoEditor({ items, onSaved }: { items: ClientItem[]; onSaved: () => Promise<unknown> }) {
  const blank: ClientItem = { id: 0, href: "", img: "", alt: "", published: true };
  const [draft, setDraft] = useState<ClientItem | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!draft) return;
    setBusy(true);
    setNote("");
    try {
      await saveClient({ data: draft });
      setDraft(null);
      await onSaved();
      setNote("Logo opgeslagen.");
    } catch (err) {
      setNote(problem(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="adm-panel">
      <div className="adm-head">
        <h2>Logo’s van opdrachtgevers</h2>
        <button className="btn btn-primary" type="button" onClick={() => setDraft(blank)}>
          Nieuw logo
        </button>
      </div>
      <ul className="adm-list">
        {items.map((item, index) => (
          <li key={item.id}>
            {item.img ? <img src={item.img} alt="" /> : <span className="adm-ph" />}
            <div>
              <strong>{item.alt}</strong>
              <span>{item.published ? "Zichtbaar" : "Verborgen"}</span>
            </div>
            <div className="adm-row-actions">
              <button type="button" disabled={index === 0} onClick={() => void move("clients", item.id, -1, onSaved, setNote)}>
                Omhoog
              </button>
              <button
                type="button"
                disabled={index === items.length - 1}
                onClick={() => void move("clients", item.id, 1, onSaved, setNote)}
              >
                Omlaag
              </button>
              <button type="button" onClick={() => setDraft(item)}>
                Bewerken
              </button>
              <button
                className="danger"
                type="button"
                onClick={() => {
                  if (!window.confirm(`Logo “${item.alt}” weghalen?`)) return;
                  deleteClient({ data: item.id }).then(onSaved).catch((err) => setNote(problem(err)));
                }}
              >
                Weghalen
              </button>
            </div>
          </li>
        ))}
      </ul>
      {draft ? (
        <div className="adm-editor">
          <h3>{draft.id ? "Logo bewerken" : "Nieuw logo"}</h3>
          <Field label="Naam" value={draft.alt} onChange={(alt) => setDraft({ ...draft, alt })} />
          <ImageField label="Beeld" value={draft.img} onChange={(img) => setDraft({ ...draft, img })} />
          <Field label="Link (mag leeg)" value={draft.href} onChange={(href) => setDraft({ ...draft, href })} />
          <Check label="Zichtbaar op de site" checked={draft.published} onChange={(published) => setDraft({ ...draft, published })} />
          <div className="adm-actions">
            <button className="btn btn-primary" type="button" disabled={busy} onClick={() => void save()}>
              {busy ? "Opslaan…" : "Opslaan"}
            </button>
            <button className="text-btn" type="button" onClick={() => setDraft(null)}>
              Annuleren
            </button>
          </div>
        </div>
      ) : null}
      {note ? <p className={note.includes("opgeslagen") ? "adm-ok" : "adm-error"}>{note}</p> : null}
    </section>
  );
}

type PostItem = AdminData["posts"][number];

function PostEditor({ items, onSaved }: { items: PostItem[]; onSaved: () => Promise<unknown> }) {
  const today = new Date();
  const blank: PostItem = {
    id: 0,
    slug: "",
    title: "",
    month: ["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"][today.getMonth()],
    day: String(today.getDate()).padStart(2, "0"),
    year: String(today.getFullYear()),
    excerpt: "",
    image: "",
    html: "",
    published: true,
    author_id: null,
  };
  const [draft, setDraft] = useState<PostItem | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!draft) return;
    setBusy(true);
    setNote("");
    try {
      await savePost({ data: draft });
      setDraft(null);
      await onSaved();
      setNote("Bericht opgeslagen.");
    } catch (err) {
      setNote(problem(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="adm-panel">
      <div className="adm-head">
        <h2>Blog</h2>
        <button className="btn btn-primary" type="button" onClick={() => setDraft(blank)}>
          Nieuw bericht
        </button>
      </div>
      <p className="adm-help">
        Schrijf gewone tekst met een lege regel tussen alinea’s, of plak HTML als je links en vet wilt houden.
      </p>
      <ul className="adm-list">
        {items.map((item) => (
          <li key={item.id}>
            {item.image ? <img src={item.image} alt="" /> : <span className="adm-ph" />}
            <div>
              <strong>{item.title}</strong>
              <span>
                {item.day} {item.month} {item.year} · {item.published ? "Zichtbaar" : "Verborgen"}
              </span>
            </div>
            <div className="adm-row-actions">
              <button type="button" onClick={() => setDraft(item)}>
                Bewerken
              </button>
              <button
                className="danger"
                type="button"
                onClick={() => {
                  if (!window.confirm(`“${item.title}” van de blog halen?`)) return;
                  deletePost({ data: item.id }).then(onSaved).catch((err) => setNote(problem(err)));
                }}
              >
                Weghalen
              </button>
            </div>
          </li>
        ))}
      </ul>
      {draft ? (
        <div className="adm-editor">
          <h3>{draft.id ? "Bericht bewerken" : "Nieuw bericht"}</h3>
          <Field label="Titel" value={draft.title} onChange={(title) => setDraft({ ...draft, title })} />
          <div className="adm-date">
            <Field label="Dag" value={draft.day} onChange={(day) => setDraft({ ...draft, day })} />
            <Field label="Maand" value={draft.month} onChange={(month) => setDraft({ ...draft, month })} />
            <Field label="Jaar" value={draft.year} onChange={(year) => setDraft({ ...draft, year })} />
          </div>
          <Field label="Korte teaser" value={draft.excerpt} area onChange={(excerpt) => setDraft({ ...draft, excerpt })} />
          <ImageField label="Beeld" value={draft.image} onChange={(image) => setDraft({ ...draft, image })} />
          <Field label="Verhaal" value={draft.html} area tall onChange={(html) => setDraft({ ...draft, html })} />
          <Check label="Zichtbaar op de blog" checked={draft.published} onChange={(published) => setDraft({ ...draft, published })} />
          <div className="adm-actions">
            <button className="btn btn-primary" type="button" disabled={busy} onClick={() => void save()}>
              {busy ? "Opslaan…" : "Opslaan"}
            </button>
            <button className="text-btn" type="button" onClick={() => setDraft(null)}>
              Annuleren
            </button>
          </div>
        </div>
      ) : null}
      {note ? <p className={note.includes("opgeslagen") ? "adm-ok" : "adm-error"}>{note}</p> : null}
    </section>
  );
}

function UserEditor({
  meId,
  users,
  onSaved,
}: {
  meId: string;
  users: AdminData["users"];
  onSaved: () => Promise<unknown>;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("author");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  async function create(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setNote("");
    try {
      await createMember({ data: { name, email, password, role } });
      setName("");
      setEmail("");
      setPassword("");
      setRole("author");
      await onSaved();
      setNote("Gebruiker aangemaakt. Geef naam, e-mail en wachtwoord door.");
    } catch (err) {
      setNote(problem(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="adm-panel">
      <h2>Gebruikers</h2>
      <ul className="adm-roles">
        <li><strong>Beheerder</strong> mag alles, ook accounts aanmaken en rollen geven.</li>
        <li><strong>Redacteur</strong> mag teksten, projecten, logo’s en alle blogs aanpassen.</li>
        <li><strong>Auteur</strong> mag alleen eigen blogberichten schrijven en weghalen.</li>
      </ul>
      <ul className="adm-list">
        {users.map((user) => (
          <li key={user.userId}>
            <span className="adm-ph">{(user.name || user.email || "?").slice(0, 1)}</span>
            <div>
              <strong>{user.name || "Zonder naam"}</strong>
              <span>{user.email}</span>
            </div>
            <div className="adm-row-actions">
              <select
                aria-label={`Rol van ${user.name || user.email}`}
                value={user.role}
                onChange={(event) => {
                  const next = event.target.value as Role;
                  updateMemberRole({ data: { userId: user.userId, role: next } })
                    .then(onSaved)
                    .catch((err) => setNote(problem(err)));
                }}
              >
                <option value="admin">Beheerder</option>
                <option value="editor">Redacteur</option>
                <option value="author">Auteur</option>
              </select>
              <button
                className="danger"
                type="button"
                disabled={user.userId === meId}
                onClick={() => {
                  if (!window.confirm(`${user.name || user.email} verwijderen?`)) return;
                  deleteMember({ data: user.userId }).then(onSaved).catch((err) => setNote(problem(err)));
                }}
              >
                Weghalen
              </button>
            </div>
          </li>
        ))}
      </ul>
      <form className="adm-editor" onSubmit={create}>
        <h3>Nieuwe gebruiker</h3>
        <Field label="Naam" value={name} onChange={setName} />
        <Field label="E-mail" value={email} onChange={setEmail} />
        <Field label="Wachtwoord" value={password} type="password" onChange={setPassword} />
        <label className="adm-field">
          Rol
          <select value={role} onChange={(event) => setRole(event.target.value as Role)}>
            <option value="author">Auteur</option>
            <option value="editor">Redacteur</option>
            <option value="admin">Beheerder</option>
          </select>
        </label>
        <button className="btn btn-primary" type="submit" disabled={busy}>
          {busy ? "Aanmaken…" : "Gebruiker aanmaken"}
        </button>
      </form>
      {note ? <p className={note.startsWith("Gebruiker aangemaakt") ? "adm-ok" : "adm-error"}>{note}</p> : null}
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  area,
  tall,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  area?: boolean;
  tall?: boolean;
  type?: string;
}) {
  return (
    <label className="adm-field">
      {label}
      {area ? (
        <textarea className={tall ? "tall" : undefined} value={value} onChange={(event) => onChange(event.target.value)} />
      ) : (
        <input type={type} value={value} onChange={(event) => onChange(event.target.value)} />
      )}
    </label>
  );
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="adm-check">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      {label}
    </label>
  );
}

function ImageField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onFile(file: File) {
    if (file.size > 900_000) {
      setError("Bestand is te groot. Houd het onder 900 KB.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      let binary = "";
      for (let index = 0; index < bytes.length; index += 0x8000) {
        binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
      }
      const saved = await uploadMedia({
        data: { filename: file.name, mime: file.type || "image/jpeg", dataBase64: btoa(binary) },
      });
      onChange(saved.url);
    } catch (err) {
      setError(problem(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <label className="adm-field">
      {label}
      <input value={value} onChange={(event) => onChange(event.target.value)} placeholder="/media/… of een link" />
      <input
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void onFile(file);
        }}
      />
      {value ? <img className="adm-thumb" src={value} alt="" /> : null}
      {busy ? <small>Uploaden…</small> : <small>Of kies een bestand van je computer.</small>}
      {error ? <small className="adm-error">{error}</small> : null}
    </label>
  );
}

function replaceAt(list: TextBlock[], index: number, next: TextBlock) {
  return list.map((item, itemIndex) => (itemIndex === index ? next : item));
}

async function move(
  table: "projects" | "clients" | "posts",
  id: number,
  dir: -1 | 1,
  onSaved: () => Promise<unknown>,
  setNote: (value: string) => void,
) {
  try {
    await moveItem({ data: { table, id, dir } });
    await onSaved();
  } catch (err) {
    setNote(problem(err));
  }
}
