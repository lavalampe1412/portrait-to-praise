import { createFileRoute, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-profile";
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  Clock,
  Moon,
  Play,
  Plus,
  Search,
  Sun,
  TrendingUp,
  User,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/* ------------------------------------------------------------------
   Innhold lastes fra JSON-filer som ligger på samme webserver.

   /content/site.json                 – medier, kategorier og trender (indeks)
   /content/categories/<slug>.json    – én feed per kategori
   /content/trends/<periode>-<n>.json – én feed per trend
------------------------------------------------------------------- */

const CONTENT_BASE = "/content";

interface Media {
  name: string;
  tag: string;
  logo: string;
}

interface Version {
  source: string;
  title: string;
  time: string;
  read: string;
  image?: string;
  url?: string;
}

interface VStory {
  kicker: string;
  dek: string;
  image: string;
  versions: Version[];
}

interface VFeed {
  hero: VStory | null;
  stories: VStory[];
  quick: Version[];
}

interface CategoryRef {
  name: string;
  file: string;
}

interface TrendRef {
  rank: number;
  title: string;
  delta: string;
  file: string;
}

interface SiteConfig {
  media: Media[];
  categories: CategoryRef[];
  trends: Record<string, TrendRef[]>;
}

const EMPTY_FEED: VFeed = { hero: null, stories: [], quick: [] };

// Oppdateres når site.json er lastet, slik at MediaLogo finner logoene.
let MEDIA_BY_NAME: Record<string, Media> = {};

async function loadJson<T>(path: string): Promise<T> {
  const res = await fetch(`${CONTENT_BASE}/${path}`.replace(/([^:]\/)\/+/g, "$1"), {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`Kunne ikke laste ${path} (${res.status})`);
  return (await res.json()) as T;
}

function normalizeFeed(raw: Partial<VFeed> | null | undefined): VFeed {
  if (!raw) return EMPTY_FEED;
  return {
    hero: raw.hero ?? null,
    stories: Array.isArray(raw.stories) ? raw.stories : [],
    quick: Array.isArray(raw.quick) ? raw.quick : [],
  };
}

function MediaLogo({ source, className = "h-5 w-5" }: { source: string; className?: string }) {
  const m = MEDIA_BY_NAME[source];
  if (!m) return null;
  return (
    <img
      src={m.logo}
      alt={m.name}
      loading="lazy"
      className={`shrink-0 rounded-md object-cover ${className}`}
    />
  );
}

function filterFeed(feed: VFeed, enabled: Set<string>): VFeed {
  const filterStory = (s: VStory): VStory | null => {
    const versions = s.versions.filter((v) => enabled.has(v.source));
    if (versions.length === 0) return null;
    return { ...s, versions };
  };
  const hero = feed.hero ? filterStory(feed.hero) : null;
  const stories = feed.stories.map(filterStory).filter(Boolean) as VStory[];
  const quick = feed.quick.filter((q) => enabled.has(q.source));
  return { hero, stories, quick };
}

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const [site, setSite] = useState<SiteConfig | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [tab, setTab] = useState<string>("Dag");
  const [cat, setCat] = useState("Nyheter");
  const [trend, setTrend] = useState<TrendRef | null>(null);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [enabledMedia, setEnabledMedia] = useState<Set<string>>(new Set());
  const [heroIdx, setHeroIdx] = useState(0);

  const [rawFeed, setRawFeed] = useState<VFeed>(EMPTY_FEED);
  const [feedLoading, setFeedLoading] = useState(true);
  const feedCache = useRef<Map<string, VFeed>>(new Map());

  const MEDIA = site?.media ?? [];
  const CATEGORIES = site?.categories ?? [];
  const TRENDS = site?.trends ?? {};

  // --- last site.json
  useEffect(() => {
    let alive = true;
    loadJson<SiteConfig>("site.json")
      .then((data) => {
        if (!alive) return;
        MEDIA_BY_NAME = Object.fromEntries(data.media.map((m) => [m.name, m]));
        setSite(data);
        setEnabledMedia(new Set(data.media.map((m) => m.name)));
        const periods = Object.keys(data.trends);
        if (periods.length > 0 && periods[0]) setTab(periods[0]);
        if (!data.categories.some((c) => c.name === cat) && data.categories[0]) {
          setCat(data.categories[0].name);
        }
      })
      .catch((e: Error) => alive && setLoadError(e.message));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- last aktiv feed (kategori eller trend)
  const activeFile = useMemo(() => {
    if (trend) return trend.file;
    return CATEGORIES.find((c) => c.name === cat)?.file ?? null;
  }, [trend, cat, CATEGORIES]);

  useEffect(() => {
    if (!activeFile) return;
    const cached = feedCache.current.get(activeFile);
    if (cached) {
      setRawFeed(cached);
      setFeedLoading(false);
      return;
    }
    let alive = true;
    setFeedLoading(true);
    loadJson<Partial<VFeed>>(activeFile)
      .then((data) => {
        const feed = normalizeFeed(data);
        feedCache.current.set(activeFile, feed);
        if (!alive) return;
        setRawFeed(feed);
        setFeedLoading(false);
      })
      .catch((e: Error) => {
        if (!alive) return;
        setRawFeed(EMPTY_FEED);
        setFeedLoading(false);
        setLoadError(e.message);
      });
    return () => {
      alive = false;
    };
  }, [activeFile]);

  useEffect(() => {
    const saved = typeof window !== "undefined" ? window.localStorage.getItem("nyhet-theme") : null;
    const initial = saved === "light" ? "light" : "dark";
    setTheme(initial);
    document.documentElement.classList.toggle("light", initial === "light");
  }, []);

  const applyTheme = (next: "dark" | "light") => {
    setTheme(next);
    document.documentElement.classList.toggle("light", next === "light");
    if (typeof window !== "undefined") {
      window.localStorage.setItem("nyhet-theme", next);
    }
  };

  const toggleMedia = useCallback((name: string) => {
    setEnabledMedia((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }, []);

  const feed = useMemo(() => filterFeed(rawFeed, enabledMedia), [rawFeed, enabledMedia]);

  const heroStory = feed.hero;
  const heroVersion = heroStory?.versions[heroIdx % (heroStory.versions.length || 1)];
  const storyList = feed.stories;
  const quickList = feed.quick;

  useEffect(() => {
    setHeroIdx(0);
  }, [cat, trend, enabledMedia.size]);

  // Auth-økt
  const { session, profileName, profileAvatar } = useProfile();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openProfileMenu = useCallback(() => {
    if (profileMenuCloseTimer.current) clearTimeout(profileMenuCloseTimer.current);
    setProfileMenuOpen(true);
  }, []);

  const scheduleCloseProfileMenu = useCallback(() => {
    profileMenuCloseTimer.current = setTimeout(() => setProfileMenuOpen(false), 300);
  }, []);

  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);


  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      {/* Masthead / edition bar */}
      <div className="border-b border-border">
        <div className="mx-auto flex max-w-[1600px] flex-col items-center justify-between gap-3 px-6 py-5 sm:flex-row sm:gap-6">
          <div className="text-center sm:text-left">
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
              OSL // 26.07.2026 // W30
            </p>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
              18°C · LAVTRYKK_VEST
            </p>
          </div>

          <div className="text-center">
            <h1 className="font-display text-4xl tracking-[-0.02em] text-foreground md:text-5xl">
              fidia<span className="text-primary">.</span>
            </h1>
            <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.35em] text-muted-foreground">
              signal / norsk presse
            </p>
          </div>

          <div className="hidden items-center gap-2 sm:flex">
            <button
              onClick={() => applyTheme(theme === "dark" ? "light" : "dark")}
              aria-label={theme === "dark" ? "Bytt til lyst tema" : "Bytt til mørkt tema"}
              className="flex h-9 w-9 items-center justify-center border border-border text-muted-foreground transition hover:border-primary hover:text-primary"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button className="flex h-9 w-9 items-center justify-center border border-border text-muted-foreground transition hover:border-primary hover:text-primary">
              <Bell className="h-4 w-4" />
            </button>
            {session ? (
              <div
                className="relative"
                onMouseEnter={openProfileMenu}
                onMouseLeave={scheduleCloseProfileMenu}
              >
                <button className="flex items-center gap-2 border border-transparent px-1.5 py-1 transition hover:border-border focus:outline-none">
                  {profileAvatar ? (
                    <img
                      src={profileAvatar}
                      alt={profileName}
                      className="h-7 w-7 shrink-0 rounded-full border border-border object-cover"
                    />
                  ) : (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground">
                      <User className="h-3.5 w-3.5" />
                    </div>
                  )}
                  <span className="max-w-[140px] truncate font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                    {profileName}
                  </span>
                </button>
                {profileMenuOpen && (
                  <div className="absolute right-0 top-full z-50 mt-2 min-w-[10rem] rounded-lg border border-border bg-popover p-1.5">
                    <Link
                      to="/konto"
                      className="block w-full rounded-md px-3 py-2 text-left font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground transition hover:bg-secondary hover:text-foreground"
                    >
                      Konto
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="w-full rounded-md px-3 py-2 text-left font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground transition hover:bg-secondary hover:text-foreground"
                    >
                      Logg ut
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/auth"
                className="border border-primary bg-primary px-4 py-2 font-mono text-xs font-bold uppercase tracking-widest text-primary-foreground transition hover:bg-transparent hover:text-primary"
              >
                Logg inn
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Category nav */}
      <div className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-6 py-2">
          <nav className="flex items-center gap-0 overflow-x-auto">
            {CATEGORIES.map((c) => (
              <button
                key={c.name}
                onClick={() => {
                  setCat(c.name);
                  setTrend(null);
                }}
                className={`relative whitespace-nowrap rounded-full px-4 py-2 font-mono text-[11px] font-medium uppercase tracking-[0.18em] transition ${
                  cat === c.name && !trend
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {c.name}
              </button>
            ))}

          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <div className="flex items-center gap-2 border border-border px-3 py-1.5 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              <Search className="h-3.5 w-3.5" />
              <span>Søk</span>
              <kbd className="ml-2 border border-border px-1.5 py-0.5 font-mono text-[10px]">⌘K</kbd>
            </div>
          </div>
        </div>
      </div>


      {/* 3-column layout */}
      <main className="mx-auto grid max-w-[1600px] grid-cols-1 gap-8 px-6 py-10 lg:grid-cols-[240px_minmax(0,1fr)_300px]">
        {/* LEFT — Trender */}
        <aside className="space-y-8 lg:sticky lg:top-24 lg:self-start">
          <section className="frame">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h2 className="font-mono text-[11px] font-bold uppercase tracking-[0.25em]">Trender</h2>
              <TrendingUp className="h-3.5 w-3.5 text-primary" />
            </div>
            <div className="flex border-b border-border font-mono text-[10px] uppercase tracking-widest">
              {(Object.keys(TRENDS) as (keyof typeof TRENDS)[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`flex-1 px-2 py-2 transition ${
                    tab === t
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <ol className="divide-y divide-border">
              {(TRENDS[tab] ?? []).map((t) => (
                <li key={t.rank}>
                  <button
                    type="button"
                    onClick={() => setTrend(t)}
                    className={`group flex w-full items-baseline gap-3 px-3 py-2.5 text-left transition hover:bg-secondary/60 ${
                      trend?.file === t.file ? "bg-primary/15 border-l-2 border-primary" : "border-l-2 border-transparent"
                    }`}
                  >

                    <span className="w-5 font-mono text-[11px] font-bold text-primary">
                      {String(t.rank).padStart(2, "0")}
                    </span>
                    <span className="flex-1 text-[13px] leading-snug group-hover:text-primary">
                      {t.title}
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground">{t.delta}</span>
                  </button>
                </li>
              ))}
            </ol>
          </section>

          <section className="frame p-4">
            <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.25em] text-primary">
              ● Direkte nå
            </p>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping bg-primary opacity-75" />
                <span className="relative inline-flex h-2 w-2 bg-primary" />
              </span>
              <span className="font-display text-sm">Rentemøtet</span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Norges Bank presenterer beslutningen kl. 10:00. Følg live-oppdateringen.
            </p>
            <button className="mt-4 flex items-center gap-2 border border-primary px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-primary transition hover:bg-primary hover:text-primary-foreground">
              <Play className="h-3 w-3 fill-current" /> Se sending
            </button>
          </section>
        </aside>


        {/* CENTER — Feed */}
        <section className="min-w-0 space-y-8">
          {/* Section header */}
          <div className="flex items-end justify-between border-b border-border pb-3">
            <div>
              <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                {trend ? "// aktivt filter" : "// hovedseksjon"}
              </p>
              <h2 className="font-display text-3xl leading-none md:text-4xl">
                {trend?.title ?? cat}
              </h2>
            </div>
            <div className="hidden items-center gap-2 sm:flex">
              {trend ? (
                <button
                  onClick={() => setTrend(null)}
                  className="flex items-center gap-1.5 border border-primary px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-primary transition hover:bg-primary hover:text-primary-foreground"
                >
                  Fjern filter <span className="text-sm leading-none">×</span>
                </button>
              ) : (
                <>
                  <button className="border border-border px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground transition hover:border-primary hover:text-primary">
                    Nyest
                  </button>
                  <button className="border border-primary bg-primary px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-primary-foreground">
                    Anbefalt
                  </button>
                </>
              )}
            </div>
          </div>


          {/* Hero article */}
          {feedLoading ? (
            <article className="frame animate-pulse">
              <div className="aspect-[16/9] w-full bg-secondary" />
            </article>
          ) : loadError && !heroStory ? (
            <article className="border border-dashed border-border bg-card p-12 text-center">
              <p className="font-display text-xl">Kunne ikke laste innhold</p>
              <p className="mt-2 font-mono text-xs text-muted-foreground">{loadError}</p>
            </article>
          ) : heroVersion && heroStory ? (

            <article className="group frame">
              <div className="relative aspect-[16/9] overflow-hidden">
                <img
                  src={heroVersion.image || heroStory.image}
                  onError={(e) => {
                    if (heroStory.image) e.currentTarget.src = heroStory.image;
                  }}
                  alt=""
                  width={1280}
                  height={800}
                  className="h-full w-full object-cover contrast-[1.1] saturate-[0.85] transition duration-700 group-hover:scale-[1.03] group-hover:saturate-100"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/55 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6 md:p-8">
                  <p className="mb-3 inline-block border border-primary bg-primary px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-primary-foreground">
                    {heroStory.kicker}
                  </p>
                  <h3 className="max-w-3xl font-display text-3xl leading-[0.98] text-white md:text-4xl lg:text-5xl">
                    <a
                      href={heroVersion.url || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="transition hover:underline hover:decoration-primary hover:underline-offset-4"
                    >
                      {heroVersion.title}
                    </a>
                  </h3>
                  <p className="mt-3 max-w-2xl text-sm leading-relaxed text-neutral-300">
                    {heroStory.dek}
                  </p>
                  <div className="mt-5 flex flex-wrap items-center gap-3 font-mono text-[10px] uppercase tracking-widest text-neutral-300">
                    <span className="flex items-center gap-1.5 border border-white/40 px-2 py-1 font-bold text-white">
                      <MediaLogo source={heroVersion.source} className="h-4 w-4" />
                      {heroVersion.source}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3 w-3" />
                      {heroVersion.time}
                    </span>
                    <span>{heroVersion.read}</span>
                    <div className="ml-auto flex items-center gap-1.5">
                      {heroStory.versions.map((ver, k) => (
                        <button
                          key={ver.source}
                          onClick={() => setHeroIdx(k)}
                          aria-label={`Versjon ${k + 1}: ${ver.source}`}
                          className={`rounded-md p-0.5 transition-all ${
                            k === heroIdx % heroStory.versions.length
                              ? "ring-2 ring-primary opacity-100"
                              : "opacity-50 grayscale hover:opacity-90 hover:grayscale-0"
                          }`}
                        >
                          <MediaLogo source={ver.source} className="h-5 w-5" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                {heroStory.versions.length > 1 && (
                  <>
                    <div className="absolute inset-y-0 left-0 flex items-center">
                      <button
                        onClick={() =>
                          setHeroIdx((n) => (n - 1 + heroStory.versions.length) % heroStory.versions.length)
                        }
                        aria-label="Forrige versjon"
                        className="ml-3 border border-white/50 bg-black/50 p-2 text-white backdrop-blur transition hover:border-primary hover:text-primary"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="absolute inset-y-0 right-0 flex items-center">
                      <button
                        onClick={() => setHeroIdx((n) => (n + 1) % heroStory.versions.length)}
                        aria-label="Neste versjon"
                        className="mr-3 border border-white/50 bg-black/50 p-2 text-white backdrop-blur transition hover:border-primary hover:text-primary"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            </article>
          ) : (
            <article className="border border-dashed border-border bg-card p-12 text-center">
              <p className="font-display text-xl">Ingen medier valgt</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Aktiver minst én kilde under «Dine medier» for å se saker.
              </p>
            </article>
          )}


          {/* Secondary stories */}
          {storyList.length > 0 && (
            <>
              <div className="grid gap-8 sm:grid-cols-2">
                {storyList.slice(0, 2).map((s) => (
                  <StoryCard key={s.kicker + s.dek} story={s} />
                ))}
              </div>
              {storyList[2] && (
                <StoryCard key={storyList[2].kicker + storyList[2].dek} story={storyList[2]} wide />
              )}
            </>
          )}

          {/* Quick reads list */}
          <section className="frame">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h3 className="font-mono text-[11px] font-bold uppercase tracking-[0.25em]">Kort og godt</h3>
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
                ● Oppdatert nå
              </span>
            </div>
            <ul className="divide-y divide-border">
              {quickList.map((q) => (
                <li key={q.title}>
                  <a
                    href={q.url || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-4 border-l-2 border-transparent px-4 py-3 transition hover:border-primary hover:bg-secondary/40"
                  >
                    <span className="flex items-center gap-1.5 border border-border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      <MediaLogo source={q.source} className="h-4 w-4" />
                      {q.source}
                    </span>
                    {q.image && (
                      <img
                        src={q.image}
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                        alt=""
                        loading="lazy"
                        className="hidden h-9 w-14 shrink-0 object-cover sm:block"
                      />
                    )}
                    <span className="flex-1 text-[13px] group-hover:text-primary">{q.title}</span>
                    <span className="hidden font-mono text-[10px] text-muted-foreground sm:block">
                      {q.time}
                    </span>
                  </a>
                </li>
              ))}

              {quickList.length === 0 && (
                <li className="px-5 py-6 text-center text-sm text-muted-foreground">
                  Ingen aktive kilder.
                </li>
              )}
            </ul>
          </section>
        </section>

        {/* RIGHT — Dine Medier */}
        <aside className="space-y-8 lg:sticky lg:top-24 lg:self-start">
          <section className="frame p-4">
            <div className="mb-1 flex items-center justify-between border-b border-border pb-2">
              <h2 className="font-mono text-[11px] font-bold uppercase tracking-[0.25em]">Dine medier</h2>
              <button className="flex h-6 w-6 items-center justify-center border border-border text-muted-foreground transition hover:border-primary hover:text-primary">
                <Plus className="h-3 w-3" />
              </button>
            </div>
            <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              {enabledMedia.size}/{MEDIA.length} aktive
            </p>
            <div className="grid grid-cols-4 gap-1.5">
              {MEDIA.map((m) => {
                const on = enabledMedia.has(m.name);
                return (
                  <button
                    key={m.name}
                    onClick={() => toggleMedia(m.name)}
                    aria-pressed={on}
                    className={`flex aspect-square items-center justify-center overflow-hidden rounded-lg border transition ${
                      on ? "border-transparent opacity-90 hover:opacity-100" : "border-border opacity-25 grayscale"
                    }`}
                    title={`${m.name} — ${on ? "aktiv, klikk for å skjule" : "skjult, klikk for å vise"}`}
                  >
                    <img src={m.logo} alt={m.name} loading="lazy" className="h-full w-full object-cover" />
                  </button>
                );
              })}
              <button className="flex aspect-square items-center justify-center border border-dashed border-border text-muted-foreground transition hover:border-primary hover:text-primary">
                <Plus className="h-4 w-4" />
              </button>
            </div>
            {enabledMedia.size < MEDIA.length && (
              <button
                onClick={() => setEnabledMedia(new Set(MEDIA.map((m) => m.name)))}
                className="mt-3 w-full border border-primary py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-primary transition hover:bg-primary hover:text-primary-foreground"
              >
                Vis alle igjen
              </button>
            )}
          </section>

          <section className="frame p-4">
            <div className="mb-3 flex items-center justify-between border-b border-border pb-2">
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.25em]">Filter</p>
              <span className="font-mono text-[9px] uppercase text-muted-foreground">konto</span>
            </div>
            <div className="space-y-1 text-[13px]">
              {["Skjul sport", "Kun norske kilder", "Skjul lest", "Prioriter lange saker"].map((f, i) => (
                <label
                  key={f}
                  className="flex cursor-pointer items-center justify-between px-1 py-2 transition hover:bg-secondary/50"
                >
                  <span>{f}</span>
                  <span
                    className={`relative h-4 w-8 border transition ${
                      i === 1 || i === 2 ? "border-primary bg-primary/25" : "border-border bg-secondary"
                    }`}
                  >
                    <span
                      className={`absolute top-0 h-3 w-3 transition ${
                        i === 1 || i === 2 ? "left-4 bg-primary" : "left-0 bg-muted-foreground"
                      }`}
                    />
                  </span>
                </label>
              ))}
            </div>
          </section>

          <section className="frame border-primary p-4">
            <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.3em] text-primary">fidia Pro</p>
            <h3 className="font-display text-xl leading-tight">Les alt, uten reklame.</h3>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Full tilgang til over 40 norske medier for 79 kr / mnd.
            </p>
            <button className="mt-4 w-full border border-primary bg-primary py-2 font-mono text-[11px] font-bold uppercase tracking-widest text-primary-foreground transition hover:bg-transparent hover:text-primary">
              Prøv 30 dager gratis
            </button>
          </section>
        </aside>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-3 px-6 py-8 font-mono text-[10px] uppercase tracking-widest text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 FIDIA / OSLO</p>
          <p>bygget for lesing — ikke scrolling</p>
        </div>
      </footer>

    </div>
  );
}

function StoryCard({ story, wide = false }: { story: VStory; wide?: boolean }) {
  const [i, setI] = useState(0);
  const count = story.versions.length;
  const idx = count > 0 ? i % count : 0;
  const v = story.versions[idx];
  useEffect(() => {
    if (i >= count) setI(0);
  }, [count, i]);
  if (!v) return null;
  const prev = () => setI((n) => (n - 1 + count) % count);
  const next = () => setI((n) => (n + 1) % count);
  return (
    <article
      className={`group frame overflow-hidden transition hover:border-primary ${
        wide ? "grid sm:grid-cols-[1.4fr_1fr]" : ""
      }`}
    >
      <div className={`relative overflow-hidden ${wide ? "aspect-[4/3] sm:aspect-auto" : "aspect-[4/3]"}`}>
        <img
          src={v.image || story.image}
          onError={(e) => {
            if (story.image) e.currentTarget.src = story.image;
          }}
          alt=""
          loading="lazy"
          width={1000}
          height={640}
          className="h-full w-full object-cover contrast-[1.1] saturate-[0.7] transition duration-700 group-hover:scale-[1.03] group-hover:saturate-100"
        />
        <span className="absolute left-0 top-0 bg-primary px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-primary-foreground">
          {story.kicker}
        </span>
      </div>
      <div className="flex flex-col p-4">
        <h3
          className={`font-display leading-[1.05] ${
            wide ? "text-xl md:text-2xl" : "text-lg md:text-xl"
          }`}
        >
          <a
            href={v.url || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="transition hover:text-primary"
          >
            {v.title}
          </a>
        </h3>
        <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{story.dek}</p>
        <div className="mt-3 flex items-center gap-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          <span className="flex items-center gap-1.5 border border-border px-2 py-0.5 text-foreground">
            <MediaLogo source={v.source} className="h-4 w-4" />
            {v.source}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {v.time}
          </span>
          <span>· {v.read}</span>
        </div>
        {count > 1 && (
          <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-3">
            <button
              onClick={prev}
              aria-label="Forrige versjon"
              className="border border-border p-1 text-muted-foreground transition hover:border-primary hover:text-primary"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <div className="flex flex-1 items-center justify-center gap-1">
              {story.versions.map((ver, k) => (
                <button
                  key={ver.source}
                  onClick={() => setI(k)}
                  aria-label={`Versjon ${k + 1}: ${ver.source}`}
                  className={`rounded-md p-0.5 transition-all ${
                    k === idx
                      ? "ring-2 ring-primary opacity-100"
                      : "opacity-40 grayscale hover:opacity-80 hover:grayscale-0"
                  }`}
                >
                  <MediaLogo source={ver.source} className="h-4 w-4" />
                </button>
              ))}
            </div>
            <button
              onClick={next}
              aria-label="Neste versjon"
              className="border border-border p-1 text-muted-foreground transition hover:border-primary hover:text-primary"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

      </div>
    </article>
  );
}
