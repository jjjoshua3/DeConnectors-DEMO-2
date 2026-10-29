import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { GROK_PROVIDERS, authClient, authEnabled, signIn } from "@/lib/auth/client";
import { registrationOpen } from "@/lib/cms.functions";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Inloggen · DE CONNECTORS" }] }),
  component: LoginPage,
});

const BEARER_KEY = "grok-auth.bearer-token";

function rememberToken(response: Response) {
  const token = response.headers.get("set-auth-token");
  if (!token) return;
  try {
    sessionStorage.setItem(BEARER_KEY, token);
  } catch {
    /* ignore */
  }
}

function LoginPage() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    registrationOpen()
      .then((result) => {
        setOpen(result.open);
        if (result.open) setMode("up");
      })
      .catch(() => {});
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "up") {
        const result = await authClient.signUp.email(
          { name: name.trim(), email: email.trim(), password, callbackURL: "/admin" },
          { onSuccess(ctx) { rememberToken(ctx.response); } },
        );
        if (result.error) throw new Error(result.error.message || "Account aanmaken lukte niet.");
      } else {
        const result = await authClient.signIn.email(
          { email: email.trim(), password, callbackURL: "/admin" },
          { onSuccess(ctx) { rememberToken(ctx.response); } },
        );
        if (result.error) throw new Error(result.error.message || "Inloggen lukte niet.");
      }
      window.location.href = "/admin";
    } catch (err) {
      const raw = err instanceof Error ? err.message : "Er ging iets mis.";
      setError(
        /invalid email or password/i.test(raw)
          ? "E-mail of wachtwoord klopt niet."
          : /already/i.test(raw)
            ? "Er bestaat al een account met dit e-mailadres."
            : raw,
      );
      setBusy(false);
    }
  }

  return (
    <main className="auth-screen">
      <form className="auth-card" onSubmit={submit}>
        <p className="auth-kicker">DE CONNECTORS</p>
        <h1>{mode === "up" ? "Maak het beheerdersaccount" : "Inloggen bij beheer"}</h1>
        <p className="auth-lead">
          {mode === "up"
            ? "De eerste persoon die een account maakt, wordt beheerder. Daarna kun je collega’s uitnodigen."
            : "Log in om teksten, projecten, logo’s en blogs aan te passen."}
        </p>
        {mode === "up" ? (
          <label>
            Naam
            <input value={name} onChange={(event) => setName(event.target.value)} required autoComplete="name" />
          </label>
        ) : null}
        <label>
          E-mail
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            autoComplete="email"
          />
        </label>
        <label>
          Wachtwoord
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={8}
            autoComplete={mode === "up" ? "new-password" : "current-password"}
          />
        </label>
        {error ? <p className="adm-error">{error}</p> : null}
        <button className="btn btn-primary" type="submit" disabled={busy || !authEnabled}>
          {busy ? "Even wachten…" : mode === "up" ? "Account maken" : "Inloggen"}
        </button>
        {open && mode === "in" ? (
          <button className="btn btn-default" type="button" onClick={() => setMode("up")}>
            Nog geen account? Maak de beheerder
          </button>
        ) : null}
        {mode === "up" && !open ? null : mode === "up" ? (
          <button className="text-btn" type="button" onClick={() => setMode("in")}>
            Ik heb al een account
          </button>
        ) : null}
        {authEnabled ? (
          <div className="auth-split">
            {GROK_PROVIDERS.map((provider) => (
              <button
                key={provider.providerId}
                type="button"
                className="btn btn-default"
                onClick={() => signIn(provider.providerId, { callbackURL: "/admin" })}
              >
                Doorgaan met {provider.label}
              </button>
            ))}
          </div>
        ) : (
          <p className="auth-lead">Inloggen staat uit.</p>
        )}
        <p className="auth-back">
          <Link to="/">Terug naar de site</Link>
        </p>
      </form>
    </main>
  );
}
