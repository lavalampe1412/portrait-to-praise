import { createFileRoute } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Search, Bell, Plus, TrendingUp, Clock, Bookmark, Share2, Play, Sun, Moon } from "lucide-react";
import { useState, useEffect } from "react";

import heroSport from "@/assets/hero-sport.jpg";
import heroFire from "@/assets/hero-fire.jpg";
import heroPolitics from "@/assets/hero-politics.jpg";
import heroBusiness from "@/assets/hero-business.jpg";

export const Route = createFileRoute("/")({
  component: Index,
});

const CATEGORIES = ["For Deg", "Nyheter", "Sport", "Politikk", "Business", "Kultur", "Diverse"];

const TRENDS = {
  Daily: [
    { rank: 1, title: "Regjeringen", delta: "+142%" },
    { rank: 2, title: "Israel-Palestina", delta: "+88%" },
    { rank: 3, title: "Russland-Ukraina", delta: "+41%" },
    { rank: 4, title: "Norges Landslag", delta: "+29%" },
    { rank: 5, title: "Erna Solberg", delta: "+22%" },
    { rank: 6, title: "Statsbudsjettet", delta: "+18%" },
    { rank: 7, title: "Kristiansand", delta: "+14%" },
  ],
  Weekly: [
    { rank: 1, title: "Rentemøtet", delta: "+310%" },
    { rank: 2, title: "Champions League", delta: "+204%" },
    { rank: 3, title: "Klima­toppmøtet", delta: "+117%" },
    { rank: 4, title: "Regjeringen", delta: "+96%" },
    { rank: 5, title: "Equinor", delta: "+52%" },
  ],
  Monthly: [
    { rank: 1, title: "Statsbudsjettet 2026", delta: "+512%" },
    { rank: 2, title: "AI-loven", delta: "+289%" },
    { rank: 3, title: "Boligmarkedet", delta: "+177%" },
    { rank: 4, title: "Nord Stream", delta: "+120%" },
    { rank: 5, title: "OL 2026", delta: "+88%" },
  ],
} as const;

const MEDIA = [
  { name: "VG", tag: "VG", color: "bg-red-600" },
  { name: "NRK", tag: "NRK", color: "bg-sky-500" },
  { name: "Dagbladet", tag: "DB", color: "bg-red-500" },
  { name: "DN", tag: "DN", color: "bg-blue-900" },
  { name: "Nettavisen", tag: "Na", color: "bg-neutral-100 text-black" },
  { name: "E24", tag: "E24", color: "bg-neutral-900 border border-ember" },
  { name: "Kapital", tag: "KK", color: "bg-red-700" },
  { name: "Aftenposten", tag: "AP", color: "bg-neutral-800" },
];

const HERO = {
  kicker: "Sport · Champions League",
  title: "Opprør etter absurd avgjørelse: «En skandale»",
  dek: "VAR-beslutningen i sluttminuttene har utløst massiv kritikk fra spillere, trenere og eksperter over hele Europa.",
  image: heroSport,
  source: "Nettavisen",
  time: "29.11.2026 · 00:15",
  read: "4 min",
};

const STORIES = [
  {
    kicker: "Innenriks · Kristiansand",
    title: "Verneverdig bygning gikk tapt i brann",
    dek: "Den 200 år gamle trekonstruksjonen brant ned til grunnen på under to timer.",
    image: heroFire,
    source: "NRK",
    time: "02:15",
    read: "3 min",
  },
  {
    kicker: "Politikk · Stortinget",
    title: "Regjeringen møter motstand i statsbudsjettet",
    dek: "Opposisjonen samler seg mot omstridte kutt i velferdsordningene.",
    image: heroPolitics,
    source: "Aftenposten",
    time: "06:40",
    read: "5 min",
  },
  {
    kicker: "Business · Oslo Børs",
    title: "Rentemøtet sender kronen ned mot euroen",
    dek: "Analytikere venter uendret rente, men signaler om videre utvikling er avgjørende.",
    image: heroBusiness,
    source: "E24",
    time: "07:22",
    read: "4 min",
  },
];

const QUICK = [
  { source: "VG", title: "Politikere krever gransking av tildelingen", time: "5 min siden" },
  { source: "DN", title: "Oljeprisen faller for tredje dag på rad", time: "12 min siden" },
  { source: "NRK", title: "Nytt uvær på vei inn over Vestlandet", time: "22 min siden" },
  { source: "Dagbladet", title: "Kjendispar bekrefter bruddet etter ti år", time: "38 min siden" },
  { source: "Kapital", title: "Startup henter 400 millioner i ny runde", time: "1 t siden" },
];

