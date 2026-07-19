import { useState, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, KeyRound, Sparkles, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function ResetPasswordPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const token = useMemo(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("token") || "";
  }, []);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      toast({
        title: "Passwords don't match",
        description: "Please re-enter both fields.",
        variant: "destructive",
      });
      return;
    }
    if (password.length < 8) {
      toast({
        title: "Password too short",
        description: "Use at least 8 characters.",
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);
    try {
      await apiRequest("POST", "/api/auth/reset-password", { token, password });
      setDone(true);
    } catch (err: any) {
      toast({
        title: "Reset failed",
        description: err?.message?.replace(/^\d+:\s*/, "") || "Please request a new reset link.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="font-sans bg-[#FAF9F6] dark:bg-background text-foreground min-h-screen selection:bg-primary/20 selection:text-primary">
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-12 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch">
          <div className="lg:col-span-7 flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-foreground/10 pb-12 lg:pb-0 lg:pr-12">
            <div className="text-xs font-semibold tracking-[0.2em] uppercase text-muted-foreground flex items-center gap-2 mb-6">
              <Sparkles className="h-3 w-3" />
              Account Recovery
              <Sparkles className="h-3 w-3" />
            </div>
            <h1
              className="font-serif text-5xl md:text-7xl leading-[1.05] tracking-tight font-bold text-foreground mb-8"
              data-testid="text-reset-title"
            >
              Set a new <span className="italic font-light text-primary">password.</span>
            </h1>
            <p className="font-serif text-xl text-muted-foreground leading-relaxed max-w-xl mb-8">
              Choose something memorable but hard to guess. Once you save it,
              you'll be able to sign in with the new password right away.
            </p>
            <div className="flex items-center gap-3 text-xs uppercase tracking-widest font-bold text-muted-foreground border-t border-foreground/10 pt-6">
              <span>Min 8 chars</span>
              <span>•</span>
              <span>Stored encrypted</span>
              <span>•</span>
              <span>Take care</span>
            </div>
          </div>

          <div className="lg:col-span-5 flex flex-col justify-center">
            <div className="border border-foreground/10 bg-white dark:bg-card p-8 md:p-10 relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-primary" />
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 border border-foreground/10 flex items-center justify-center text-primary">
                  <KeyRound className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
                    Step 02
                  </div>
                  <div className="font-serif text-xl font-bold leading-tight">
                    New password
                  </div>
                </div>
              </div>

              {!token ? (
                <div className="space-y-5" data-testid="reset-no-token">
                  <div className="flex items-center justify-center w-14 h-14 mx-auto border border-foreground/10 text-destructive">
                    <AlertCircle className="h-6 w-6" />
                  </div>
                  <h2 className="font-serif text-2xl font-bold text-center">Missing reset link</h2>
                  <p className="text-sm text-muted-foreground text-center leading-relaxed">
                    This page needs a reset token from the email we sent. Please open
                    the link from your inbox, or request a new one.
                  </p>
                  <Link href="/forgot-password">
                    <Button className="w-full rounded-none font-serif italic" size="lg" data-testid="button-request-new-link">
                      Request a new link
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              ) : done ? (
                <div className="space-y-5" data-testid="reset-success">
                  <div className="flex items-center justify-center w-14 h-14 mx-auto border border-foreground/10 text-primary">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <h2 className="font-serif text-2xl font-bold text-center">Password updated</h2>
                  <p className="text-sm text-muted-foreground text-center leading-relaxed">
                    You can now sign in with your new password.
                  </p>
                  <Button
                    type="button"
                    className="w-full rounded-none font-serif italic"
                    size="lg"
                    onClick={() => navigate("/login")}
                    data-testid="button-go-to-login"
                  >
                    Go to sign in
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              ) : (
                <form onSubmit={onSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label
                      htmlFor="reset-password"
                      className="text-xs uppercase tracking-widest font-bold text-muted-foreground"
                    >
                      New password
                    </Label>
                    <Input
                      id="reset-password"
                      type="password"
                      data-testid="input-reset-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="new-password"
                      required
                      minLength={8}
                      className="rounded-none border-foreground/20 focus-visible:ring-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="reset-confirm"
                      className="text-xs uppercase tracking-widest font-bold text-muted-foreground"
                    >
                      Confirm password
                    </Label>
                    <Input
                      id="reset-confirm"
                      type="password"
                      data-testid="input-reset-confirm"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      autoComplete="new-password"
                      required
                      minLength={8}
                      className="rounded-none border-foreground/20 focus-visible:ring-primary"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full rounded-none font-serif italic tracking-wide"
                    size="lg"
                    disabled={submitting}
                    data-testid="button-submit-reset"
                  >
                    {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Save new password
                    {!submitting && <ArrowRight className="h-4 w-4 ml-2" />}
                  </Button>
                </form>
              )}

              <div className="mt-8 pt-6 border-t border-foreground/10 text-center">
                <Link
                  href="/login"
                  className="font-serif italic text-primary hover:underline inline-flex items-center gap-2 text-sm"
                  data-testid="link-back-to-login-2"
                >
                  Back to sign in
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
