import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AuthCard } from "@/components/AuthCard";
import { useAuth } from "@/lib/supabase";
import { useT } from "@/lib/i18n";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign In — Annadatha AI" },
      { name: "description", content: "Sign in or sign up with email to sync your crop disease detection and diagnosis." },
      { property: "og:title", content: "Sign In — Annadatha AI" },
      { property: "og:description", content: "Access your personalized agricultural intelligence workspace." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const t = useT();

  useEffect(() => {
    // If user is already authenticated, allow them to view status or return
  }, [user]);

  return (
    <div className="flex min-h-[75vh] flex-col items-center justify-center px-4 py-8">
      <div className="mb-4 w-full max-w-md flex items-center justify-between">
        <button
          onClick={() => navigate({ to: "/" })}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>{t("Go home")}</span>
        </button>
      </div>

      <div className="w-full max-w-md">
        {user ? (
          <div className="card-soft p-8 text-center space-y-5">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <span className="text-xl font-bold">{user.email?.charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <h2 className="text-xl font-bold font-display">{t("Farmer Account")}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{t("Signed in as")}</p>
              <p className="mt-0.5 font-medium text-primary break-all">{user.email}</p>
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <Button onClick={() => navigate({ to: "/" })} className="w-full">
                {t("Go home")}
              </Button>
              <Button variant="outline" onClick={() => signOut()} className="w-full">
                {t("Sign Out")}
              </Button>
            </div>
          </div>
        ) : (
          <AuthCard onSuccess={() => navigate({ to: "/" })} />
        )}
      </div>
    </div>
  );
}
