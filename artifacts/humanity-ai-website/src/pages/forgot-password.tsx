import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, KeyRound, Sparkles, ArrowRight, Mail } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiRequest("POST", "/api/auth/forgot-password", { email });
      setSubmitted(true);
    } catch (err: any) {
      toast({
        title: "Couldn't send reset link",
        description: err?.message?.replace(/^\d+:\s*/, "") || "Please try again.",
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
              data-testid="text-forgot-title"
            >
              Forgot your <span className="italic font-light text-primary">password?</span>
            </h1>
            <p className="font-serif text-xl text-muted-foreground leading-relaxed max-w-xl mb-8">
              No problem. Enter the email address on your Humanity + AI account and
              we'll send you a secure link to set a new password. The link is good
              for one hour.
            </p>
            <div className="flex items-center gap-3 text-xs uppercase tracking-widest font-bold text-muted-foreground border-t border-foreground/10 pt-6">
              <span>Secure</span>
              <span>•</span>
              <span>One-Time Link</span>
              <span>•</span>
              <span>Expires in 1 hour</span>
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
                    Step 01
                  </div>
                  <div className="font-serif text-xl font-bold leading-tight">
                    Reset password
                  </div>
                </div>
              </div>

              {submitted ? (
                <div className="space-y-5" data-testid="forgot-success">
                  <div className="flex items-center justify-center w-14 h-14 mx-auto border border-foreground/10 text-primary">
                    <Mail className="h-6 w-6" />
                  </div>
                  <h2 className="font-serif text-2xl font-bold text-center">Check your inbox</h2>
                  <p className="text-sm text-muted-foreground text-center leading-relaxed">
                    If an account exists for <span className="font-semibold text-foreground">{email}</span>,
                    we've sent a password reset link. It will expire in one hour.
                  </p>
                  <p className="text-xs text-muted-foreground text-center leading-relaxed pt-2 border-t border-foreground/10">
                    Didn't get it? Check your spam folder, or try again with a different email.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full rounded-none"
                    onClick={() => { setSubmitted(false); setEmail(""); }}
                    data-testid="button-forgot-try-again"
                  >
                    Try another email
                  </Button>
                </div>
              ) : (
                <form onSubmit={onSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label
                      htmlFor="forgot-email"
                      className="text-xs uppercase tracking-widest font-bold text-muted-foreground"
                    >
                      Email address
                    </Label>
                    <Input
                      id="forgot-email"
                      type="email"
                      data-testid="input-forgot-email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      required
                      className="rounded-none border-foreground/20 focus-visible:ring-primary"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full rounded-none font-serif italic tracking-wide"
                    size="lg"
                    disabled={submitting}
                    data-testid="button-submit-forgot"
                  >
                    {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Send reset link
                    {!submitting && <ArrowRight className="h-4 w-4 ml-2" />}
                  </Button>
                </form>
              )}

              <div className="mt-8 pt-6 border-t border-foreground/10 text-center">
                <p className="text-xs uppercase tracking-widest font-bold text-muted-foreground mb-3">
                  Remembered it?
                </p>
                <Link
                  href="/login"
                  className="font-serif italic text-primary hover:underline inline-flex items-center gap-2"
                  data-testid="link-back-to-login"
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
