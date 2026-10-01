import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type FamilyHistory = {
  conditions?: string[];
  notes?: string;
};

export type Demographics = {
  birth_year?: number;
  sex_at_birth?: string;
  gender?: string;
  ancestry?: string[];
  pregnancy_status?: string;
  notes?: string;
};

export type Profile = {
  id: string;
  display_name: string | null;
  family_history: FamilyHistory | null;
  demographics: Demographics | null;
  reminder_time: string | null;
  streak_count: number;
  last_checkin_date: string | null;
};

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("id,display_name,family_history,demographics,reminder_time,streak_count,last_checkin_date")
      .eq("id", user.id)
      .maybeSingle();
    setProfile(data as Profile | null);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const update = useCallback(async (patch: Partial<Profile>) => {
    if (!user) return;
    const { data, error } = await supabase
      .from("profiles")
      .update(patch as any)
      .eq("id", user.id)
      .select("id,display_name,family_history,demographics,reminder_time,streak_count,last_checkin_date")
      .single();
    if (!error && data) setProfile(data as Profile);
    return { data, error };
  }, [user]);

  return { profile, loading, reload: load, update };
}
