import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, UserPlus, Sparkles, ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

export default function SignupPage() {
  const { register } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    displayName: "",
    username: "",
    email: "",
    password: "",
    bio: "",
    title: "",
    organization: "",
  });

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((s) => ({ ...s, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await register({
        ...form,
        bio: form.bio || undefined,
        title: form.title || undefined,
        organization: form.organization || undefined,
      });
      toast({
        title: "Account created",
        description:
          "You can now write and publish articles. Add an avatar from your dashboard.",
      });
      navigate("/author/dashboard");
    } catch (err: any) {
      toast({
        title: "Sign up failed",
        description:
          err?.message?.replace(/^\d+:\s*/, "") ||
          "Please check your details.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "rounded-none border-foreground/20 focus-visible:ring-primary";
  const labelClass =
    "text-xs uppercase tracking-widest font-bold text-muted-foreground";

  return (
    <div className="font-sans bg-[#FAF9F6] dark:bg-background text-foreground min-h-screen selection:bg-primary/20 selection:text-primary">
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-12 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch">
          {/* Left: Editorial Welcome */}
          <div className="lg:col-span-5 flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-foreground/10 pb-12 lg:pb-0 lg:pr-12">
            <div className="text-xs font-semibold tracking-[0.2em] uppercase text-muted-foreground flex items-center gap-2 mb-6">
              <Sparkles className="h-3 w-3" />
              Become a Contributor
              <Sparkles className="h-3 w-3" />
            </div>
            <h1
              className="font-serif text-5xl md:text-6xl leading-[1.05] tracking-tight font-bold text-foreground mb-8"
              data-testid="text-signup-title"
            >
              Join the{" "}
              <span className="italic font-light text-primary">community.</span>
            </h1>
            <p className="font-serif text-lg text-muted-foreground leading-relaxed mb-8">
              Create an account to publish on the Humanity + AI thought
              leadership blog. Share research, perspective, and practical
              insight with a community shaping responsible AI.
            </p>
            <div className="space-y-4 border-t border-foreground/10 pt-6">
              <div className="flex items-baseline justify-between border-b border-foreground/10 pb-3">
                <span className="text-xs uppercase tracking-widest font-bold text-muted-foreground">
                  Open
                </span>
                <span className="font-serif text-base text-foreground italic">
                  Every voice welcome
                </span>
              </div>
              <div className="flex items-baseline justify-between border-b border-foreground/10 pb-3">
                <span className="text-xs uppercase tracking-widest font-bold text-muted-foreground">
                  Free
                </span>
                <span className="font-serif text-base text-foreground italic">
                  No paywalls, no gatekeeping
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-xs uppercase tracking-widest font-bold text-muted-foreground">
                  Yours
                </span>
                <span className="font-serif text-base text-foreground italic">
                  Own your byline & profile
                </span>
              </div>
            </div>
          </div>

          {/* Right: Form */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            <div className="border border-foreground/10 bg-white dark:bg-card p-8 md:p-10 relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-primary" />
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 border border-foreground/10 flex items-center justify-center text-primary">
                  <UserPlus className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
                    Issue 01
                  </div>
                  <div className="font-serif text-xl font-bold leading-tight">
                    Create account
                  </div>
                </div>
              </div>

              <form
                onSubmit={onSubmit}
                className="grid grid-cols-1 sm:grid-cols-2 gap-5"
              >
                <div className="space-y-2">
                  <Label htmlFor="signup-fullname" className={labelClass}>
                    Full name *
                  </Label>
                  <Input
                    id="signup-fullname"
                    data-testid="input-signup-fullname"
                    value={form.fullName}
                    onChange={(e) => update("fullName", e.target.value)}
                    required
                    className={inputClass}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-displayname" className={labelClass}>
                    Display name *
                  </Label>
                  <Input
                    id="signup-displayname"
                    data-testid="input-signup-displayname"
                    value={form.displayName}
                    onChange={(e) => update("displayName", e.target.value)}
                    required
                    className={inputClass}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-username" className={labelClass}>
                    Username *
                  </Label>
                  <Input
                    id="signup-username"
                    data-testid="input-signup-username"
                    value={form.username}
                    onChange={(e) => update("username", e.target.value)}
                    required
                    minLength={3}
                    className={inputClass}
                  />
                  <p className="text-xs text-muted-foreground font-serif italic">
                    Letters, numbers, _ or -. Used in your profile URL.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email" className={labelClass}>
                    Email *
                  </Label>
                  <Input
                    id="signup-email"
                    type="email"
                    data-testid="input-signup-email"
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    required
                    className={inputClass}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="signup-password" className={labelClass}>
                    Password *
                  </Label>
                  <Input
                    id="signup-password"
                    type="password"
                    autoComplete="new-password"
                    data-testid="input-signup-password"
                    value={form.password}
                    onChange={(e) => update("password", e.target.value)}
                    required
                    minLength={8}
                    className={inputClass}
                  />
                  <p className="text-xs text-muted-foreground font-serif italic">
                    At least 8 characters.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-title" className={labelClass}>
                    Title (optional)
                  </Label>
                  <Input
                    id="signup-title"
                    data-testid="input-signup-title"
                    value={form.title}
                    onChange={(e) => update("title", e.target.value)}
                    placeholder="e.g. AI Researcher"
                    className={inputClass}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-org" className={labelClass}>
                    Organization (optional)
                  </Label>
                  <Input
                    id="signup-org"
                    data-testid="input-signup-org"
                    value={form.organization}
                    onChange={(e) => update("organization", e.target.value)}
                    placeholder="e.g. Stanford"
                    className={inputClass}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="signup-bio" className={labelClass}>
                    Short bio (optional)
                  </Label>
                  <Textarea
                    id="signup-bio"
                    data-testid="input-signup-bio"
                    value={form.bio}
                    onChange={(e) => update("bio", e.target.value)}
                    placeholder="Tell readers a bit about yourself"
                    maxLength={500}
                    rows={3}
                    className={inputClass}
                  />
                </div>
                <div className="sm:col-span-2 pt-2">
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full rounded-none font-serif italic tracking-wide"
                    disabled={submitting}
                    data-testid="button-submit-signup"
                  >
                    {submitting && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    Create account
                    {!submitting && <ArrowRight className="h-4 w-4 ml-2" />}
                  </Button>
                </div>
              </form>

              <div className="mt-8 pt-6 border-t border-foreground/10 text-center">
                <p className="text-xs uppercase tracking-widest font-bold text-muted-foreground mb-3">
                  Already have an account?
                </p>
                <Link
                  href="/login"
                  className="font-serif italic text-primary hover:underline inline-flex items-center gap-2"
                  data-testid="link-to-login"
                >
                  Sign in
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
