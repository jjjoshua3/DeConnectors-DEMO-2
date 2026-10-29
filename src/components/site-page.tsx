import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  Lightbulb,
  Mail,
  MessageCircle,
  Plus,
  Puzzle,
  Rocket,
  ThumbsUp,
  Users,
  X,
} from "lucide-react";
import { clients, projects, type ClientLogo, type Project } from "@/data/content";
import { defaultPage, type PageCopy } from "@/data/page-copy";
import { getPublicSite } from "@/lib/cms.functions";
import { SiteHeader, SocialRow } from "@/components/site-header";

function Rule({ icon = "heart" }: { icon?: "heart" | "none" }) {
  if (icon === "none") return <div className="rule ghost" aria-hidden="true" />;
  return (
    <div className="rule" aria-hidden="true">
      <Heart size={16} strokeWidth={1.75} />
    </div>
  );
}

function paragraphs(text: string) {
  return text
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function SitePage() {
  const [project, setProject] = useState<number | null>(null);
  const [folio, setFolio] = useState<Array<Project & { id?: number }>>(projects);
  const [logos, setLogos] = useState<ClientLogo[]>(clients);
  const [copy, setCopy] = useState<PageCopy>(defaultPage);

  useEffect(() => {
    let live = true;
    getPublicSite()
      .then((data) => {
        if (!live) return;
        setCopy(data.page);
        setFolio(data.projects);
        setLogos(data.clients);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);

  useEffect(() => {
    if (project === null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setProject(null);
      if (event.key === "ArrowRight") setProject((i) => (i === null ? i : (i + 1) % folio.length));
      if (event.key === "ArrowLeft")
        setProject((i) => (i === null ? i : (i - 1 + folio.length) % folio.length));
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [project, folio.length]);

  function go(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  useEffect(() => {
    const id = window.location.hash.replace("#", "");
    if (!id) return;
    const timer = window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 40);
    return () => window.clearTimeout(timer);
  }, []);

  const current: (Project & { id?: number }) | null = project === null ? null : folio[project] ?? null;
  const loop = [...logos, ...logos];
  const serviceIcons = [Rocket, Puzzle, MessageCircle, Heart, Lightbulb, Users];

  return (
    <div className="site">
      <a className="skip" href="#home">
        Naar inhoud
      </a>
      <SiteHeader page="home" />

      <main className="main">
        <section id="home">
          <div className="band hero">
            <h1>
              <span className="hero-line">
                <strong>{copy.heroStrong}</strong>
              </span>
              <span className="hero-line">{copy.heroLine}</span>
            </h1>
          </div>
        </section>

        <section id="about" className="pad">
          <div className="wrap center">
            <h2>{copy.aboutTitle}</h2>
            <Rule />
            <p className="lead">
              {copy.aboutLeadBefore}
              <span className="hi">{copy.aboutLeadHighlight}</span>
              {copy.aboutLeadAfter}
            </p>
            <Rule icon="none" />
            <div className="cols-2">
              <p>
                <strong>{copy.aboutLeftStrong}</strong>
                {copy.aboutLeftRest}
              </p>
              <p>
                <strong>{copy.aboutRightStrong}</strong>
                {copy.aboutRightRest}
              </p>
            </div>
          </div>
        </section>

        <section className="alt pad">
          <div className="wrap center">
            <h3>
              <span className="hi">{copy.styleTitle}</span>
            </h3>
            <div className="cols-3">
              {copy.styleCards.map((card, index) => {
                const Icon = [Heart, Rocket, ThumbsUp][index] ?? Heart;
                return (
                  <article className="style-card" key={card.title + index}>
                    <div className="bubble lg">
                      <Icon size={34} />
                    </div>
                    <h4>{card.title}</h4>
                    <p>{card.body}</p>
                  </article>
                );
              })}
            </div>
            <p className="cta">
              <a className="btn btn-default" href="#portfolio" onClick={(e) => { e.preventDefault(); go("portfolio"); }}>
                {copy.workCta}
              </a>
            </p>
          </div>
        </section>

        <section id="services" className="pad">
          <div className="wrap">
            <div className="center">
              <h2>{copy.servicesTitle}</h2>
              <Rule />
            </div>
            <div className="svc-grid">
              {copy.services.map((item, index) => {
                const Icon = serviceIcons[index % serviceIcons.length];
                return (
                  <article className="svc" key={item.title + index}>
                    <div className="bubble sm"><Icon size={26} /></div>
                    <div>
                      <h4>{item.title}</h4>
                      <p>{item.body}</p>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section
          className="band"
          style={{ backgroundImage: `url(${copy.crowdImage})` }}
        >
          <div className="wrap">
            <h4>{copy.celebrateTitle}</h4>
            <a className="btn btn-primary" href="#contact" onClick={(e) => { e.preventDefault(); go("contact"); }}>
              {copy.celebrateCta}
            </a>
          </div>
        </section>

        <section id="our-team" className="pad">
          <div className="wrap center">
            <h2>
              <span className="hi">{copy.teamTitle}</span>
            </h2>
            <p className="lead">{copy.teamLead}</p>
            <article className="team-card">
              <img className="team-photo" src={copy.teamPhoto} alt={copy.teamName} />
              <h4 className="team-name">{copy.teamName}</h4>
              <p className="team-role">{copy.teamRole}</p>
              <div className="team-links">
                <a href={`mailto:${copy.teamEmail}`} aria-label="E-mail">
                  <Mail size={18} />
                </a>
                <a href={copy.teamX} target="_blank" rel="noreferrer" aria-label="X">
                  <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fill="currentColor"
                      d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.74l7.727-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117z"
                    />
                  </svg>
                </a>
                <a
                  href={copy.teamLinkedin}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="LinkedIn"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fill="currentColor"
                      d="M4.98 3.5C4.98 4.88 3.88 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.5 8.5h4V24h-4V8.5zM8.5 8.5h3.8v2.1h.05c.53-1 1.84-2.1 3.79-2.1 4.05 0 4.8 2.67 4.8 6.1V24h-4v-7.7c0-1.84-.03-4.2-2.56-4.2-2.56 0-2.95 2-2.95 4.06V24h-4V8.5z"
                    />
                  </svg>
                </a>
              </div>
            </article>
          </div>
        </section>

        <section className="alt pad">
          <div className="wrap center">
            <h2>
              {copy.strategyBefore}
              <span className="hi">{copy.strategyHighlight}</span>
              {copy.strategyAfter}
            </h2>
          </div>
        </section>

        <section
          className="band"
          style={{ backgroundImage: `url(${copy.clientsImage})` }}
        >
          <div className="wrap">
            <h3>
              {copy.clientsTitleBefore}
              <span className="hi">{copy.clientsTitleHighlight}</span>
            </h3>
            <div className="clients" aria-label="Opdrachtgevers">
              <div className="marquee">
                {loop.map((client, index) => {
                  const img = (
                    <img src={client.img} alt={index < logos.length ? client.alt : ""} />
                  );
                  return client.href ? (
                    <a
                      key={`${client.alt}-${index}`}
                      className="logo-tile"
                      href={client.href}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {img}
                    </a>
                  ) : (
                    <span key={`${client.alt}-${index}`} className="logo-tile">
                      {img}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section id="portfolio">
          <div className="pad center">
            <div className="wrap">
              <h2>{copy.portfolioTitle}</h2>
              <Rule />
            </div>
          </div>
          <div className="folio">
            {folio.map((item, index) => (
              <button key={item.id ?? item.title} type="button" onClick={() => setProject(index)}>
                <img src={item.img} alt="" />
                <span className="folio-title">{item.title}</span>
                <span className="folio-hover" aria-hidden="true">
                  <Plus size={42} />
                </span>
              </button>
            ))}
          </div>
        </section>

        <section id="contact" className="pad">
          <div className="wrap center">
            <h2>{copy.contactTitle}</h2>
            <Rule />
            <p className="lead">
              {copy.contactName} · <a href={`mailto:${copy.contactEmail}`}>{copy.contactEmail}</a>
            </p>
            <SocialRow />
          </div>
        </section>
      </main>

      <footer className="foot">
        <p>
          {copy.footer} · <Link to="/admin">Beheer</Link>
        </p>
        <p className="foot-credit">
          Ontworpen door Joshua. Beveiligingslek melden? Dat kan via:{" "}
          <a href="mailto:aa0271n8@gmail.com">aa0271n8@gmail.com</a>
        </p>
      </footer>

      {current ? (
        <div className="light" role="dialog" aria-modal="true" aria-label={current.title} onClick={() => setProject(null)}>
          <div className="light-panel" onClick={(event) => event.stopPropagation()}>
            <button className="light-close" type="button" aria-label="Sluiten" onClick={() => setProject(null)}>
              <X size={20} />
            </button>
            <div className="light-media">
              {current.kind === "video" && current.media ? (
                <iframe
                  src={current.media}
                  title={current.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <img src={current.media || current.img} alt={current.title} />
              )}
            </div>
            <h2>{current.title}</h2>
            <div className="light-text">
              {paragraphs(current.text).map((part) => (
                <p key={part.slice(0, 48)}>{part}</p>
              ))}
            </div>
            <div className="light-actions">
              <button
                className="light-nav"
                type="button"
                aria-label="Vorig project"
                onClick={() => setProject((i) => (i === null ? i : (i - 1 + folio.length) % folio.length))}
              >
                <ChevronLeft />
              </button>
              <button
                className="light-nav"
                type="button"
                aria-label="Volgend project"
                onClick={() => setProject((i) => (i === null ? i : (i + 1) % folio.length))}
              >
                <ChevronRight />
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
