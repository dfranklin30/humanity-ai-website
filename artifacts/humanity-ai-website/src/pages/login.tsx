import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, LogIn, Sparkles, ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const { login } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login({ username, password });
      toast({ title: "Welcome back" });
      navigate("/author/dashboard");
    } catch (err: any) {
      toast({
        title: "Sign in failed",
        description:
          err?.message?.replace(/^\d+:\s*/, "") ||
          "Please check your credentials.",
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
          {/* Left: Editorial Welcome */}
          <div className="lg:col-span-7 flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-foreground/10 pb-12 lg:pb-0 lg:pr-12">
            <div className="text-xs font-semibold tracking-[0.2em] uppercase text-muted-foreground flex items-center gap-2 mb-6">
              <Sparkles className="h-3 w-3" />
              Member Sign In
              <Sparkles className="h-3 w-3" />
            </div>
            <h1
              className="font-serif text-5xl md:text-7xl leading-[1.05] tracking-tight font-bold text-foreground mb-8"
              data-testid="text-login-title"
            >
              Welcome <span className="italic font-light text-primary">back.</span>
            </h1>
            <p className="font-serif text-xl text-muted-foreground leading-relaxed max-w-xl mb-8">
              Sign in to write, publish, and contribute to the Humanity + AI
              thought leadership library — a growing collection of voices
              shaping responsible AI.
            </p>
            <div className="flex items-center gap-3 text-xs uppercase tracking-widest font-bold text-muted-foreground border-t border-foreground/10 pt-6">
              <span>The Library</span>
              <span>•</span>
              <span>Open Access</span>
              <span>•</span>
              <span>Every Voice</span>
            </div>
          </div>

          {/* Right: Form */}
          <div className="lg:col-span-5 flex flex-col justify-center">
            <div className="border border-foreground/10 bg-white dark:bg-card p-8 md:p-10 relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-primary" />
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 border border-foreground/10 flex items-center justify-center text-primary">
                  <LogIn className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
                    Issue 01
                  </div>
                  <div className="font-serif text-xl font-bold leading-tight">
                    Sign in
                  </div>
                </div>
              </div>

              <form onSubmit={onSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label
                    htmlFor="login-username"
                    className="text-xs uppercase tracking-widest font-bold text-muted-foreground"
                  >
                    Username or email
                  </Label>
                  <Input
                    id="login-username"
                    data-testid="input-login-username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                    required
                    className="rounded-none border-foreground/20 focus-visible:ring-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="login-password"
                    className="text-xs uppercase tracking-widest font-bold text-muted-foreground"
                  >
                    Password
                  </Label>
                  <Input
                    id="login-password"
                    type="password"
                    data-testid="input-login-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                    className="rounded-none border-foreground/20 focus-visible:ring-primary"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full rounded-none font-serif italic tracking-wide"
                  size="lg"
                  disabled={submitting}
                  data-testid="button-submit-login"
                >
                  {submitting && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Sign in
                  {!submitting && <ArrowRight className="h-4 w-4 ml-2" />}
                </Button>
                <div className="text-center">
                  <Link
                    href="/forgot-password"
                    className="text-xs uppercase tracking-widest font-bold text-muted-foreground hover:text-primary transition-colors"
                    data-testid="link-forgot-password"
                  >
                    Forgot password?
                  </Link>
                </div>
              </form>

              <div className="mt-8 pt-6 border-t border-foreground/10 text-center">
                <p className="text-xs uppercase tracking-widest font-bold text-muted-foreground mb-3">
                  New here?
                </p>
                <Link
                  href="/signup"
                  className="font-serif italic text-primary hover:underline inline-flex items-center gap-2"
                  data-testid="link-to-signup"
                >
                  Create an account
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
