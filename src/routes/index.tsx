import { createFileRoute } from "@tanstack/react-router";
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
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import heroSport from "../assets/hero-sport.jpg";
import heroFire from "../assets/hero-fire.jpg";
import heroPolitics from "../assets/hero-politics.jpg";
import heroBusiness from "../assets/hero-business.jpg";

const CATEGORIES = ["For deg", "Nyheter", "Sport", "Politikk", "Business", "Kultur", "Diverse"];

const TRENDS = {
  Dag: [
    { rank: 1, title: "Rentemøtet", delta: "+124 %" },
    { rank: 2, title: "Krigen i Gaza", delta: "+98 %" },
    { rank: 3, title: "Mbappé-debut", delta: "+87 %" },
    { rank: 4, title: "Strømprisene", delta: "+64 %" },
    { rank: 5, title: "Høyres skattepolitikk", delta: "+51 %" },
  ],
  Uke: [
    { rank: 1, title: "Sommerens brannfare", delta: "+210 %" },
    { rank: 2, title: "Feriekøen i Europa", delta: "+176 %" },
    { rank: 3, title: "Oljeutslipp i Nordsjøen", delta: "+142 %" },
    { rank: 4, title: "Nytt boliglån-regime", delta: "+119 %" },
    { rank: 5, title: "Tesla-kursen", delta: "+95 %" },
  ],
  Måned: [
    { rank: 1, title: "Regjeringssonderinger", delta: "+340 %" },
    { rank: 2, title: "OL 2028-uttak", delta: "+298 %" },
    { rank: 3, title: "Kraftkabel til Tyskland", delta: "+255 %" },
    { rank: 4, title: "Legekrisen", delta: "+201 %" },
    { rank: 5, title: "Kryptolov", delta: "+178 %" },
  ],
};

const MEDIA = [
  { name: "VG", tag: "VG", color: "bg-red-600" },
  { name: "NRK", tag: "NRK", color: "bg-neutral-700" },
  { name: "Aftenposten", tag: "AP", color: "bg-slate-800" },
  { name: "Dagbladet", tag: "DB", color: "bg-blue-700" },
  { name: "Nettavisen", tag: "NA", color: "bg-orange-600" },
  { name: "E24", tag: "E24", color: "bg-emerald-700" },
  { name: "TV 2", tag: "TV2", color: "bg-green-700" },
  { name: "Avisen", tag: "AV", color: "bg-indigo-700" },
];

interface Version {
  source: string;
  title: string;
  time: string;
  read: string;
}

interface VStory {
  kicker: string;
  dek: string;
  image: string;
  versions: Version[];
}

interface VFeed {
  hero: VStory;
  stories: VStory[];
  quick: Version[];
}

