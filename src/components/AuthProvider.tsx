"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { signInWithLine, signOut as supabaseSignOut } from "@/lib/auth";

interface LiffProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
}

interface AuthContextType {
  user: LiffProfile | null;
  dbProfileId: string | null;
  loading: boolean;
  isFriend: boolean | null;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  dbProfileId: null,
  loading: true,
  isFriend: null,
  login: () => {},
  logout: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<LiffProfile | null>(null);
  const [dbProfileId, setDbProfileId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFriend, setIsFriend] = useState<boolean | null>(null);

  useEffect(() => {
    async function init() {
      try {
        const { initLiff, isLoggedIn, getProfile, getFriendship: getLiffFriendship } = await import("@/lib/liff");
        await initLiff();
        if (isLoggedIn()) {
          const profile = await getProfile();
          if (profile) {
            setUser({
              userId: profile.userId,
              displayName: profile.displayName,
              pictureUrl: profile.pictureUrl,
            });

            // Supabase認証セッション + プロフィールupsert
            try {
              const authResult = await signInWithLine({
                userId: profile.userId,
                displayName: profile.displayName,
                pictureUrl: profile.pictureUrl,
              });
              setDbProfileId(authResult.profileId);
              if (process.env.NODE_ENV === 'development') {
                console.log("[Auth] Supabase auth success:", {
                  authUserId: authResult.userId,
                  profileId: authResult.profileId,
                  match: authResult.userId === authResult.profileId,
                });
              }
            } catch (e) {
              console.error("[Auth] Supabase auth error:", e);
            }
          }
          try {
            const friendship = await getLiffFriendship();
            if (friendship) {
              setIsFriend(friendship.friendFlag);
            }
          } catch {
            // friendship API may fail outside LINE
          }
        }
      } catch (e) {
        console.error("LIFF init error:", e);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const handleLogin = async () => {
    const { login: liffLogin } = await import("@/lib/liff");
    await liffLogin();
  };

  const handleLogout = async () => {
    await supabaseSignOut();
    const { logout: liffLogout } = await import("@/lib/liff");
    await liffLogout();
  };

  return (
    <AuthContext.Provider value={{ user, dbProfileId, loading, isFriend, login: handleLogin, logout: handleLogout }}>
      {children}
    </AuthContext.Provider>
  );
}
