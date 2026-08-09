import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Logg inn – Nyhet" },
      {
        name: "description",
        content:
          "Logg inn eller opprett konto på Nyhet for å tilpasse nyhetsstrømmen din fra norske medier.",
      },
      { property: "og:title", content: "Logg inn – Nyhet" },
      {
        property: "og:description",
        content: "Logg inn på Nyhet og få din egen nyhetsstrøm fra norske medier.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/", replace: true });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) navigate({ to: "/", replace: true });
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      if (mode === "signup") {
        const { data, error: err } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { display_name: displayName || email.split("@")[0] },
          },
        });
        if (err) throw err;
        if (!data.session) {
          setMessage("Sjekk e-posten din for å bekrefte kontoen.");
        }
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Noe gikk galt.");
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setError("Kunne ikke logge inn med Google.");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/", replace: true });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-16 font-sans text-foreground">
      <div className="w-full max-w-md rounded-xl border border-border p-8">
        <a href="/" className="block text-center">
          <span className="font-display text-3xl tracking-[-0.02em]">
            NYHET<span className="text-primary">.</span>
          </span>
        </a>
        <h1 className="mt-6 text-center font-display text-2xl">
          {mode === "login" ? "Logg inn" : "Opprett konto"}
        </h1>
        <p className="mt-1 text-center font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
          din egen nyhetsstrøm
        </p>

        <button
          onClick={handleGoogle}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg border border-border px-4 py-3 font-mono text-xs uppercase tracking-widest transition hover:border-primary hover:text-primary"
        >
          Fortsett med Google
        </button>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            eller
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === "signup" && (
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Visningsnavn"
              className="w-full rounded-lg border border-border bg-transparent px-4 py-3 text-sm outline-none focus:border-primary"
            />
          )}
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="E-post"
            className="w-full rounded-lg border border-border bg-transparent px-4 py-3 text-sm outline-none focus:border-primary"
          />
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Passord"
            className="w-full rounded-lg border border-border bg-transparent px-4 py-3 text-sm outline-none focus:border-primary"
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          {message && <p className="text-sm text-primary">{message}</p>}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg border border-primary bg-primary px-4 py-3 font-mono text-xs font-bold uppercase tracking-widest text-primary-foreground transition hover:bg-transparent hover:text-primary disabled:opacity-50"
          >
            {busy ? "Vent…" : mode === "login" ? "Logg inn" : "Opprett konto"}
          </button>
        </form>

        <button
          onClick={() => {
            setMode(mode === "login" ? "signup" : "login");
            setError(null);
            setMessage(null);
          }}
          className="mt-5 w-full text-center font-mono text-[11px] uppercase tracking-widest text-muted-foreground transition hover:text-foreground"
        >
          {mode === "login" ? "Ny her? Opprett konto" : "Har du konto? Logg inn"}
        </button>
      </div>
    </div>
  );
}