const FEEDS: Record<string, VFeed> = {
  Nyheter: {
    hero: {
      kicker: "Brann",
      dek: "En historisk trebygning i Kristiansand sentrum står i full fyr. Brannvesenet har evakuert flere naboer.",
      image: heroFire,
      versions: [
        { source: "NRK", title: "Storbrann i Kristiansand sentrum", time: "08:14", read: "4 min" },
        { source: "VG", title: "Historisk bygning i flammer", time: "08:21", read: "5 min" },
        { source: "Aftenposten", title: "Evakuering etter sentrumsbrann", time: "08:33", read: "6 min" },
      ],
    },
    stories: [
      {
        kicker: "Politikk",
        dek: "Regjeringen legger fram nye klimatiltak som skal kutte utslippene med 55 prosent innen 2030.",
        image: heroPolitics,
        versions: [
          { source: "VG", title: "Regjeringen skjerpter klimakrav", time: "07:45", read: "5 min" },
          { source: "NRK", title: "Nye klimamål presentert", time: "07:52", read: "4 min" },
          { source: "Dagbladet", title: "Dette betyr klimaplanen", time: "08:05", read: "7 min" },
        ],
      },
      {
        kicker: "Samfunn",
        dek: "Kommunene sliter med å rekruttere lærere. Nå foreslår KS en nasjonal krisepakke.",
        image: heroBusiness,
        versions: [
          { source: "Aftenposten", title: "Lærermangelen koster kommunene dyrt", time: "06:30", read: "6 min" },
          { source: "Nettavisen", title: "KS ber om krisepakke", time: "06:55", read: "3 min" },
        ],
      },
      {
        kicker: "Utenriks",
        dek: "NATO-toppmøtet åpner i dag med Ukraina, forsvarsbudsjetter og Kina på agendaen.",
        image: heroPolitics,
        versions: [
          { source: "NRK", title: "NATO-toppmøtet starter i Washington", time: "05:15", read: "8 min" },
          { source: "TV 2", title: "Dette skal NATO diskutere", time: "05:40", read: "5 min" },
          { source: "VG", title: "Zelenskyj møter allierte", time: "06:10", read: "6 min" },
        ],
      },
    ],
    quick: [
      { source: "E24", title: "Kronen styrker seg etter rentemøte", time: "09:12", read: "2 min" },
      { source: "NRK", title: "Togtrafikken normaliseres etter brann", time: "09:05", read: "1 min" },
      { source: "VG", title: "Ferieværet: Opphold i sør", time: "08:55", read: "1 min" },
      { source: "Aftenposten", title: "Ny museumsutstilling åpner i Oslo", time: "08:40", read: "3 min" },
      { source: "Dagbladet", title: "Kulturministeren møter filmbransjen", time: "08:25", read: "2 min" },
    ],
  },
  Sport: {
    hero: {
      kicker: "Fotball",
      dek: "Kylian Mbappé scoret to mål i sin første kamp for Real Madrid og fikk fansen til å glemme forsommerens spekulasjoner.",
      image: heroSport,
      versions: [
        { source: "VG", title: "Mbappé-show i Real Madrid-debut", time: "22:14", read: "6 min" },
        { source: "NRK", title: "To mål på 45 minutter", time: "22:18", read: "4 min" },
        { source: "TV 2", title: "Ancelotti: – En drømmedebut", time: "22:31", read: "5 min" },
      ],
    },
    stories: [
      {
        kicker: "Håndball",
        dek: "Norge tok en sterk seier over Frankrike i OL-oppkjøringen. Sander Sagosen var banens beste.",
        image: heroSport,
        versions: [
          { source: "Aftenposten", title: "Norge slo Frankrike i håndball", time: "21:45", read: "5 min" },
          { source: "Nettavisen", title: "Sagosen strålte mot Frankrike", time: "21:52", read: "3 min" },
        ],
      },
      {
        kicker: "Sykling",
        dek: "Jonas Vingegaard angrep på den siste stigningen og tok over gult trøye i Tour de France.",
        image: heroSport,
        versions: [
          { source: "VG", title: "Vingegaard i gult etter dristig angrep", time: "20:10", read: "7 min" },
          { source: "TV 2", title: "Dramatisk avslutning i alpene", time: "20:25", read: "5 min" },
        ],
      },
      {
        kicker: "Friidrett",
        dek: "Jakob Ingebrigtsen løp inn til ny personlig rekord på 1500 meter i Diamond League.",
        image: heroSport,
        versions: [
          { source: "NRK", title: "Ingebrigtsen med ny pers", time: "19:50", read: "4 min" },
          { source: "Dagbladet", title: "OL-formen er der", time: "20:05", read: "5 min" },
        ],
      },
    ],
    quick: [
      { source: "VG", title: "Overgangsvinduet: Siste nytt", time: "23:05", read: "2 min" },
      { source: "NRK", title: "OL-helsen: Norsk tropp klar", time: "22:50", read: "3 min" },
      { source: "TV 2", title: "Rosenborg med ny trener", time: "22:30", read: "4 min" },
      { source: "Nettavisen", title: "Premier League-klubb kjøper spiss", time: "22:15", read: "1 min" },
    ],
  },
  Politikk: {
    hero: {
      kicker: "Stortinget",
      dek: "Ap og Sp er uenige om skattepakken. Nå vurderer regjeringen å splitte saken i to deler.",
      image: heroPolitics,
      versions: [
        { source: "NRK", title: "Regjeringspartiene krangler om skatt", time: "07:30", read: "6 min" },
        { source: "VG", title: "Ap-Sp: Brudd om skattepakke", time: "07:42", read: "5 min" },
        { source: "Aftenposten", title: "Skattesplitt kan være løsningen", time: "08:00", read: "7 min" },
      ],
    },
    stories: [
      {
        kicker: "Lokalpolitikk",
        dek: "Oslo kommune vil forby fossiloppvarming i alle nye bygg fra 2026.",
        image: heroPolitics,
        versions: [
          { source: "Aftenposten", title: "Oslos nye forbud mot fossiloppvarming", time: "06:15", read: "5 min" },
          { source: "Dagbladet", title: "MDG jubler, NHO reagerer", time: "06:40", read: "4 min" },
        ],
      },
      {
        kicker: "EU",
        dek: "EUs nye asyl- og migrasjonspakt får kritikk fra norske frivillige organisasjoner.",
        image: heroPolitics,
        versions: [
          { source: "NRK", title: "Norske organisasjoner kritiserer EU-pakt", time: "05:50", read: "6 min" },
          { source: "VG", title: "Asylpakten: Dette sier Norge", time: "06:05", read: "4 min" },
        ],
      },
      {
        kicker: "Valg",
        dek: "Måling viser at Høyre og Ap ligger likt. SV og Frp gjør begge gode valg.",
        image: heroPolitics,
        versions: [
          { source: "Nettavisen", title: "Høyre og Ap likt i ny måling", time: "05:00", read: "3 min" },
          { source: "TV 2", title: "Frp og SV oppsving", time: "05:20", read: "4 min" },
        ],
      },
    ],
    quick: [
      { source: "NRK", title: "Stortingets sommerferie er over", time: "08:10", read: "2 min" },
      { source: "VG", title: "Nye statssekretærer utnevnt", time: "07:55", read: "1 min" },
      { source: "Aftenposten", title: "Regjeringen lover mer penger til kommunene", time: "07:40", read: "3 min" },
    ],
  },
  Business: {
    hero: {
      kicker: "Børs",
      dek: "Oslo Børs åpnet ned etter svake arbeidsmarkedstall fra USA. Oljeprisen holder seg stabil.",
      image: heroBusiness,
      versions: [
        { source: "E24", title: "Oslo Børs ned etter svake USA-tall", time: "09:05", read: "5 min" },
        { source: "NRK", title: "Arbeidsmarkedet i USA skuffer", time: "09:12", read: "4 min" },
        { source: "Aftenposten", title: "Oljeprisen stabil tross børsfall", time: "09:25", read: "6 min" },
      ],
    },
    stories: [
      {
        kicker: "Eiendom",
        dek: "Boligprisene i Oslo steg 1,2 prosent i juli. Eksperter venter flat høst.",
        image: heroBusiness,
        versions: [
          { source: "E24", title: "Boligprisene opp i Oslo", time: "08:30", read: "4 min" },
          { source: "Nettavisen", title: "Eksperter: Flat høst", time: "08:45", read: "3 min" },
        ],
      },
      {
        kicker: "Energi",
        dek: "Equinor øker utbyttet etter sterke kvartalstall. Aksjen stiger på børsen.",
        image: heroBusiness,
        versions: [
          { source: "E24", title: "Equinor øker utbyttet", time: "07:50", read: "5 min" },
          { source: "VG", title: "Sterke tall fra Equinor", time: "08:00", read: "4 min" },
        ],
      },
      {
        kicker: "Tech",
        dek: "Norsk gründer får 150 millioner i Serie A. Selskapet lager AI for fiskerinæringen.",
        image: heroBusiness,
        versions: [
          { source: "Nettavisen", title: "Norsk AI-selskap henter 150 mill.", time: "07:10", read: "3 min" },
          { source: "E24", title: "Gründer satser på AI og fisk", time: "07:25", read: "5 min" },
        ],
      },
    ],
    quick: [
      { source: "E24", title: "Dollar svekkes mot kronen", time: "09:20", read: "1 min" },
      { source: "NRK", title: "NAV: Flere ledige i juli", time: "09:00", read: "2 min" },
      { source: "Aftenposten", title: "Nytt regelverk for fond", time: "08:45", read: "3 min" },
      { source: "Nettavisen", title: "Elbil-salg faller i Europa", time: "08:30", read: "2 min" },
    ],
  },
  Kultur: {
    hero: {
      kicker: "Film",
      dek: "Norsk dramafilm vant hovedprisen i Cannes. Regissøren takket hele teamet i en rørende tale.",
      image: heroFire,
      versions: [
        { source: "NRK", title: "Norsk film vant i Cannes", time: "21:00", read: "5 min" },
        { source: "Aftenposten", title: "Cannes-pris til norsk debutant", time: "21:15", read: "6 min" },
        { source: "Dagbladet", title: "Rørende takketale i Cannes", time: "21:30", read: "4 min" },
      ],
    },
    stories: [
      {
        kicker: "Musikk",
        dek: "Årets Øyafestival er i gang. Her er anmeldelsene av de største konsertene.",
        image: heroSport,
        versions: [
          { source: "VG", title: "Øya: De beste konsertene", time: "20:30", read: "5 min" },
          { source: "Dagbladet", title: "Anmeldelse: Øyafestivalen", time: "20:45", read: "6 min" },
        ],
      },
      {
        kicker: "Litteratur",
        dek: "Høstens store bokslipp er klart. Flere norske forfattere er aktuelle for Brageprisen.",
        image: heroPolitics,
        versions: [
          { source: "Aftenposten", title: "Høstens bokslipp er her", time: "19:00", read: "6 min" },
          { source: "NRK", title: "Disse kan vinne Brageprisen", time: "19:20", read: "4 min" },
        ],
      },
      {
        kicker: "Teater",
        dek: "Nationaltheatret setter opp en ny versjon av Peer Gynt med internasjonal cast.",
        image: heroBusiness,
        versions: [
          { source: "Dagbladet", title: "Ny Peer Gynt på Nationaltheatret", time: "18:30", read: "5 min" },
          { source: "Aftenposten", title: "Internasjonal cast til Peer Gynt", time: "18:45", read: "6 min" },
        ],
      },
    ],
    quick: [
      { source: "NRK", title: "Norsk serie får internasjonal premiere", time: "20:15", read: "2 min" },
      { source: "VG", title: "Kunstutstilling trekker fullt hus", time: "19:45", read: "1 min" },
      { source: "Dagbladet", title: "Ny roman topp bestselgerlista", time: "19:30", read: "3 min" },
    ],
  },
  Diverse: {
    hero: {
      kicker: "Vær",
      dek: "Meteorologene varsler ustabilt vær i store deler av landet. Lokalt kan det komme mye regn.",
      image: heroFire,
      versions: [
        { source: "NRK", title: "Ustabilt vær i store deler av landet", time: "07:00", read: "3 min" },
        { source: "VG", title: "Mye regn ventet i vest", time: "07:10", read: "2 min" },
        { source: "Dagbladet", title: "Sommerværet: Slik blir uken", time: "07:25", read: "4 min" },
      ],
    },
    stories: [
      {
        kicker: "Mat",
        dek: "Norske jordbær er endelig modne over hele landet. Prisene er lavere enn i fjor.",
        image: heroSport,
        versions: [
          { source: "NRK", title: "Norske jordbær i butikk nå", time: "06:30", read: "3 min" },
          { source: "Aftenposten", title: "Jordbærprisene ned", time: "06:45", read: "4 min" },
        ],
      },
      {
        kicker: "Reise",
        dek: "Feriekøen på Gardermoen er rekordlang. Sjekk rutetipsene før du reiser.",
        image: heroPolitics,
        versions: [
          { source: "VG", title: "Rekordkø på Gardermoen", time: "06:00", read: "4 min" },
          { source: "Nettavisen", title: "Slik unngår du feriekøen", time: "06:15", read: "3 min" },
        ],
      },
      {
        kicker: "Helse",
        dek: "FHI advarer mot høye pollenverdier denne uken. Astmatikere bør ta forholdsregler.",
        image: heroBusiness,
        versions: [
          { source: "NRK", title: "Høye pollenverdier varslet", time: "05:45", read: "3 min" },
          { source: "TV 2", title: "Dette bør pollenallergikere vite", time: "06:00", read: "4 min" },
        ],
      },
    ],
    quick: [
      { source: "NRK", title: "Sommerens beste badestrender", time: "18:00", read: "2 min" },
      { source: "VG", title: "Test: Billigste feriemat", time: "17:45", read: "3 min" },
      { source: "Aftenposten", title: "Nye regler for elsparkesykler", time: "17:30", read: "4 min" },
    ],
  },
};

