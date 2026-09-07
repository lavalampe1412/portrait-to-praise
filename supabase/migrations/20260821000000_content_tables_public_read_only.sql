-- articles/stories/story_articles were created directly via psycopg by
-- new_fidia_scraper's publish.py (bypassing Supabase's normal RLS
-- defaults). That left RLS disabled with full INSERT/UPDATE/DELETE/
-- TRUNCATE grants on anon+authenticated -- i.e. the publishable key
-- shipped in the frontend bundle could wipe these tables. Lock them to
-- public read-only; writes continue to happen only via the scraper's
-- direct postgres connection (DATABASE_URL), which is unaffected by
-- anon/authenticated grants.

ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access" ON public.articles FOR SELECT USING (true);
CREATE POLICY "Public read access" ON public.stories FOR SELECT USING (true);
CREATE POLICY "Public read access" ON public.story_articles FOR SELECT USING (true);

REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.articles FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.stories FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.story_articles FROM anon, authenticated;
