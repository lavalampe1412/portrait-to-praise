import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback } from "react";
import { Calendar, KeyRound, LogOut, Mail, ShieldCheck, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-profile";

export const Route = createFileRoute("/konto")({
  head: () => ({
    meta: [{ title: "Konto – fidia" }],
  }),
  component: KontoPage,
});

function KontoPage() {
  const { session, profileName, profileAvatar } = useProfile();

  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const provider = session?.user.app_metadata?.provider;
  const providerLabel =
    provider === "google" ? "Google" : provider === "email" ? "E-post og passord" : provider || "—";

  const memberSince = session?.user.created_at
    ? new Date(session.user.created_at).toLocaleDateString("nb-NO", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "—";

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <div className="border-b border-border">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-6 py-5">
          <Link to="/" className="font-display text-2xl tracking-[-0.02em]">
            fidia<span className="text-primary">.</span>
          </Link>
          <Link
            to="/"
            className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground transition hover:text-primary"
          >
            ← Tilbake
          </Link>
        </div>
      </div>

      <main className="mx-auto max-w-lg space-y-6 px-6 py-16">
        <section className="frame p-6">
          <div className="flex items-center gap-4">
            {profileAvatar ? (
              <img
                src={profileAvatar}
                alt={profileName}
                className="h-16 w-16 rounded-full border border-border object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full border border-border text-muted-foreground">
                <User className="h-6 w-6" />
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate font-display text-xl">{profileName || "Konto"}</p>
              <p className="mt-1 truncate font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                {session?.user.email}
              </p>
            </div>
          </div>
        </section>

        <section className="frame p-4">
          <div className="mb-3 flex items-center justify-between border-b border-border pb-2">
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.25em]">Kontoinformasjon</p>
          </div>
          <div className="space-y-1 text-[13px]">
            <div className="flex items-center justify-between gap-4 px-1 py-2">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-3.5 w-3.5" /> E-post
              </span>
              <span className="truncate">{session?.user.email ?? "—"}</span>
            </div>
            <div className="flex items-center justify-between gap-4 px-1 py-2">
              <span className="flex items-center gap-2 text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5" /> Innlogging via
              </span>
              <span>{providerLabel}</span>
            </div>
            <div className="flex items-center justify-between gap-4 px-1 py-2">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" /> Medlem siden
              </span>
              <span>{memberSince}</span>
            </div>
            <div className="flex items-center justify-between gap-4 px-1 py-2">
              <span className="flex items-center gap-2 text-muted-foreground">
                <KeyRound className="h-3.5 w-3.5" /> Bruker-ID
              </span>
              <span className="truncate font-mono text-[11px] text-muted-foreground">
                {session?.user.id ?? "—"}
              </span>
            </div>
          </div>
        </section>

        <section className="frame p-4">
          <div className="mb-3 flex items-center justify-between border-b border-border pb-2">
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.25em]">Varsler</p>
          </div>
          <div className="space-y-1 text-[13px]">
            {["Nyhetsbrev", "Push-varsler", "Ukentlig oppsummering"].map((f, i) => (
              <label
                key={f}
                className="flex cursor-pointer items-center justify-between px-1 py-2 transition hover:bg-secondary/50"
              >
                <span>{f}</span>
                <span
                  className={`relative h-4 w-8 border transition ${
                    i === 0 ? "border-primary bg-primary/25" : "border-border bg-secondary"
                  }`}
                >
                  <span
                    className={`absolute top-0 h-3 w-3 transition ${
                      i === 0 ? "left-4 bg-primary" : "left-0 bg-muted-foreground"
                    }`}
                  />
                </span>
              </label>
            ))}
          </div>
        </section>

        <button
          onClick={handleSignOut}
          className="flex w-full items-center justify-center gap-2 border border-border px-4 py-3 font-mono text-xs font-bold uppercase tracking-widest text-muted-foreground transition hover:border-primary hover:text-primary"
        >
          <LogOut className="h-3.5 w-3.5" />
          Logg ut
        </button>
      </main>
    </div>
  );
}