const TREND_TOPICS: Record<string, string> = {
  "Rentemøtet": "Business",
  "Tesla-kursen": "Business",
  "Nytt boliglån-regime": "Business",
  "Kryptolov": "Business",
  "Oljeutslipp i Nordsjøen": "Nyheter",
  "Krigen i Gaza": "Nyheter",
  "Høyres skattepolitikk": "Politikk",
  "Regjeringssonderinger": "Politikk",
  "Legekrisen": "Nyheter",
  "Mbappé-debut": "Sport",
  "OL 2028-uttak": "Sport",
  "Sommerens brannfare": "Nyheter",
  "Feriekøen i Europa": "Diverse",
  "Strømprisene": "Nyheter",
  "Kraftkabel til Tyskland": "Nyheter",
};

function withVersions(story: {
  kicker: string;
  dek: string;
  image: string;
  version: Version;
}): VStory {
  const sources = MEDIA.map((m) => m.name).filter((s) => s !== story.version.source);
  const extraCount = Math.min(2, sources.length);
  const shuffled = sources.sort(() => Math.random() - 0.5).slice(0, extraCount);
  const extra: Version[] = shuffled.map((source) => {
    const tweaks: Record<string, string> = {
      VG: story.version.title,
      NRK: `${story.version.title.split(" ").slice(0, 3).join(" ")} – dette vet vi`,
      Aftenposten: `Analyse: ${story.version.title}`,
      Dagbladet: `${story.version.title} (+)`,
      Nettavisen: `${story.version.title} – siste`,
      E24: story.version.title,
      "TV 2": `Saken forklart: ${story.version.title}`,
      Avisen: `${story.version.title} – kommentar`,
    };
    return {
      source,
      title: tweaks[source] ?? story.version.title,
      time: story.version.time,
      read: story.version.read,
    };
  });
  return {
    kicker: story.kicker,
    dek: story.dek,
    image: story.image,
    versions: [story.version, ...extra],
  };
}

