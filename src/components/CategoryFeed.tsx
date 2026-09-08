// Kategori-navigasjon (toppfanene) og selve feeden (hero/story-kort +
// "Kort og godt"). Eier ingen data-henting selv -- index.tsx henter fra
// Supabase/JSON og sender ferdig filtrert innhold inn som props.
import { ChevronLeft, ChevronRight, Clock, Plus, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { tagLabel } from "@/lib/content-tags";
import {
  MEDIA as SUPABASE_MEDIA,
  type CategoryRef,
  type Media,
  type VFeed,
  type VStory,
} from "@/lib/supabase-content";

export interface TrendRef {
  rank: number;
  title: string;
  delta: string;
  file: string;
}

// Interesser brukeren kan legge til som egne kategori-faner.
export const INTEREST_CATEGORIES: string[] = [
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

// Slår opp medielogoer for kort/versjonsvelgere i feeden. index.tsx kaller
// registerMedia() når brukeren legger til et medie utover standardsettet.
const mediaByName: Record<string, Media> = Object.fromEntries(
  SUPABASE_MEDIA.map((m) => [m.name, m]),
);

export function registerMedia(media: Media) {
  mediaByName[media.name] = media;
}

function MediaLogo({ source, className = "h-5 w-5" }: { source: string; className?: string }) {
  const m = mediaByName[source];
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
// databasen). "kicker + dek" kolliderer siden dek er en fast plassholder
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

export interface CategoryNavProps {
  categories: CategoryRef[];
  extraCategories: string[];
  cat: string;
  trend: TrendRef | null;
  onSelectCategory: (name: string) => void;
  onAddCategory: (name: string) => void;
  onRemoveCategory: (name: string) => void;
}

export function CategoryNav({
  categories,
  extraCategories,
  cat,
  trend,
  onSelectCategory,
  onAddCategory,
  onRemoveCategory,
}: CategoryNavProps) {
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

  return (
    <div className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-[2200px] items-center justify-between px-6 py-2">
        <div className="flex min-w-0 items-center">
          <nav className="flex items-center gap-0 overflow-x-auto">
            {categories.map((c) => (
              <button
                key={c.name}
                onClick={() => onSelectCategory(c.name)}
                className={`relative whitespace-nowrap rounded-full px-4 py-2 font-mono text-[11px] font-medium uppercase tracking-[0.18em] transition ${
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
                  onClick={() => onSelectCategory(name)}
                  className={`relative whitespace-nowrap rounded-full py-2 pl-4 pr-7 font-mono text-[11px] font-medium uppercase tracking-[0.18em] transition ${
                    cat === name && !trend
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {name}
                </button>
                <button
                  onClick={() => onRemoveCategory(name)}
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
                        onClick={() => {
                          onAddCategory(name);
                          setCategoryMenuOpen(false);
                        }}
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
            <kbd className="ml-2 border border-border px-1.5 py-0.5 font-mono text-[10px]">⌘K</kbd>
          </div>
        </div>
      </div>
    </div>
  );
}

export interface CategoryFeedProps {
  categories: CategoryRef[];
  cat: string;
  trend: TrendRef | null;
  onClearTrend: () => void;
  feed: VFeed;
  feedLoading: boolean;
  loadError: string | null;
}

export function CategoryFeed({
  categories,
  cat,
  trend,
  onClearTrend,
  feed,
  feedLoading,
  loadError,
}: CategoryFeedProps) {
  const hasFeedSource = trend !== null || categories.some((c) => c.name === cat);

  // Hero + sekundære saker slås sammen til én liste og rendres som
  // gjentagende grupper av (1 hero-kort + 3 mindre kort), se chunkCards.
  const cardList = useMemo(
    () => [feed.hero, ...feed.stories].filter((s): s is VStory => s !== null),
    [feed.hero, feed.stories],
  );
  const cardGroups = useMemo(() => chunkCards(cardList), [cardList]);
  const quickList = feed.quick;

  return (
    <section className="min-w-0 space-y-8">
      {/* Section header */}
      <div className="flex items-end justify-between border-b border-border pb-3">
        <div>
          <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            {trend ? "// aktivt filter" : "// hovedseksjon"}
          </p>
          <h2 className="font-display text-3xl leading-none md:text-4xl">{trend?.title ?? cat}</h2>
        </div>
        <div className="hidden items-center gap-2 sm:flex">
          {trend ? (
            <button
              onClick={onClearTrend}
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
    <article className="group frame cursor-pointer transition hover:border-primary">
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
          <h3 className="line-clamp-2 max-w-4xl min-h-[1.96em] font-display text-4xl leading-[0.98] text-white md:text-5xl lg:text-6xl">
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
            <div className="relative z-10 ml-auto flex items-center gap-1.5">
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
            <div className="absolute inset-y-0 left-0 z-10 flex items-center">
              <button
                onClick={() => setI((n) => (n - 1 + count) % count)}
                aria-label="Forrige versjon"
                className="ml-3 border border-white/50 bg-black/50 p-2 text-white backdrop-blur transition hover:border-primary hover:text-primary"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            </div>
            <div className="absolute inset-y-0 right-0 z-10 flex items-center">
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
        <a
          href={v.url || "#"}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={v.title}
          className="absolute inset-0 cursor-pointer"
        />
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
      className={`group frame relative cursor-pointer overflow-hidden transition hover:border-primary ${
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
            wide ? "text-2xl md:text-3xl" : "text-xl md:text-2xl"
          }`}
        >
          <a
            href={v.url || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="transition after:absolute after:inset-0 after:content-[''] hover:text-primary"
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
          <div className="relative z-10 mt-4 flex items-center justify-between gap-3 border-t border-border pt-3">
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
