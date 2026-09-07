// Fast, kontrollert vokabular for artiklenes emne-tag. Holdes i sync med
// tag-verdiene i public/content/categories/*.json.
export interface ContentTag {
  slug: string;
  label: string;
}

export const CONTENT_TAGS: ContentTag[] = [
  { slug: "politikk", label: "Politikk" },
  { slug: "business", label: "Business" },
  { slug: "sport", label: "Sport" },
  { slug: "kultur", label: "Kultur" },
  { slug: "samfunn", label: "Samfunn" },
  { slug: "utenriks", label: "Utenriks" },
  { slug: "vaer", label: "Vær" },
  { slug: "livsstil", label: "Livsstil" },
];

const TAG_LABEL_BY_SLUG: Record<string, string> = Object.fromEntries(
  CONTENT_TAGS.map((t) => [t.slug, t.label]),
);

export function tagLabel(slug: string | undefined): string {
  if (!slug) return "";
  return TAG_LABEL_BY_SLUG[slug] ?? slug;
}