function feedForTrend(topic: string): VFeed {
  const base = FEEDS[TREND_TOPICS[topic] ?? "Nyheter"];
  const trendStory: VStory = {
    kicker: "Trender",
    dek: `Saken har fått økt oppmerksomhet de siste timene. Her samler vi dekningen fra flere norske redaksjoner om «${topic}».`,
    image: base.hero.image,
    versions: MEDIA.slice(0, 5).map((m) => ({
      source: m.name,
      title: `${topic}: ${m.name} oppdaterer`,
      time: `${String(7 + Math.floor(Math.random() * 14)).padStart(2, "0")}:${String(Math.floor(Math.random() * 60)).padStart(2, "0")}`,
      read: `${2 + Math.floor(Math.random() * 5)} min`,
    })),
  };
  return {
    hero: trendStory,
    stories: base.stories.slice(0, 2),
    quick: base.quick.slice(0, 4),
  };
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
  return { hero: hero ?? feed.hero, stories, quick };
}

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const [tab, setTab] = useState<keyof typeof TRENDS>("Dag");
  const [cat, setCat] = useState("Nyheter");
  const [trend, setTrend] = useState<string | null>(null);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [enabledMedia, setEnabledMedia] = useState<Set<string>>(new Set(MEDIA.map((m) => m.name)));
  const [heroIdx, setHeroIdx] = useState(0);

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

  const toggleMedia = (name: string) => {
    setEnabledMedia((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const rawFeed = useMemo(() => (trend ? feedForTrend(trend) : FEEDS[cat] ?? FEEDS["Nyheter"]), [cat, trend]);
  const feed = useMemo(() => filterFeed(rawFeed, enabledMedia), [rawFeed, enabledMedia]);

  const heroStory = feed.hero;
  const heroVersion = heroStory?.versions[heroIdx % (heroStory.versions.length || 1)];
  const storyList = feed.stories;
  const quickList = feed.quick;

  useEffect(() => {
    setHeroIdx(0);
  }, [cat, trend, enabledMedia.size]);

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      {/* Masthead / edition bar */}
      <div className="border-b-2 border-border">
        <div className="mx-auto flex max-w-[1600px] flex-col items-center justify-between gap-3 px-6 py-5 sm:flex-row sm:gap-6">
          <div className="text-center sm:text-left">
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-primary">
              OSL // 26.07.2026 // W30
            </p>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
              18°C · LAVTRYKK_VEST
            </p>
          </div>

          <div className="text-center">
            <h1 className="font-display text-4xl uppercase tracking-[-0.04em] text-foreground md:text-5xl">
              NYHET<span className="text-primary">.</span>
            </h1>
            <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.35em] text-muted-foreground">
              signal / norsk presse
            </p>
          </div>

          <div className="hidden items-center gap-2 sm:flex">
            <button
              onClick={() => applyTheme(theme === "dark" ? "light" : "dark")}
              aria-label={theme === "dark" ? "Bytt til lyst tema" : "Bytt til mørkt tema"}
              className="flex h-9 w-9 items-center justify-center border-2 border-border text-muted-foreground transition hover:border-primary hover:text-primary"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button className="flex h-9 w-9 items-center justify-center border-2 border-border text-muted-foreground transition hover:border-primary hover:text-primary">
              <Bell className="h-4 w-4" />
            </button>
            <button className="border-2 border-primary bg-primary px-4 py-2 font-mono text-xs font-bold uppercase tracking-widest text-primary-foreground transition hover:bg-transparent hover:text-primary">
              Logg inn
            </button>
          </div>
        </div>
      </div>

      {/* Category nav */}
      <div className="sticky top-0 z-40 border-b-2 border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-6 py-2">
          <nav className="flex items-center gap-0 overflow-x-auto">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => {
                  setCat(c);
                  setTrend(null);
                }}
                className={`relative whitespace-nowrap border-r border-border px-4 py-2 font-mono text-[11px] font-medium uppercase tracking-[0.18em] transition ${
                  cat === c && !trend
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                {c}
              </button>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <div className="flex items-center gap-2 border-2 border-border px-3 py-1.5 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              <Search className="h-3.5 w-3.5" />
              <span>Søk</span>
              <kbd className="ml-2 border border-border px-1.5 py-0.5 font-mono text-[10px]">⌘K</kbd>
            </div>
          </div>
        </div>
      </div>


      {/* 3-column layout */}
      <main className="mx-auto grid max-w-[1600px] grid-cols-1 gap-6 px-6 py-8 lg:grid-cols-[230px_minmax(0,1fr)_290px]">
        {/* LEFT — Trender */}
        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <section className="frame">
            <div className="flex items-center justify-between border-b-2 border-border bg-secondary/40 px-3 py-2">
              <h2 className="font-mono text-[11px] font-bold uppercase tracking-[0.25em]">Trender</h2>
              <TrendingUp className="h-3.5 w-3.5 text-primary" />
            </div>
            <div className="flex border-b border-border font-mono text-[10px] uppercase tracking-widest">
              {(Object.keys(TRENDS) as (keyof typeof TRENDS)[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`flex-1 border-r border-border px-2 py-2 transition last:border-r-0 ${
                    tab === t
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <ol className="divide-y divide-border">
              {TRENDS[tab].map((t) => (
                <li key={t.rank}>
                  <button
                    type="button"
                    onClick={() => setTrend(t.title)}
                    className={`group flex w-full items-baseline gap-3 px-3 py-2.5 text-left transition hover:bg-secondary/60 ${
                      trend === t.title ? "bg-primary/15 border-l-2 border-primary" : "border-l-2 border-transparent"
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

          <section className="frame scanline p-4">
            <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.25em] text-primary">
              ● Direkte nå
            </p>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping bg-primary opacity-75" />
                <span className="relative inline-flex h-2 w-2 bg-primary" />
              </span>
              <span className="font-display text-sm uppercase">Rentemøtet</span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Norges Bank presenterer beslutningen kl. 10:00. Følg live-oppdateringen.
            </p>
            <button className="mt-4 flex items-center gap-2 border-2 border-primary px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-primary transition hover:bg-primary hover:text-primary-foreground">
              <Play className="h-3 w-3 fill-current" /> Se sending
            </button>
          </section>
        </aside>


        {/* CENTER — Feed */}
        <section className="min-w-0 space-y-6">
          {/* Section header */}
          <div className="flex items-end justify-between border-b-2 border-border pb-3">
            <div>
              <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.3em] text-primary">
                {trend ? "// aktivt filter" : "// hovedseksjon"}
              </p>
              <h2 className="font-display text-3xl uppercase leading-none md:text-4xl">
                {trend ?? cat}
              </h2>
            </div>
            <div className="hidden items-center gap-2 sm:flex">
              {trend ? (
                <button
                  onClick={() => setTrend(null)}
                  className="flex items-center gap-1.5 border-2 border-primary px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-primary transition hover:bg-primary hover:text-primary-foreground"
                >
                  Fjern filter <span className="text-sm leading-none">×</span>
                </button>
              ) : (
                <>
                  <button className="border-2 border-border px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground transition hover:border-primary hover:text-primary">
                    Nyest
                  </button>
                  <button className="border-2 border-primary bg-primary px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-primary-foreground">
                    Anbefalt
                  </button>
                </>
              )}
            </div>
          </div>


          {/* Hero article */}
          {heroVersion ? (
            <article className="group frame">
              <div className="relative aspect-[16/9] overflow-hidden">
                <img
                  src={heroStory.image}
                  alt=""
                  width={1280}
                  height={800}
                  className="h-full w-full object-cover contrast-[1.1] saturate-[0.85] transition duration-700 group-hover:scale-[1.03] group-hover:saturate-100"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/55 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6 md:p-8">
                  <p className="mb-3 inline-block border-2 border-primary bg-primary px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-primary-foreground">
                    {heroStory.kicker}
                  </p>
                  <h3 className="max-w-3xl font-display text-3xl uppercase leading-[0.98] text-white md:text-4xl lg:text-5xl">
                    {heroVersion.title}
                  </h3>
                  <p className="mt-3 max-w-2xl text-sm leading-relaxed text-neutral-300">
                    {heroStory.dek}
                  </p>
                  <div className="mt-5 flex flex-wrap items-center gap-3 font-mono text-[10px] uppercase tracking-widest text-neutral-300">
                    <span className="border border-white/40 px-2 py-1 font-bold text-white">
                      {heroVersion.source}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3 w-3" />
                      {heroVersion.time}
                    </span>
                    <span>{heroVersion.read}</span>
                    <div className="ml-auto flex items-center gap-1">
                      {heroStory.versions.map((_, k) => (
                        <button
                          key={k}
                          onClick={() => setHeroIdx(k)}
                          aria-label={`Versjon ${k + 1} av ${heroStory.versions.length}`}
                          className={`h-1.5 transition-all ${
                            k === heroIdx % heroStory.versions.length
                              ? "w-7 bg-primary"
                              : "w-3 bg-white/40 hover:bg-white/70"
                          }`}
                        />
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
                        className="ml-3 border-2 border-white/50 bg-black/50 p-2 text-white backdrop-blur transition hover:border-primary hover:text-primary"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="absolute inset-y-0 right-0 flex items-center">
                      <button
                        onClick={() => setHeroIdx((n) => (n + 1) % heroStory.versions.length)}
                        aria-label="Neste versjon"
                        className="mr-3 border-2 border-white/50 bg-black/50 p-2 text-white backdrop-blur transition hover:border-primary hover:text-primary"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            </article>
          ) : (
            <article className="border-2 border-dashed border-border bg-card p-12 text-center">
              <p className="font-display text-xl uppercase">Ingen medier valgt</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Aktiver minst én kilde under «Dine medier» for å se saker.
              </p>
            </article>
          )}


          {/* Secondary stories */}
          {storyList.length > 0 && (
            <>
              <div className="grid gap-6 sm:grid-cols-2">
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
            <div className="flex items-center justify-between border-b-2 border-border bg-secondary/40 px-4 py-2.5">
              <h3 className="font-mono text-[11px] font-bold uppercase tracking-[0.25em]">Kort og godt</h3>
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
                ● Oppdatert nå
              </span>
            </div>
            <ul className="divide-y divide-border">
              {quickList.map((q) => (
                <li key={q.title}>
                  <a
                    href="#"
                    className="group flex items-center gap-4 border-l-2 border-transparent px-4 py-3 transition hover:border-primary hover:bg-secondary/40"
                  >
                    <span className="border border-border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      {q.source}
                    </span>
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
        <aside className="space-y-8 lg:sticky lg:top-28 lg:self-start">
          <section>
            <div className="mb-1 flex items-end justify-between border-b border-border pb-3">
              <h2 className="font-display text-2xl leading-none">Dine medier</h2>
              <button className="flex h-7 w-7 items-center justify-center rounded-sm border border-border text-muted-foreground transition hover:bg-secondary">
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="mb-4 text-xs text-muted-foreground">
              {enabledMedia.size} av {MEDIA.length} aktive · klikk for å skjule
            </p>
            <div className="grid grid-cols-4 gap-2">
              {MEDIA.map((m) => {
                const on = enabledMedia.has(m.name);
                return (
                  <button
                    key={m.name}
                    onClick={() => toggleMedia(m.name)}
                    aria-pressed={on}
                    className={`flex aspect-square items-center justify-center rounded-sm font-mono text-[10px] font-bold text-white transition hover:scale-105 ${m.color} ${
                      on ? "" : "opacity-25 grayscale"
                    }`}
                    title={`${m.name} — ${on ? "aktiv, klikk for å skjule" : "skjult, klikk for å vise"}`}
                  >
                    {m.tag}
                  </button>
                );
              })}
              <button className="flex aspect-square items-center justify-center rounded-sm border border-dashed border-border text-muted-foreground transition hover:border-primary hover:text-primary">
                <Plus className="h-4 w-4" />
              </button>
            </div>
            {enabledMedia.size < MEDIA.length && (
              <button
                onClick={() => setEnabledMedia(new Set(MEDIA.map((m) => m.name)))}
                className="mt-3 text-xs font-medium text-primary hover:underline"
              >
                Vis alle igjen
              </button>
            )}
          </section>

          <section className="border border-border bg-card p-5">
            <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
              <p className="font-display text-xl leading-none">Filter</p>
              <span className="font-mono text-[10px] text-muted-foreground">konto-avhengig</span>
            </div>
            <div className="space-y-1 text-sm">
              {["Skjul sport", "Kun norske kilder", "Skjul lest", "Prioriter lange saker"].map((f, i) => (
                <label
                  key={f}
                  className="flex cursor-pointer items-center justify-between rounded-sm px-2 py-2 transition hover:bg-secondary/40"
                >
                  <span>{f}</span>
                  <span
                    className={`relative h-4 w-7 rounded-full transition ${
                      i === 1 || i === 2 ? "bg-primary" : "border border-border bg-secondary"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-3 w-3 rounded-full bg-background transition ${
                        i === 1 || i === 2 ? "left-3.5" : "left-0.5"
                      }`}
                    />
                  </span>
                </label>
              ))}
            </div>
          </section>

          <section className="border border-primary/40 bg-gradient-to-br from-primary/10 to-transparent p-5">
            <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-primary">Nyhet Pro</p>
            <h3 className="font-display text-2xl leading-tight">Les alt, uten reklame.</h3>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Full tilgang til over 40 norske medier for 79 kr / mnd.
            </p>
            <button className="mt-5 w-full rounded-sm bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90">
              Prøv 30 dager gratis
            </button>
          </section>
        </aside>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-3 px-6 py-10 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono uppercase tracking-wider">© 2026 Nyhet / Oslo</p>
          <p>Et moderne nyhetsdashbord — bygget for lesing, ikke scrolling.</p>
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
      className={`group overflow-hidden border border-border bg-card ${
        wide ? "grid sm:grid-cols-[1.4fr_1fr]" : ""
      }`}
    >
      <div className={`relative overflow-hidden ${wide ? "aspect-[4/3] sm:aspect-auto" : "aspect-[4/3]"}`}>
        <img
          src={story.image}
          alt=""
          loading="lazy"
          width={1000}
          height={640}
          className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
        />
      </div>
      <div className="flex flex-col p-5">
        <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-primary">{story.kicker}</p>
        <h3
          className={`font-display leading-[1.1] tracking-tight ${
            wide ? "text-2xl md:text-3xl" : "text-xl md:text-2xl"
          }`}
        >
          {v.title}
        </h3>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{story.dek}</p>
        <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="rounded-sm border border-border px-2 py-0.5 font-mono text-[10px]">
            {v.source}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {v.time}
          </span>
          <span>· {v.read}</span>
        </div>
        {count > 1 && (
          <div className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-3 mt-4">
            <button
              onClick={prev}
              aria-label="Forrige versjon"
              className="rounded-sm border border-border p-1.5 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <div className="flex flex-1 items-center justify-center gap-1.5">
              {story.versions.map((ver, k) => (
                <button
                  key={ver.source}
                  onClick={() => setI(k)}
                  aria-label={`Versjon ${k + 1}: ${ver.source}`}
                  className={`h-1.5 rounded-full transition-all ${
                    k === idx ? "w-6 bg-primary" : "w-1.5 bg-border hover:bg-muted-foreground"
                  }`}
                />
              ))}
            </div>
            <button
              onClick={next}
              aria-label="Neste versjon"
              className="rounded-sm border border-border p-1.5 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
