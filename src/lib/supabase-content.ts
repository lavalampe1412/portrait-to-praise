// Henter feed-innhold (kategorier + artikler) fra Supabase i stedet for
// /content/categories/<slug>.json. Skrapet av new_fidia_scraper, som fyller
// tre tabeller: articles (én rad per artikkel), stories (én rad per klynge
// av artikler om samme sak) og story_articles (kobling mellom dem).
import { supabase } from "@/integrations/supabase/client";
import { CONTENT_TAGS, tagLabel } from "@/lib/content-tags";

export interface Media {
  name: string;
  tag: string;
  logo: string;
}

export interface Version {
  source: string;
  title: string;
  time: string;
  read: string;
  image?: string;
  url?: string;
  tag?: string;
}

export interface VStory {
  kicker: string;
  tag: string;
  subcategory: string;
  dek: string;
  image: string;
  versions: Version[];
}

export interface VFeed {
  hero: VStory | null;
  stories: VStory[];
  quick: Version[];
}

export interface CategoryRef {
  name: string;
}

export const EMPTY_FEED: VFeed = { hero: null, stories: [], quick: [] };

// De faktiske kildene new_fidia_scraper skraper (main.py: SCRAPERS).
export const MEDIA: Media[] = [
  { name: "VG", tag: "VG", logo: "https://placehold.co/96x96/dc2626/ffffff/png?text=VG" },
  { name: "NRK", tag: "NRK", logo: "https://placehold.co/96x96/404040/ffffff/png?text=NRK" },
  { name: "Aftenposten", tag: "AP", logo: "https://placehold.co/96x96/1e293b/ffffff/png?text=AP" },
  { name: "Dagbladet", tag: "DB", logo: "https://placehold.co/96x96/1d4ed8/ffffff/png?text=DB" },
  { name: "Nettavisen", tag: "NA", logo: "https://placehold.co/96x96/ea580c/ffffff/png?text=NA" },
  { name: "E24", tag: "E24", logo: "https://placehold.co/96x96/047857/ffffff/png?text=E24" },
  {
    name: "Dagens Næringsliv",
    tag: "DN",
    logo: "https://placehold.co/96x96/171717/ffffff/png?text=DN",
  },
  { name: "Klassekampen", tag: "KK", logo: "https://placehold.co/96x96/991b1b/ffffff/png?text=KK" },
];

const MEDIE_CODE_TO_NAME: Record<string, string> = Object.fromEntries(
  MEDIA.map((m) => [m.tag, m.name]),
);

// Kategori-fanene i toppnavigasjonen. "For deg" har ingen egen
// klassifisering i skraperdataene ennå, så den speiler Nyheter-feeden.
export const CATEGORIES: CategoryRef[] = [
  { name: "For deg" },
  { name: "Nyheter" },
  { name: "Sport" },
  { name: "Politikk" },
  { name: "Business" },
  { name: "Kultur" },
  { name: "Diverse" },
];

// Skrapte tags er det første URL-stien til artikkelen (f.eks. "sport",
// "boers-og-finans", "vestland") -- ukontrollert og inkonsekvent på tvers
// av mediene. Denne slår dem sammen til en kategori-fane og et
// kontrollert tag-slug (content-tags.ts) for visning.
const TAG_TO_CATEGORY: Record<string, string> = {
  sport: "Sport",

  politikk: "Politikk",
  meninger: "Politikk",
  kommentar: "Politikk",
  "norsk-debatt": "Politikk",

  "boers-og-finans": "Business",
  bors: "Business",
  marked: "Business",
  naeringsliv: "Business",
  "norsk-oekonomi": "Business",
  "internasjonal-oekonomi": "Business",
  okonomi: "Business",
  privatoekonomi: "Business",
  dinepenger: "Business",
  "karriere-og-ledelse": "Business",
  eiendom: "Business",
  bolig: "Business",

  kultur: "Kultur",
  bok: "Kultur",
  magasinet: "Kultur",
  d2: "Kultur",

  kjendis: "Diverse",
  rampelys: "Diverse",
  shoppingtips: "Diverse",
  trender: "Diverse",
  annonsorinnhold: "Diverse",
  podkast: "Diverse",
  fritid: "Diverse",
  heim: "Diverse",
  hekk: "Diverse",
  "sex-og-samliv": "Diverse",
  "psykisk-helse-og-psykologi": "Diverse",
};

const TAG_TO_SLUG: Record<string, string> = {
  sport: "sport",
  politikk: "politikk",
  meninger: "politikk",
  kommentar: "politikk",
  "norsk-debatt": "politikk",
  "boers-og-finans": "business",
  bors: "business",
  marked: "business",
  naeringsliv: "business",
  "norsk-oekonomi": "business",
  "internasjonal-oekonomi": "business",
  okonomi: "business",
  privatoekonomi: "business",
  dinepenger: "business",
  "karriere-og-ledelse": "business",
  eiendom: "business",
  bolig: "business",
  kultur: "kultur",
  bok: "kultur",
  magasinet: "kultur",
  d2: "kultur",
  verden: "utenriks",
  utenriks: "utenriks",
  kjendis: "livsstil",
  rampelys: "livsstil",
  shoppingtips: "livsstil",
  trender: "livsstil",
  "sex-og-samliv": "livsstil",
  "psykisk-helse-og-psykologi": "livsstil",
  norge: "samfunn",
  nyheter: "samfunn",
  nyhetsstudio: "samfunn",
  "energi-og-klima": "samfunn",
};