function Index() {
  const [tab, setTab] = useState<keyof typeof TRENDS>("Daily");
  const [cat, setCat] = useState("For Deg");

  return (
    <div className="min-h-screen bg-background font-sans text-foreground antialiased selection:bg-primary selection:text-primary-foreground">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-8 px-6">
          <a href="/" className="flex items-baseline gap-2">
            <span className="font-display text-3xl leading-none tracking-tight">Nyhet</span>
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          </a>
          <nav className="hidden items-center gap-1 md:flex">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`relative rounded-full px-4 py-1.5 text-sm transition ${
                  cat === c
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {cat === c && (
                  <span className="absolute inset-0 rounded-full bg-secondary" />
                )}
                <span className="relative">{c}</span>
              </button>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <div className="hidden items-center gap-2 rounded-full border border-border bg-secondary/60 px-3 py-1.5 text-sm text-muted-foreground md:flex">
              <Search className="h-4 w-4" />
              <span>Søk i nyheter</span>
              <kbd className="ml-4 rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px]">⌘K</kbd>
            </div>
            <button className="rounded-full border border-border p-2 hover:bg-secondary">
              <Bell className="h-4 w-4" />
            </button>
            <button className="rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              Logg inn
            </button>
          </div>
        </div>
      </header>

      {/* 3-column layout */}
      <main className="mx-auto grid max-w-[1600px] grid-cols-1 gap-6 px-6 py-8 lg:grid-cols-[260px_minmax(0,1fr)_300px]">
        {/* LEFT — Trender */}
        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <section>
            <div className="mb-4 flex items-end justify-between">
              <h2 className="font-display text-3xl leading-none">Trender</h2>
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <div className="mb-4 flex gap-1 rounded-full border border-border p-1 text-xs">
              {(Object.keys(TRENDS) as (keyof typeof TRENDS)[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`flex-1 rounded-full px-3 py-1.5 transition ${
                    tab === t
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <ol className="space-y-1">
              {TRENDS[tab].map((t) => (
                <li key={t.rank}>
                  <a
                    href="#"
                    className="group flex items-baseline gap-3 rounded-lg px-2 py-2 transition hover:bg-secondary"
                  >
                    <span className="font-mono text-xs text-muted-foreground w-4">
                      {String(t.rank).padStart(2, "0")}
                    </span>
                    <span className="flex-1 text-sm leading-snug group-hover:text-primary">
                      {t.title}
                    </span>
                    <span className="font-mono text-[10px] text-primary">{t.delta}</span>
                  </a>
                </li>
              ))}
            </ol>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5">
            <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Direkte nå
            </p>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              <span className="text-sm font-medium">Rentemøtet</span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Norges Bank presenterer beslutningen kl. 10:00. Følg live-oppdateringen.
            </p>
            <button className="mt-4 flex items-center gap-2 text-xs font-medium text-primary hover:underline">
              <Play className="h-3 w-3 fill-current" /> Se sending
            </button>
          </section>
        </aside>

        {/* CENTER — Feed */}
        <section className="space-y-8 min-w-0">
          {/* Category label */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Sunday · 26. juli
              </p>
              <h1 className="font-display text-5xl leading-none tracking-tight">{cat}</h1>
            </div>
            <div className="hidden gap-2 sm:flex">
              <button className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:text-foreground">
                Nyest
              </button>
              <button className="rounded-full bg-secondary px-3 py-1 text-xs text-foreground">
                Anbefalt
              </button>
            </div>
          </div>

          {/* Hero article */}
          <article className="group overflow-hidden rounded-3xl border border-border bg-card">
            <div className="relative aspect-[16/9] overflow-hidden">
              <img
                src={HERO.image}
                alt=""
                width={1280}
                height={800}
                className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-8">
                <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-primary">
                  {HERO.kicker}
                </p>
                <h2 className="max-w-3xl font-display text-4xl leading-[1.05] tracking-tight text-white md:text-5xl">
                  {HERO.title}
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-neutral-300">
                  {HERO.dek}
                </p>
                <div className="mt-5 flex items-center gap-4 text-xs text-neutral-400">
                  <span className="rounded-full bg-white/10 px-2.5 py-1 font-medium text-white backdrop-blur">
                    {HERO.source}
                  </span>
                  <span className="flex items-center gap-1.5"><Clock className="h-3 w-3" />{HERO.time}</span>
                  <span>{HERO.read}</span>
                  <div className="ml-auto flex gap-1">
                    <button className="rounded-full bg-white/10 p-2 text-white backdrop-blur hover:bg-white/20"><Bookmark className="h-3.5 w-3.5" /></button>
                    <button className="rounded-full bg-white/10 p-2 text-white backdrop-blur hover:bg-white/20"><Share2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              </div>
              <div className="absolute inset-y-0 left-0 flex items-center">
                <button className="ml-3 rounded-full bg-black/40 p-2.5 text-white backdrop-blur hover:bg-black/60">
                  <ChevronLeft className="h-4 w-4" />
                </button>
              </div>
              <div className="absolute inset-y-0 right-0 flex items-center">
                <button className="mr-3 rounded-full bg-black/40 p-2.5 text-white backdrop-blur hover:bg-black/60">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </article>

          {/* Two-column secondary stories */}
          <div className="grid gap-6 sm:grid-cols-2">
            {STORIES.slice(0, 2).map((s) => (
              <StoryCard key={s.title} story={s} />
            ))}
          </div>

          {/* Featured wide */}
          <StoryCard story={STORIES[2]} wide />

          {/* Quick reads list */}
          <section className="rounded-3xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h3 className="font-display text-2xl">Kort og godt</h3>
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Oppdatert nå
              </span>
            </div>
            <ul className="divide-y divide-border">
              {QUICK.map((q) => (
                <li key={q.title}>
                  <a href="#" className="group flex items-center gap-4 px-6 py-4 transition hover:bg-secondary/50">
                    <span className="rounded-full border border-border px-2.5 py-1 font-mono text-[10px] tracking-wider text-muted-foreground">
                      {q.source}
                    </span>
                    <span className="flex-1 text-sm group-hover:text-primary">{q.title}</span>
                    <span className="hidden font-mono text-[10px] text-muted-foreground sm:block">
                      {q.time}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        </section>

        {/* RIGHT — Dine Medier */}
        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <section>
            <div className="mb-4 flex items-end justify-between">
              <h2 className="font-display text-3xl leading-none">Dine medier</h2>
              <button className="rounded-full border border-border p-1.5 hover:bg-secondary">
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {MEDIA.map((m) => (
                <button
                  key={m.name}
                  className={`flex aspect-square items-center justify-center rounded-xl font-mono text-xs font-bold text-white transition hover:scale-105 ${m.color}`}
                  title={m.name}
                >
                  {m.tag}
                </button>
              ))}
              <button className="flex aspect-square items-center justify-center rounded-xl border border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary">
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="font-display text-xl leading-none">Filter</p>
              <span className="font-mono text-[10px] text-muted-foreground">konto-avhengig</span>
            </div>
            <div className="space-y-2 text-sm">
              {["Skjul sport", "Kun norske kilder", "Skjul lest", "Prioriter lange saker"].map((f, i) => (
                <label key={f} className="flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 hover:bg-secondary">
                  <span>{f}</span>
                  <span className={`relative h-4 w-7 rounded-full transition ${i === 1 || i === 2 ? "bg-primary" : "bg-secondary border border-border"}`}>
                    <span className={`absolute top-0.5 h-3 w-3 rounded-full bg-background transition ${i === 1 || i === 2 ? "left-3.5" : "left-0.5"}`} />
                  </span>
                </label>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-primary/40 bg-gradient-to-br from-primary/10 to-transparent p-5">
            <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-primary">Nyhet Pro</p>
            <h3 className="font-display text-2xl leading-tight">Les alt, uten reklame.</h3>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Full tilgang til over 40 norske medier for 79 kr / mnd.
            </p>
            <button className="mt-4 w-full rounded-full bg-primary py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              Prøv 30 dager gratis
            </button>
          </section>
        </aside>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-2 px-6 py-8 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono">© 2026 NYHET / Oslo</p>
          <p>Et moderne nyhetsdashbord — bygget for lesing, ikke scrolling.</p>
        </div>
      </footer>
    </div>
  );
}

function StoryCard({ story, wide = false }: { story: typeof STORIES[number]; wide?: boolean }) {
  return (
    <article className={`group overflow-hidden rounded-2xl border border-border bg-card ${wide ? "grid sm:grid-cols-[1.4fr_1fr]" : ""}`}>
      <div className={`relative overflow-hidden ${wide ? "aspect-[4/3] sm:aspect-auto" : "aspect-[4/3]"}`}>
        <img
          src={story.image}
          alt=""
          loading="lazy"
          width={1000}
          height={640}
          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
        />
      </div>
      <div className="p-6">
        <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-primary">
          {story.kicker}
        </p>
        <h3 className={`font-display leading-[1.1] tracking-tight ${wide ? "text-3xl" : "text-2xl"}`}>
          {story.title}
        </h3>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{story.dek}</p>
        <div className="mt-5 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="rounded-full border border-border px-2 py-0.5 font-mono text-[10px]">
            {story.source}
          </span>
          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{story.time}</span>
          <span>· {story.read}</span>
        </div>
      </div>
    </article>
  );
}
