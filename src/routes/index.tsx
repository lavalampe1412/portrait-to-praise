import { createFileRoute, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-profile";
import { tagLabel } from "@/lib/content-tags";
import {
  CATEGORIES as SUPABASE_CATEGORIES,
  MEDIA as SUPABASE_MEDIA,
  EMPTY_FEED,
  fetchCategoryFeeds,
  type CategoryRef,
  type Media,
  type VFeed,
  type VStory,
  type Version,
} from "@/lib/supabase-content";
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
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/* ------------------------------------------------------------------
   Kategori-innhold (medier, saker) hentes fra Supabase, se
   src/lib/supabase-content.ts. Trender er foreløpig ikke i databasen
   og lastes fortsatt fra JSON-filer på webserveren:

   /content/site.json                 – trender (indeks)
   /content/trends/<periode>-<n>.json – én feed per trend
------------------------------------------------------------------- */

const CONTENT_BASE = "/content";

interface TrendRef {
  rank: number;
  title: string;
  delta: string;
  file: string;
}

interface SiteConfig {
  trends: Record<string, TrendRef[]>;
}

// Interesser brukeren kan legge til som egne kategori-faner.
const INTEREST_CATEGORIES: string[] = [
  "Gaming",
  "Natur",
  "Reise",
  "Mat & Drikke",
  "Musikk",
  "Film & TV",
  "Teknologi",
  "Bil & Motor",
  "Trening & Helse",
  "Bøker",
  "Kunst & Design",
  "Hage",
];

// Medier brukeren kan legge til i «Dine medier», utover de som er i site.json.
const EXTRA_MEDIA_OPTIONS: Media[] = [
  {
    name: "Bergens Tidende",
    tag: "BT",
    logo: "https://placehold.co/96x96/7c2d12/ffffff/png?text=BT",
  },
  {
    name: "Adresseavisen",
    tag: "ADX",
    logo: "https://placehold.co/96x96/065f46/ffffff/png?text=ADX",
  },
  {
    name: "Dagens Næringsliv",
    tag: "DN",
    logo: "https://placehold.co/96x96/171717/ffffff/png?text=DN",
  },
  { name: "Klassekampen", tag: "KK", logo: "https://placehold.co/96x96/991b1b/ffffff/png?text=KK" },
  {
    name: "Fædrelandsvennen",
    tag: "FVN",
    logo: "https://placehold.co/96x96/1e3a8a/ffffff/png?text=FVN",
  },
  {
    name: "Stavanger Aftenblad",
    tag: "SA",
    logo: "https://placehold.co/96x96/78350f/ffffff/png?text=SA",
  },
  { name: "iTromsø", tag: "iTR", logo: "https://placehold.co/96x96/0e7490/ffffff/png?text=iTR" },
  { name: "Budstikka", tag: "BUD", logo: "https://placehold.co/96x96/581c87/ffffff/png?text=BUD" },
];

// Oppdateres når ekstra medier legges til, slik at MediaLogo finner logoene.
const MEDIA_BY_NAME: Record<string, Media> = Object.fromEntries(
  SUPABASE_MEDIA.map((m) => [m.name, m]),
);

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

// Stabil, unik nøkkel for en sak: representantartikkelens URL (unik i
// databasen). "kicker + dek" kolliderer nå som dek er en fast plassholder
// og kicker bare er kategori-navnet, delt av nesten alle saker i en kategori.
function storyKey(s: VStory): string {
  return s.versions[0]?.url ?? `${s.kicker}|${s.dek}`;
}

// Splitter en flat liste med saker i grupper på 4: kort 1 rendres som
// HeroCard, kort 2-4 som StoryCard (siste av dem "wide").
function chunkCards(cards: VStory[], size = 4): VStory[][] {
  const groups: VStory[][] = [];
  for (let i = 0; i < cards.length; i += size) {
    groups.push(cards.slice(i, i + size));
  }
  return groups;
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
  head: () => ({
    meta: [
      { title: "fidia – Norske nyheter samlet" },
      { name: "description", content: "Norske nyheter, trender og dine foretrukne medier samlet i én personlig nyhetsstrøm." },
      { property: "og:title", content: "fidia – Norske nyheter samlet" },
      { property: "og:description", content: "Norske nyheter, trender og dine foretrukne medier samlet i én personlig nyhetsstrøm." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const [site, setSite] = useState<SiteConfig | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [tab, setTab] = useState<string>("Dag");
  const [cat, setCat] = useState("Nyheter");
  const [trend, setTrend] = useState<TrendRef | null>(null);
  const [extraCategories, setExtraCategories] = useState<string[]>([]);
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const categoryMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!categoryMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (categoryMenuRef.current && !categoryMenuRef.current.contains(e.target as Node)) {
        setCategoryMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [categoryMenuOpen]);

  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [enabledMedia, setEnabledMedia] = useState<Set<string>>(
    () => new Set(SUPABASE_MEDIA.map((m) => m.name)),
  );
  const [extraMedia, setExtraMedia] = useState<Media[]>([]);
  const [mediaMenuOpen, setMediaMenuOpen] = useState(false);
  const [mediaSearch, setMediaSearch] = useState("");
  const mediaMenuRef = useRef<HTMLDivElement>(null);

  const [categoryFeeds, setCategoryFeeds] = useState<Record<string, VFeed>>({});
  const [feedsLoading, setFeedsLoading] = useState(true);
  const [trendFeed, setTrendFeed] = useState<VFeed | null>(null);
  const [trendLoading, setTrendLoading] = useState(false);
  const trendCache = useRef<Map<string, VFeed>>(new Map());

  const MEDIA = [...SUPABASE_MEDIA, ...extraMedia];
  const CATEGORIES = SUPABASE_CATEGORIES;

  useEffect(() => {
    if (!mediaMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (mediaMenuRef.current && !mediaMenuRef.current.contains(e.target as Node)) {
        setMediaMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [mediaMenuOpen]);

  const TRENDS = site?.trends ?? {};

  // --- last site.json (kun trend-indeksen, resten kommer fra Supabase)
  useEffect(() => {
    let alive = true;
    loadJson<SiteConfig>("site.json")
      .then((data) => {
        if (!alive) return;
        setSite(data);
        const periods = Object.keys(data.trends);
        if (periods.length > 0 && periods[0]) setTab(periods[0]);
      })
      .catch((e: Error) => alive && setLoadError(e.message));
    return () => {
      alive = false;
    };
  }, []);

  // --- last kategori-feeder fra Supabase (én gang; alle kategorier på én gang)
  useEffect(() => {
    let alive = true;
    fetchCategoryFeeds()
      .then((feeds) => {
        if (!alive) return;
        setCategoryFeeds(feeds);
        setFeedsLoading(false);
      })
      .catch((e: Error) => {
        if (!alive) return;
        setFeedsLoading(false);
        setLoadError(e.message);
      });
    return () => {
      alive = false;
    };
  }, []);

  // --- last aktiv trend-feed (trender er fortsatt JSON-baserte)
  useEffect(() => {
    if (!trend) {
      setTrendFeed(null);
      return;
    }
    const cached = trendCache.current.get(trend.file);
    if (cached) {
      setTrendFeed(cached);
      return;
    }
    let alive = true;
    setTrendLoading(true);
    loadJson<Partial<VFeed>>(trend.file)
      .then((data) => {
        const feed = normalizeFeed(data);
        trendCache.current.set(trend.file, feed);
        if (!alive) return;
        setTrendFeed(feed);
        setTrendLoading(false);
      })
      .catch((e: Error) => {
        if (!alive) return;
        setTrendFeed(EMPTY_FEED);
        setTrendLoading(false);
        setLoadError(e.message);
      });
    return () => {
      alive = false;
    };
  }, [trend]);

  const hasFeedSource = trend !== null || SUPABASE_CATEGORIES.some((c) => c.name === cat);
  const rawFeed = trend ? (trendFeed ?? EMPTY_FEED) : (categoryFeeds[cat] ?? EMPTY_FEED);
  const feedLoading = trend ? trendLoading : feedsLoading;

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
    if (session) {
      supabase
        .from("user_pref")
        .upsert({ user_id: session.user.id, theme: next }, { onConflict: "user_id" })
        .then(({ error }) => {
          if (error) console.error("Kunne ikke lagre tema:", error.message);
        });
    }
  };

  const feed = useMemo(() => filterFeed(rawFeed, enabledMedia), [rawFeed, enabledMedia]);

  // Hero + sekundære saker slås sammen til én liste og rendres som
  // gjentagende grupper av (1 hero-kort + 3 mindre kort), se chunkCards.
  const cardList = useMemo(
    () => [feed.hero, ...feed.stories].filter((s): s is VStory => s !== null),
    [feed.hero, feed.stories],
  );
  const cardGroups = useMemo(() => chunkCards(cardList), [cardList]);
  const quickList = feed.quick;

  // Auth-økt
  const { session, profileName, profileAvatar } = useProfile();

  // Last lagret tema fra user_pref når brukeren er logget inn
  useEffect(() => {
    if (!session) return;
    let active = true;
    supabase
      .from("user_pref")
      .select("theme")
      .eq("user_id", session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!active || !data?.theme) return;
        const saved = data.theme === "light" ? "light" : "dark";
        setTheme(saved);
        document.documentElement.classList.toggle("light", saved === "light");
        window.localStorage.setItem("nyhet-theme", saved);
      });
    return () => {
      active = false;
    };
  }, [session]);

  // Last lagrede medievalg fra user_pref når brukeren er logget inn
  useEffect(() => {
    if (!session) return;
    let active = true;
    supabase
      .from("user_pref")
      .select("media_preferences")
      .eq("user_id", session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return;
        const mediaPref = data?.media_preferences as { sources?: string[] } | null;
        const sources = Array.isArray(mediaPref?.sources) ? mediaPref.sources : null;
        if (!sources) return;

        // Gjenopprett egendefinerte medier (lagt til via «+») som brukeren hadde aktivert.
        const savedExtra = EXTRA_MEDIA_OPTIONS.filter((m) => sources.includes(m.name));
        if (savedExtra.length > 0) {
          savedExtra.forEach((m) => {
            MEDIA_BY_NAME[m.name] = m;
          });
          setExtraMedia(savedExtra);
        }

        const available = new Set([
          ...SUPABASE_MEDIA.map((m) => m.name),
          ...savedExtra.map((m) => m.name),
        ]);
        const filtered = sources.filter((s) => available.has(s));
        if (filtered.length > 0) setEnabledMedia(new Set(filtered));
      });
    return () => {
      active = false;
    };
  }, [session]);

  const saveMediaPreferences = useCallback(
    (next: Set<string>) => {
      if (!session) return;
      supabase
        .from("user_pref")
        .upsert(
          { user_id: session.user.id, media_preferences: { sources: Array.from(next) } },
          { onConflict: "user_id" },
        )
        .then(({ error }) => {
          if (error) console.error("Kunne ikke lagre medievalg:", error.message);
        });
    },
    [session],
  );

  const toggleMedia = useCallback(
    (name: string) => {
      setEnabledMedia((prev) => {
        const next = new Set(prev);
        if (next.has(name)) next.delete(name);
        else next.add(name);
        saveMediaPreferences(next);
        return next;
      });
    },
    [saveMediaPreferences],
  );

  const addMedia = useCallback(
    (media: Media) => {
      MEDIA_BY_NAME[media.name] = media;
      setExtraMedia((prev) => (prev.some((m) => m.name === media.name) ? prev : [...prev, media]));
      setEnabledMedia((prev) => {
        const next = new Set(prev);
        next.add(media.name);
        saveMediaPreferences(next);
        return next;
      });
      setMediaMenuOpen(false);
      setMediaSearch("");
    },
    [saveMediaPreferences],
  );

  // Last lagrede kategorivalg fra user_pref når brukeren er logget inn
  useEffect(() => {
    if (!session) return;
    let active = true;
    supabase
      .from("user_pref")
      .select("category_preferences")
      .eq("user_id", session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return;
        const categories = Array.isArray(data?.category_preferences)
          ? data.category_preferences
          : null;
        if (!categories) return;
        const valid = categories.filter((c) => INTEREST_CATEGORIES.includes(c));
        setExtraCategories(valid);
      });
    return () => {
      active = false;
    };
  }, [session]);

  const saveCategoryPreferences = useCallback(
    (next: string[]) => {
      if (!session) return;
      supabase
        .from("user_pref")
        .upsert({ user_id: session.user.id, category_preferences: next }, { onConflict: "user_id" })
        .then(({ error }) => {
          if (error) console.error("Kunne ikke lagre kategorivalg:", error.message);
        });
    },
    [session],
  );

  const addCategory = useCallback(
    (name: string) => {
      setExtraCategories((prev) => {
        const next = prev.includes(name) ? prev : [...prev, name];
        saveCategoryPreferences(next);
        return next;
      });
      setCat(name);
      setTrend(null);
      setCategoryMenuOpen(false);
    },
    [saveCategoryPreferences],
  );

  const removeCategory = useCallback(
    (name: string) => {
      setExtraCategories((prev) => {
        const next = prev.filter((c) => c !== name);
        saveCategoryPreferences(next);
        return next;
      });
      if (cat === name) {
        setCat("Nyheter");
      }
    },
    [cat, saveCategoryPreferences],
  );

  // Uten en innlogget bruker skal alt være som normalt: standardmedier og ingen ekstra kategorier
  useEffect(() => {
    if (session) return;
    setEnabledMedia(new Set(SUPABASE_MEDIA.map((m) => m.name)));
    setExtraMedia([]);
    setExtraCategories([]);
    setCat((prev) => (INTEREST_CATEGORIES.includes(prev) ? "Nyheter" : prev));
    const saved = typeof window !== "undefined" ? window.localStorage.getItem("nyhet-theme") : null;
    const fallback = saved === "light" ? "light" : "dark";
    setTheme(fallback);
    document.documentElement.classList.toggle("light", fallback === "light");
  }, [session]);

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
            <p className="text-xs font-bold text-muted-foreground">
              Oslo · Søndag 26. juli
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              18°C · Litt skyet
            </p>
          </div>

          <div className="text-center">
            <h1 className="font-display text-4xl text-foreground md:text-5xl">
              fidia<span className="text-primary">.</span>
            </h1>
            <p className="mt-1 text-[11px] font-bold text-muted-foreground">
              hele nyhetsbildet, på ett sted
            </p>
          </div>

          <div className="hidden items-center gap-2 sm:flex">
            <button
              onClick={() => applyTheme(theme === "dark" ? "light" : "dark")}
              aria-label={theme === "dark" ? "Bytt til lyst tema" : "Bytt til mørkt tema"}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition hover:-translate-y-0.5 hover:border-primary hover:text-primary"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition hover:-translate-y-0.5 hover:border-accent hover:text-accent">
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
                className="rounded-full border border-primary bg-primary px-5 py-2 text-sm font-bold text-primary-foreground transition hover:-translate-y-0.5 hover:bg-transparent hover:text-primary"
              >
                Logg inn
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Category nav */}
      <div className="sticky top-0 z-40 border-b border-border bg-background/90 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-6 py-2">
          <div className="flex min-w-0 items-center">
            <nav className="flex items-center gap-0 overflow-x-auto">
              {CATEGORIES.map((c) => (
                <button
                  key={c.name}
                  onClick={() => {
                    setCat(c.name);
                    setTrend(null);
                  }}
                    className={`relative whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold transition ${
                    cat === c.name && !trend
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {c.name}
                </button>
              ))}

              {extraCategories.map((name) => (
                <span key={name} className="relative inline-flex items-center">
                  <button
                    onClick={() => {
                      setCat(name);
                      setTrend(null);
                    }}
                    className={`relative whitespace-nowrap rounded-full py-2 pl-4 pr-7 text-sm font-bold transition ${
                      cat === name && !trend
                        ? "bg-secondary text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {name}
                  </button>
                  <button
                    onClick={() => removeCategory(name)}
                    aria-label={`Fjern ${name}`}
                    className="absolute right-2 flex h-4 w-4 items-center justify-center text-muted-foreground transition hover:text-primary"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </nav>

            <div ref={categoryMenuRef} className="relative shrink-0">
              <button
                onClick={() => setCategoryMenuOpen((v) => !v)}
                aria-label="Legg til kategori"
                className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition hover:bg-secondary hover:text-foreground"
              >
                <Plus className="h-4 w-4" />
              </button>
              {categoryMenuOpen && (
                <div className="no-scrollbar absolute right-0 top-full z-50 mt-2 max-h-72 w-56 overflow-y-auto rounded-lg border border-border bg-popover p-1.5">
                  {INTEREST_CATEGORIES.filter((name) => !extraCategories.includes(name)).length ===
                  0 ? (
                    <p className="px-3 py-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                      Alle lagt til
                    </p>
                  ) : (
                    INTEREST_CATEGORIES.filter((name) => !extraCategories.includes(name)).map(
                      (name) => (
                        <button
                          key={name}
                          onClick={() => addCategory(name)}
                          className="block w-full rounded-md px-3 py-2 text-left font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground transition hover:bg-secondary hover:text-foreground"
                        >
                          {name}
                        </button>
                      ),
                    )
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <div className="flex items-center gap-2 border border-border px-3 py-1.5 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              <Search className="h-3.5 w-3.5" />
              <span>Søk</span>
              <kbd className="ml-2 border border-border px-1.5 py-0.5 font-mono text-[10px]">
                ⌘K
              </kbd>
            </div>
          </div>
        </div>
      </div>

      {/* 3-column layout */}
      <main className="mx-auto grid max-w-[1500px] grid-cols-1 gap-10 px-6 py-12 lg:grid-cols-[280px_minmax(0,1fr)_280px]">
        {/* LEFT — Trender */}
        <aside className="space-y-8 lg:sticky lg:top-24 lg:self-start">
          <section className="frame">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
               <h2 className="text-sm font-extrabold">
                Trender
              </h2>
              <TrendingUp className="h-3.5 w-3.5 text-primary" />
            </div>
            <div className="flex gap-1 border-b border-border p-2 text-xs font-bold">
              {(Object.keys(TRENDS) as (keyof typeof TRENDS)[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`flex-1 px-2 py-2 transition ${
                    tab === t
                       ? "rounded-full bg-accent text-accent-foreground"
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
                     className={`group flex w-full items-baseline gap-3 px-4 py-3 text-left transition hover:bg-secondary/60 ${
                      trend?.file === t.file
                         ? "bg-primary/10 text-foreground"
                         : ""
                    }`}
                  >
                     <span className="w-6 font-display text-xl font-bold text-primary">
                      {String(t.rank).padStart(2, "0")}
                    </span>
                     <span className="flex-1 text-sm font-semibold leading-snug group-hover:text-primary">
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
               <p className="mb-1 text-xs font-bold text-primary">
                 {trend ? "Aktivt filter" : "Dagens utvalg"}
              </p>
               <h2 className="font-display text-3xl leading-tight md:text-4xl">
                {trend?.title ?? cat}
              </h2>
            </div>
            <div className="hidden items-center gap-2 sm:flex">
              {trend ? (
                <button
                  onClick={() => setTrend(null)}
                     className="flex items-center gap-1.5 rounded-full border border-primary px-4 py-2 text-xs font-bold text-primary transition hover:bg-primary hover:text-primary-foreground"
                >
                  Fjern filter <span className="text-sm leading-none">×</span>
                </button>
              ) : (
                <>
                   <button className="rounded-full border border-border px-4 py-2 text-xs font-bold text-muted-foreground transition hover:border-primary hover:text-primary">
                    Nyest
                  </button>
                   <button className="rounded-full border border-primary bg-primary px-4 py-2 text-xs font-bold text-primary-foreground">
                    Anbefalt
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Feed: gjentagende grupper av (1 hero-kort + 3 mindre kort) */}
          {feedLoading ? (
            <article className="frame animate-pulse">
              <div className="aspect-[16/9] w-full bg-secondary" />
            </article>
          ) : loadError && cardList.length === 0 ? (
            <article className="border border-dashed border-border bg-card p-12 text-center">
              <p className="font-display text-xl">Kunne ikke laste innhold</p>
              <p className="mt-2 font-mono text-xs text-muted-foreground">{loadError}</p>
            </article>
          ) : cardList.length > 0 ? (
            <div className="space-y-8">
              {cardGroups.map((group) => (
                <div key={group.map(storyKey).join("|")} className="space-y-8">
                  <HeroCard story={group[0]} />
                  {group.length > 1 && (
                    <div className="grid gap-8 sm:grid-cols-2">
                      {group.slice(1, 3).map((s) => (
                        <StoryCard key={storyKey(s)} story={s} />
                      ))}
                    </div>
                  )}
                  {group[3] && <StoryCard key={storyKey(group[3])} story={group[3]} wide />}
                </div>
              ))}
            </div>
          ) : !hasFeedSource ? (
            <article className="border border-dashed border-border bg-card p-12 text-center">
              <p className="font-display text-xl">Innhold kommer snart</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Vi dekker ikke «{cat}» ennå, men jobber med å legge til flere kategorier.
              </p>
            </article>
          ) : (
            <article className="border border-dashed border-border bg-card p-12 text-center">
              <p className="font-display text-xl">Ingen medier valgt</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Aktiver minst én kilde under «Dine medier» for å se saker.
              </p>
            </article>
          )}

          {/* Quick reads list */}
          <section className="frame">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h3 className="font-mono text-[11px] font-bold uppercase tracking-[0.25em]">
                Kort og godt
              </h3>
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
                ● Oppdatert nå
              </span>
            </div>
            <ul className="divide-y divide-border">
              {quickList.map((q) => (
                <li key={q.url ?? q.title}>
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
                    <span className="hidden shrink-0 font-mono text-[10px] uppercase tracking-wider text-primary sm:inline">
                      {tagLabel(q.tag)}
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
              <h2 className="font-mono text-[11px] font-bold uppercase tracking-[0.25em]">
                Dine medier
              </h2>
              <button className="flex h-6 w-6 items-center justify-center border border-border text-muted-foreground transition hover:border-primary hover:text-primary">
                <Plus className="h-3 w-3" />
              </button>
            </div>
            <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              {enabledMedia.size}/{MEDIA.length} aktive
            </p>
            <div ref={mediaMenuRef} className="relative grid grid-cols-4 gap-1.5">
              {MEDIA.map((m) => {
                const on = enabledMedia.has(m.name);
                return (
                  <button
                    key={m.name}
                    onClick={() => toggleMedia(m.name)}
                    aria-pressed={on}
                    className={`flex aspect-square items-center justify-center overflow-hidden rounded-lg border transition ${
                      on
                        ? "border-transparent opacity-90 hover:opacity-100"
                        : "border-border opacity-25 grayscale"
                    }`}
                    title={`${m.name} — ${on ? "aktiv, klikk for å skjule" : "skjult, klikk for å vise"}`}
                  >
                    <img
                      src={m.logo}
                      alt={m.name}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  </button>
                );
              })}
              <button
                onClick={() => setMediaMenuOpen((v) => !v)}
                aria-label="Legg til medie"
                className="flex aspect-square items-center justify-center border border-dashed border-border text-muted-foreground transition hover:border-primary hover:text-primary"
              >
                <Plus className="h-4 w-4" />
              </button>
              {mediaMenuOpen && (
                <div className="no-scrollbar absolute left-1/2 top-full z-50 mt-2 w-60 max-h-72 -translate-x-1/2 overflow-y-auto rounded-lg border border-border bg-popover p-1.5">
                  <div className="mb-1.5 flex items-center gap-2 border border-border px-2.5 py-1.5">
                    <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <input
                      autoFocus
                      value={mediaSearch}
                      onChange={(e) => setMediaSearch(e.target.value)}
                      placeholder="Søk medier…"
                      className="w-full bg-transparent text-[13px] outline-none placeholder:text-muted-foreground"
                    />
                  </div>
                  {(() => {
                    const existingNames = new Set(MEDIA.map((m) => m.name));
                    const options = EXTRA_MEDIA_OPTIONS.filter(
                      (m) =>
                        !existingNames.has(m.name) &&
                        m.name.toLowerCase().includes(mediaSearch.trim().toLowerCase()),
                    );
                    if (options.length === 0) {
                      const allAdded = EXTRA_MEDIA_OPTIONS.every((m) => existingNames.has(m.name));
                      return (
                        <p className="px-3 py-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                          {allAdded ? "Alle lagt til" : "Ingen treff"}
                        </p>
                      );
                    }
                    return options.map((m) => (
                      <button
                        key={m.name}
                        onClick={() => addMedia(m)}
                        className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground transition hover:bg-secondary hover:text-foreground"
                      >
                        <img src={m.logo} alt="" className="h-5 w-5 rounded object-cover" />
                        {m.name}
                      </button>
                    ));
                  })()}
                </div>
              )}
            </div>
            {enabledMedia.size < MEDIA.length && (
              <button
                onClick={() => {
                  const next = new Set(MEDIA.map((m) => m.name));
                  setEnabledMedia(next);
                  saveMediaPreferences(next);
                }}
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
              {["Skjul sport", "Kun norske kilder", "Skjul lest", "Prioriter lange saker"].map(
                (f, i) => (
                  <label
                    key={f}
                    className="flex cursor-pointer items-center justify-between px-1 py-2 transition hover:bg-secondary/50"
                  >
                    <span>{f}</span>
                    <span
                      className={`relative h-4 w-8 border transition ${
                        i === 1 || i === 2
                          ? "border-primary bg-primary/25"
                          : "border-border bg-secondary"
                      }`}
                    >
                      <span
                        className={`absolute top-0 h-3 w-3 transition ${
                          i === 1 || i === 2 ? "left-4 bg-primary" : "left-0 bg-muted-foreground"
                        }`}
                      />
                    </span>
                  </label>
                ),
              )}
            </div>
          </section>

          <section className="frame border-primary p-4">
            <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.3em] text-primary">
              fidia Pro
            </p>
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

function HeroCard({ story }: { story: VStory }) {
  const [i, setI] = useState(0);
  const count = story.versions.length;
  const idx = count > 0 ? i % count : 0;
  const v = story.versions[idx];
  useEffect(() => {
    if (i >= count) setI(0);
  }, [count, i]);
  if (!v) return null;
  return (
    <article className="group frame">
      <div className="relative aspect-[16/9] overflow-hidden">
        <img
          src={v.image || story.image}
          onError={(e) => {
            if (story.image) e.currentTarget.src = story.image;
          }}
          alt=""
          width={1280}
          height={800}
          className="h-full w-full object-cover contrast-[1.1] saturate-[0.85] transition duration-700 group-hover:scale-[1.03] group-hover:saturate-100"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/55 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-6 md:p-8">
          <p className="mb-3 flex flex-wrap items-center gap-2">
            <span className="inline-block border border-primary bg-primary px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-primary-foreground">
              {story.kicker}
            </span>
            <span className="inline-block border border-white/40 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.2em] text-white/70">
              {tagLabel(story.tag)}
            </span>
          </p>
          <h3 className="line-clamp-2 max-w-3xl min-h-[1.96em] font-display text-3xl leading-[0.98] text-white md:text-4xl lg:text-5xl">
            <a
              href={v.url || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="transition hover:underline hover:decoration-primary hover:underline-offset-4"
            >
              {v.title}
            </a>
          </h3>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-neutral-300">{story.dek}</p>
          <div className="mt-5 flex flex-wrap items-center gap-3 font-mono text-[10px] uppercase tracking-widest text-neutral-300">
            <span className="flex items-center gap-1.5 border border-white/40 px-2 py-1 font-bold text-white">
              <MediaLogo source={v.source} className="h-4 w-4" />
              {v.source}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-3 w-3" />
              {v.time}
            </span>
            <span>{v.read}</span>
            <div className="ml-auto flex items-center gap-1.5">
              {story.versions.map((ver, k) => (
                <button
                  key={ver.source}
                  onClick={() => setI(k)}
                  aria-label={`Versjon ${k + 1}: ${ver.source}`}
                  className={`rounded-md p-0.5 transition-all ${
                    k === idx
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
        {count > 1 && (
          <>
            <div className="absolute inset-y-0 left-0 flex items-center">
              <button
                onClick={() => setI((n) => (n - 1 + count) % count)}
                aria-label="Forrige versjon"
                className="ml-3 border border-white/50 bg-black/50 p-2 text-white backdrop-blur transition hover:border-primary hover:text-primary"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            </div>
            <div className="absolute inset-y-0 right-0 flex items-center">
              <button
                onClick={() => setI((n) => (n + 1) % count)}
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
      <div
        className={`relative overflow-hidden ${wide ? "aspect-[4/3] sm:aspect-auto" : "aspect-[4/3]"}`}
      >
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
          className={`line-clamp-2 min-h-[2.1em] font-display leading-[1.05] ${
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