const KNOWN_SLUGS = new Set(CONTENT_TAGS.map((t) => t.slug));

function categoryForTag(rawTag: string | undefined): string {
  if (!rawTag) return "Nyheter";
  return TAG_TO_CATEGORY[rawTag] ?? "Nyheter";
}

function slugForTag(rawTag: string | undefined): string {
  if (!rawTag) return "samfunn";
  const mapped = TAG_TO_SLUG[rawTag];
  if (mapped) return mapped;
  return KNOWN_SLUGS.has(rawTag) ? rawTag : "samfunn";
}

interface ArticleRow {
  id: number;
  medie: string;
  tekst: string | null;
  lenke: string;
  photo_url: string | null;
  dato: string | null;
  tags: string[] | null;
}

interface StoryRow {
  id: number;
  created_at: string;
  story_articles: { articles: ArticleRow | null }[];
}

// dato lagres som "DD/MM/YYYY HH:MM" (skrapetidspunkt).
function parseDato(dato: string | null): Date | null {
  if (!dato) return null;
  const match = dato.match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})$/);
  if (!match) return null;
  const [, day, month, year, hour, minute] = match;
  return new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute));
}

function timeOf(dato: string | null): string {
  const match = dato?.match(/(\d{2}):(\d{2})$/);
  return match ? `${match[1]}:${match[2]}` : "";
}

// Skraperen fanger verken ingress eller lesetid -- disse kolonnene finnes
// ikke i databasen i det hele tatt, så plassholderne dekker det gapet.
// tekst og photo_url er derimot ekte kolonner (bare nullable).
const PLACEHOLDER_DEK = "Sammendrag ikke tilgjengelig.";
const PLACEHOLDER_READ = "– min";

function toVersion(a: ArticleRow): Version {
  return {
    source: MEDIE_CODE_TO_NAME[a.medie] ?? a.medie,
    title: a.tekst ?? "",
    time: timeOf(a.dato),
    read: PLACEHOLDER_READ,
    image: a.photo_url ?? undefined,
    url: a.lenke,
    tag: slugForTag(a.tags?.[0]),
  };
}

interface BuiltStory {
  category: string;
  sortKey: number;
  story: VStory;
}

function buildStory(row: StoryRow): BuiltStory | null {
  const members = row.story_articles
    .map((sa) => sa.articles)
    .filter((a): a is ArticleRow => a !== null);
  if (members.length === 0) return null;

  const withDates = members.map((a) => ({ article: a, date: parseDato(a.dato) }));
  withDates.sort((x, y) => (y.date?.getTime() ?? 0) - (x.date?.getTime() ?? 0));
  const representative = withDates[0].article;
  const latest = withDates[0].date?.getTime() ?? 0;

  const rawTag = representative.tags?.[0];
  const slug = slugForTag(rawTag);
  const versions = withDates.map(({ article }) => toVersion(article));

  return {
    category: categoryForTag(rawTag),
    sortKey: latest,
    story: {
      kicker: tagLabel(slug) || "Nyheter",
      tag: slug,
      subcategory: rawTag ?? "",
      dek: PLACEHOLDER_DEK,
      image:
        representative.photo_url ??
        withDates.find((d) => d.article.photo_url)?.article.photo_url ??
        "",
      versions,
    },
  };
}

// Maks antall saker vist per kategori. De ferskeste blir hero/story-kort;
// de eldste QUICK_TAIL av utvalget havner i den flate "Kort og godt"-listen.
const CARD_CAP = 30;
const QUICK_TAIL = 5;

function feedFromStories(built: BuiltStory[]): VFeed {
  const sorted = [...built].sort((a, b) => b.sortKey - a.sortKey).slice(0, CARD_CAP);
  const quickCount = Math.min(QUICK_TAIL, sorted.length);
  const cardCount = sorted.length - quickCount;

  const hero = cardCount > 0 ? sorted[0].story : null;
  const stories = sorted.slice(1, cardCount).map((b) => b.story);
  const quick = sorted.slice(cardCount).map((b) => b.story.versions[0]);
  return { hero, stories, quick };
}

export async function fetchCategoryFeeds(): Promise<Record<string, VFeed>> {
  const { data, error } = await supabase
    .from("stories")
    .select(
      "id, created_at, story_articles(articles(id, medie, tekst, lenke, photo_url, dato, tags))",
    )
    .order("created_at", { ascending: false })
    .limit(500)
    .returns<StoryRow[]>();

  if (error) throw new Error(error.message);

  const built = (data ?? []).map(buildStory).filter((b): b is BuiltStory => b !== null);

  const byCategory = new Map<string, BuiltStory[]>();
  for (const b of built) {
    const list = byCategory.get(b.category) ?? [];
    list.push(b);
    byCategory.set(b.category, list);
  }

  const feeds: Record<string, VFeed> = {};
  for (const cat of CATEGORIES) {
    if (cat.name === "For deg") continue;
    feeds[cat.name] = feedFromStories(byCategory.get(cat.name) ?? []);
  }
  feeds["For deg"] = feeds["Nyheter"] ?? EMPTY_FEED;

  return feeds;
}
