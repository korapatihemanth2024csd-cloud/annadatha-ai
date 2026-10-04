import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Mail, Lock, User, Eye, EyeOff, Sparkles, ArrowRight, CheckCircle2, ShieldCheck, Wheat } from "lucide-react";
import { useAuth } from "@/lib/supabase";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type AuthMode = "signin" | "signup" | "magic" | "forgot";

interface AuthCardProps {
  initialMode?: AuthMode;
  onSuccess?: () => void;
  className?: string;
}

export function AuthCard({ initialMode = "signin", onSuccess, className }: AuthCardProps) {
  const t = useT();
  const { signInWithPassword, signUpWithPassword, signInWithMagicLink, resetPasswordForEmail, user } = useAuth();

  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      toast.error(t("Please enter a valid email address"));
      return;
    }

    setLoading(true);

    try {
      if (mode === "signin") {
        if (!password) {
          toast.error(t("Password"));
          setLoading(false);
          return;
        }
        const { error } = await signInWithPassword(email, password);
        if (error) {
          toast.error(error.message);
        } else {
          toast.success(t("Signed in successfully"));
          onSuccess?.();
        }
      } else if (mode === "signup") {
        if (password.length < 6) {
          toast.error(t("Password must be at least 6 characters"));
          setLoading(false);
          return;
        }
        if (password !== confirmPassword) {
          toast.error(t("Passwords do not match"));
          setLoading(false);
          return;
        }
        const { error, user } = await signUpWithPassword(email, password, { fullName });
        if (error) {
          toast.error(error.message);
        } else {
          toast.success(t("Signed in successfully"));
          onSuccess?.();
        }
      } else if (mode === "magic") {
        const { error } = await signInWithMagicLink(email);
        if (error) {
          toast.error(error.message);
        } else {
          toast.success(t("Signed in successfully"));
          onSuccess?.();
        }
      } else if (mode === "forgot") {
        const { error } = await resetPasswordForEmail(email);
        if (error) {
          toast.error(error.message);
        } else {
          setResetSent(true);
          toast.success(t("Password reset email sent"));
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Authentication error";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (user) {
    return (
      <div className={cn("card-soft p-6 sm:p-8 text-center space-y-4", className)}>
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <ShieldCheck className="h-8 w-8" />
        </div>
        <div>
          <h3 className="font-display text-lg font-bold text-foreground">{t("Signed in as")}</h3>
          <p className="mt-1 text-sm font-medium text-primary break-all">{user.email}</p>
        </div>
        <p className="text-xs text-muted-foreground">
          {t("Stay signed in to save and sync your crop disease analyses across devices.")}
        </p>
      </div>
    );
  }

  return (
    <div className={cn("card-soft p-6 sm:p-8 space-y-6 relative overflow-hidden", className)}>
      {/* Decorative ambient glow */}
      <div className="pointer-events-none absolute -top-12 -right-12 h-36 w-36 rounded-full bg-primary/10 blur-2xl" />

      {/* Header */}
      <div className="space-y-1.5 text-center">
        <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-md">
          <Wheat className="h-6 w-6" />
        </div>
        <h2 className="font-display text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          {mode === "signin" && t("Welcome back")}
          {mode === "signup" && t("Create an account")}
          {mode === "magic" && t("Sign in with Magic Link")}
          {mode === "forgot" && t("Forgot Password?")}
        </h2>
        <p className="text-xs text-muted-foreground sm:text-sm">
          {t("Stay signed in to save and sync your crop disease analyses across devices.")}
        </p>
      </div>

      {/* Tab Switcher for Sign In vs Sign Up */}
      {(mode === "signin" || mode === "signup") && (
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-muted/60 p-1 border border-border/50 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setMode("signin")}
            className={cn(
              "rounded-lg py-2 transition-all text-center",
              mode === "signin"
                ? "bg-card text-foreground shadow-sm font-bold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t("Sign In")}
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={cn(
              "rounded-lg py-2 transition-all text-center",
              mode === "signup"
                ? "bg-card text-foreground shadow-sm font-bold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t("Sign Up")}
          </button>
        </div>
      )}

      {/* Magic link confirmation status */}
      {magicLinkSent ? (
        <div className="space-y-4 rounded-xl border border-primary/20 bg-primary/5 p-5 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary/20 text-primary">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <h4 className="font-semibold text-foreground">{t("Check your email for the login link")}</h4>
            <p className="mt-1 text-xs text-muted-foreground">
              Sent a one-click login link to <span className="font-medium text-foreground">{email}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setMagicLinkSent(false);
              setMode("signin");
            }}
            className="text-xs font-semibold text-primary underline underline-offset-4 hover:opacity-80"
          >
            {t("Back to Sign In")}
          </button>
        </div>
      ) : resetSent ? (
        <div className="space-y-4 rounded-xl border border-primary/20 bg-primary/5 p-5 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary/20 text-primary">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <h4 className="font-semibold text-foreground">{t("Password reset email sent")}</h4>
            <p className="mt-1 text-xs text-muted-foreground">
              Instructions sent to <span className="font-medium text-foreground">{email}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setResetSent(false);
              setMode("signin");
            }}
            className="text-xs font-semibold text-primary underline underline-offset-4 hover:opacity-80"
          >
            {t("Back to Sign In")}
          </button>
        </div>
      ) : (
        /* Main Form */
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-muted-foreground">{t("Full Name")}</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full rounded-xl border border-input bg-card py-2.5 pl-9 pr-3 text-sm text-foreground outline-none backdrop-blur focus:border-primary focus:ring-2 focus:ring-ring/30 transition-all"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-muted-foreground">{t("Email")}</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="farmer@example.com"
                className="w-full rounded-xl border border-input bg-card py-2.5 pl-9 pr-3 text-sm text-foreground outline-none backdrop-blur focus:border-primary focus:ring-2 focus:ring-ring/30 transition-all"
              />
            </div>
          </div>

          {(mode === "signin" || mode === "signup") && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-medium text-muted-foreground">{t("Password")}</label>
                {mode === "signin" && (
                  <button
                    type="button"
                    onClick={() => setMode("forgot")}
                    className="text-xs text-primary hover:underline"
                  >
                    {t("Forgot Password?")}
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-input bg-card py-2.5 pl-9 pr-10 text-sm text-foreground outline-none backdrop-blur focus:border-primary focus:ring-2 focus:ring-ring/30 transition-all"
                />
                <button
                  type="button"
                  aria-label="Toggle password visibility"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          )}

          {mode === "signup" && (
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-muted-foreground">{t("Confirm Password")}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-input bg-card py-2.5 pl-9 pr-3 text-sm text-foreground outline-none backdrop-blur focus:border-primary focus:ring-2 focus:ring-ring/30 transition-all"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 px-4 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 transition-all cursor-pointer"
          >
            {loading ? (
              <span>
                {mode === "signin" && t("Logging in…")}
                {mode === "signup" && t("Signing up…")}
                {(mode === "magic" || mode === "forgot") && t("Sending…")}
              </span>
            ) : (
              <>
                <span>
                  {mode === "signin" && t("Sign In")}
                  {mode === "signup" && t("Sign Up")}
                  {mode === "magic" && t("Send Magic Link")}
                  {mode === "forgot" && t("Send Reset Link")}
                </span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>
      )}

      {/* Alternative Options */}
      {!magicLinkSent && !resetSent && (
        <div className="space-y-3 pt-2 text-center text-xs text-muted-foreground border-t border-border/40">
          {mode === "signin" && (
            <button
              type="button"
              onClick={() => setMode("magic")}
              className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {t("Sign in with Magic Link")}
            </button>
          )}

          {mode === "magic" && (
            <button
              type="button"
              onClick={() => setMode("signin")}
              className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
            >
              {t("Sign in with Password")}
            </button>
          )}

          {mode === "forgot" && (
            <button
              type="button"
              onClick={() => setMode("signin")}
              className="font-medium text-primary hover:underline"
            >
              {t("Back to Sign In")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
