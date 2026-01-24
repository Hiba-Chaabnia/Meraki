"use client";

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Settings = Database["public"]["Tables"]["user_settings"]["Row"];

interface UserContextValue {
  user: User | null;
  profile: Profile | null;
  settings: Settings | null;
  isLoading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const UserContext = createContext<UserContextValue>({
  user: null,
  profile: null,
  settings: null,
  isLoading: true,
  refreshProfile: async () => {},
  signOut: async () => {},
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = useMemo(() => createClient(), []);

  const fetchProfile = useCallback(
    async (userId: string) => {
      const [profileRes, settingsRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).single(),
        supabase.from("user_settings").select("*").eq("id", userId).single(),
      ]);
      setProfile(profileRes.data);
      setSettings(settingsRes.data);
    },
    [supabase],
  );

  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user.id);
  }, [user, fetchProfile]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSettings(null);
  }, [supabase]);

  useEffect(() => {
    const init = async () => {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      setUser(currentUser);
      if (currentUser) await fetchProfile(currentUser.id);
      setIsLoading(false);
    };
    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const newUser = session?.user ?? null;
      setUser(newUser);
      if (newUser) {
        await fetchProfile(newUser.id);
      } else {
        setProfile(null);
        setSettings(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, fetchProfile]);

  return (
    <UserContext.Provider
      value={{ user, profile, settings, isLoading, refreshProfile, signOut }}
    >
      {children}
    </UserContext.Provider>
  );
}

export { UserContext };
