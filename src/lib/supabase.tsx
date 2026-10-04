import { createClient, type User, type Session } from "@supabase/supabase-js";
import React, { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { actions } from "./store";
import { instantAuthFn } from "./auth.functions";

const supabaseUrl =
  (typeof import.meta !== "undefined" && import.meta.env?.["VITE_SUPABASE_URL"]) ||
  "https://pofzbshdejpdoalizbjx.supabase.co";

const supabaseAnonKey =
  (typeof import.meta !== "undefined" && import.meta.env?.["VITE_SUPABASE_ANON_KEY"]) ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvZnpic2hkZWpwZG9hbGl6Ymp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTExMTA5OTYsImV4cCI6MjEwNjY4Njk5Nn0.RoPEy65PhHhadKQG5_iEvtiW6SMo58I7wLwfLJjSyZc";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signInWithPassword: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUpWithPassword: (
    email: string,
    password: string,
    metadata?: { fullName?: string; location?: string }
  ) => Promise<{ error: Error | null; user: User | null }>;
  signInWithMagicLink: (email: string) => Promise<{ error: Error | null }>;
  resetPasswordForEmail: (email: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 1. Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        const displayName =
          (session.user.user_metadata as Record<string, unknown>)?.["full_name"] as string ||
          (session.user.user_metadata as Record<string, unknown>)?.["name"] as string ||
          session.user.email?.split("@")[0];
        if (displayName) actions.setName(displayName);
      }
      setIsLoading(false);
    });

    // 2. Listen to active auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        const displayName =
          (session.user.user_metadata as Record<string, unknown>)?.["full_name"] as string ||
          (session.user.user_metadata as Record<string, unknown>)?.["name"] as string ||
          session.user.email?.split("@")[0];
        if (displayName) actions.setName(displayName);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signInWithPassword = async (email: string, password: string) => {
    const cleanEmail = email.trim();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    // If email is not confirmed, seamlessly auto-confirm and establish session
    if (error && error.message.toLowerCase().includes("email not confirmed")) {
      try {
        const res = await instantAuthFn({
          data: { email: cleanEmail, password },
        });
        if (res.otp) {
          const { data: verifyData, error: verifyErr } = await supabase.auth.verifyOtp({
            email: cleanEmail,
            token: res.otp,
            type: "magiclink",
          });
          if (!verifyErr && verifyData.session) {
            setSession(verifyData.session);
            setUser(verifyData.user);
            return { error: null };
          }
        }
      } catch (confirmErr: unknown) {
        console.error("Auto-confirmation attempt failed:", confirmErr);
      }
    }

    if (!error && data.session) {
      setSession(data.session);
      setUser(data.user);
    }

    return { error: error as Error | null };
  };

  const signUpWithPassword = async (
    email: string,
    password: string,
    metadata?: { fullName?: string; location?: string }
  ) => {
    const cleanEmail = email.trim();

    try {
      // Create user pre-confirmed on the server and receive instant OTP token
      const res = await instantAuthFn({
        data: {
          email: cleanEmail,
          password,
          fullName: metadata?.fullName,
        },
      });

      if (res.otp) {
        // Immediately establish session via OTP
        const { data: verifyData, error: verifyErr } = await supabase.auth.verifyOtp({
          email: cleanEmail,
          token: res.otp,
          type: "magiclink",
        });

        if (verifyErr) {
          throw verifyErr;
        }

        if (verifyData.session) {
          setSession(verifyData.session);
          setUser(verifyData.user);
          return { error: null, user: verifyData.user };
        }
      }
    } catch (err: unknown) {
      console.warn("Server-assisted signup failed, falling back to client signup:", err);
    }

    // Client fallback
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          full_name: metadata?.fullName?.trim() || "",
          location: metadata?.location?.trim() || "",
        },
      },
    });

    if (!error && data.session) {
      setSession(data.session);
      setUser(data.user);
    }

    return { error: error as Error | null, user: data.user };
  };

  const signInWithMagicLink = async (email: string) => {
    const cleanEmail = email.trim();

    try {
      // Generate instant OTP and log user in immediately without email delivery wait
      const res = await instantAuthFn({
        data: { email: cleanEmail },
      });

      if (res.otp) {
        const { data: verifyData, error: verifyErr } = await supabase.auth.verifyOtp({
          email: cleanEmail,
          token: res.otp,
          type: "magiclink",
        });

        if (!verifyErr && verifyData.session) {
          setSession(verifyData.session);
          setUser(verifyData.user);
          return { error: null };
        }
      }
    } catch (err: unknown) {
      console.warn("Instant magic link failed, sending email fallback:", err);
    }

    const redirectUrl: string | undefined = typeof window !== "undefined" ? window.location.origin : undefined;
    const { error } = await supabase.auth.signInWithOtp({
      email: cleanEmail,
      ...(redirectUrl ? { options: { emailRedirectTo: redirectUrl } } : {}),
    });
    return { error: error as Error | null };
  };

  const resetPasswordForEmail = async (email: string) => {
    const redirectUrl: string | undefined = typeof window !== "undefined" ? `${window.location.origin}/settings` : undefined;
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      ...(redirectUrl ? { redirectTo: redirectUrl } : {}),
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        isAuthenticated: !!user,
        signInWithPassword,
        signUpWithPassword,
        signInWithMagicLink,
        resetPasswordForEmail,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
