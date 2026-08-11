import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export function useProfile() {
  const [session, setSession] = useState<Session | null>(null);
  const [profileName, setProfileName] = useState<string>("");
  const [profileAvatar, setProfileAvatar] = useState<string | null>(null);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) {
      setProfileName("");
      setProfileAvatar(null);
      return;
    }
    // Google puts the real name/photo under "name"/"avatar_url" (sometimes
    // "full_name"/"picture"); prefer that over the profiles table, whose data
    // can be stale for Google sign-ins.
    const metaName: string | undefined =
      session.user.user_metadata?.full_name || session.user.user_metadata?.name;
    const metaAvatar: string | undefined =
      session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture;
    setProfileName(metaName || "");
    setProfileAvatar(metaAvatar || null);
    if (metaName && metaAvatar) return;

    let active = true;
    supabase
      .from("profiles")
      .select("display_name, avatar_url")
      .eq("id", session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return;
        setProfileName((prev) => prev || data?.display_name || session.user.email?.split("@")[0] || "Konto");
        setProfileAvatar((prev) => prev || data?.avatar_url || null);
      });
    return () => {
      active = false;
    };
  }, [session]);

  return { session, profileName, profileAvatar };
}
