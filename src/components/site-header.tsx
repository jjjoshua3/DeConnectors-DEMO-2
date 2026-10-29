import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";

const SECTIONS = [
  { id: "home", label: "Home" },
  { id: "about", label: "Over" },
  { id: "services", label: "Wat" },
  { id: "our-team", label: "Wie" },
  { id: "portfolio", label: "Projecten" },
];

const SOCIALS = [
  { label: "X", href: "https://x.com/deconnectors", icon: "x" },
  { label: "YouTube", href: "https://www.youtube.com/user/deconnectors", icon: "yt" },
  { label: "Vimeo", href: "https://vimeo.com/deconnectors", icon: "vimeo" },
  { label: "Flickr", href: "https://www.flickr.com/deconnectors", icon: "flickr" },
] as const;

function SocialIcon({ name }: { name: string }) {
  if (name === "x") {
    return (
      <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="currentColor"
          d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.74l7.727-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117z"
        />
      </svg>
    );
  }
  if (name === "yt") {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="currentColor"
          d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8zM9.75 15.5v-7l6.2 3.5-6.2 3.5z"
        />
      </svg>
    );
  }
  if (name === "vimeo") {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="currentColor"
          d="M23.1 6.3c-.1 2.2-1.6 5.2-4.6 9-3.1 4-5.7 6-7.8 6-1.3 0-2.4-1.2-3.3-3.6L6.2 13C5.5 10.6 4.8 9.4 4 9.4c-.2 0-.8.3-1.8 1L1 8.8c1.1-1 2.2-2 3.4-2.9 1.5-1.3 2.6-2 3.4-2 1.7-.2 2.8 1 3.2 3.4.4 2.6.7 4.2.9 4.8.5 2.2 1 3.4 1.6 3.4.5 0 1.2-.7 2.2-2.2 1-1.5 1.5-2.6 1.6-3.4.2-1.3-.4-1.9-1.7-1.9-.6 0-1.2.1-1.8.4 1.2-3.9 3.5-5.8 6.8-5.6 2.5.1 3.6 1.7 3.5 4.7z"
        />
      </svg>
    );
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="7" cy="12" r="3.2" fill="currentColor" />
      <circle cx="17" cy="12" r="3.2" fill="currentColor" />
    </svg>
  );
}

export function SocialRow({ className }: { className?: string }) {
  return (
    <div className={className ? `socials ${className}` : "socials"}>
      {SOCIALS.map((item) => (
        <a key={item.label} href={item.href} target="_blank" rel="noreferrer" aria-label={item.label} title={item.label}>
          <SocialIcon name={item.icon} />
        </a>
      ))}
    </div>
  );
}

export function SiteHeader({ page }: { page: "home" | "blog" }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("home");

  useEffect(() => {
    if (page !== "home") return;
    const ids = SECTIONS.map((item) => item.id);
    const onScroll = () => {
      const mark = window.scrollY + 120;
      let current = ids[0];
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.offsetTop <= mark) current = id;
      }
      setActive(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [page]);

  return (
    <header className="topbar">
      <div className="topbar-h">
        <Link className="brand" to="/" hash="home" onClick={() => setOpen(false)}>
          <span className="brand-name">De Connectors</span>
        </Link>
        <nav className={open ? "nav open" : "nav"} aria-label="Secties">
          {SECTIONS.map((item) => (
            <Link
              key={item.id}
              to="/"
              hash={item.id}
              aria-current={page === "home" && active === item.id ? "true" : undefined}
              onClick={(event) => {
                setOpen(false);
                if (page === "home") {
                  event.preventDefault();
                  document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
                }
              }}
            >
              {item.label}
            </Link>
          ))}
          <Link to="/blog" aria-current={page === "blog" ? "true" : undefined} onClick={() => setOpen(false)}>
            Blog
          </Link>
          <SocialRow className="menu-socials" />
        </nav>
        <SocialRow className="head-socials" />
        <button className="burger" type="button" aria-expanded={open} aria-label="Menu" onClick={() => setOpen((v) => !v)}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="foot">
      <SocialRow />
      <p>
        © De Connectors · <Link to="/admin">Beheer</Link>
      </p>
      <p className="foot-credit">
        Ontworpen door Joshua. Beveiligingslek melden? Dat kan via:{" "}
        <a href="mailto:aa0271n8@gmail.com">aa0271n8@gmail.com</a>
      </p>
    </footer>
  );
}
