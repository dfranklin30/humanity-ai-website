import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heart, Mail, Phone } from "lucide-react";
import { SiInstagram, SiLinkedin } from "react-icons/si";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export function Footer() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");

  const newsletterMutation = useMutation({
    mutationFn: async (email: string) => {
      await apiRequest("POST", "/api/newsletter", { email });
    },
    onSuccess: () => {
      toast({ title: "Subscribed!", description: "You've been added to our newsletter." });
      setEmail("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message.includes("409") ? "You're already subscribed!" : "Failed to subscribe. Please try again.",
        variant: "destructive",
      });
    },
  });

  return (
    <footer className="relative isolate overflow-hidden bg-[#FBFAF7]/70 backdrop-blur-sm text-[#14201B] border-t border-[#A8751C]/20">
      {/* Topographic dotted line-art — bookends the homepage hero */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <svg
          className="animate-hero-rings absolute left-1/2 top-0 h-[260%] w-[160%] -translate-x-1/2 opacity-[0.12]"
          viewBox="0 0 1000 1000"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          {Array.from({ length: 14 }).map((_, i) => (
            <circle
              key={i}
              cx="500"
              cy="500"
              r={60 + i * 32}
              fill="none"
              stroke="#0E6B4A"
              strokeWidth="1.1"
              strokeDasharray="2 9"
            />
          ))}
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-md bg-[#f0c674] flex items-center justify-center">
                <span className="text-[#FBFAF7] font-serif font-bold">H</span>
              </div>
              <div>
                <div className="font-serif font-bold text-sm">Humanity + AI</div>
                <div className="text-[10px] text-[#14201B]/50 tracking-wider uppercase">Inc.</div>
              </div>
            </div>
            <p className="text-sm text-[#14201B]/65 leading-relaxed">
              Bridging the gap between humanity and artificial intelligence through ethical development, education, and community building.
            </p>
            <div className="flex gap-2 mt-4">
              <Button asChild size="icon" variant="ghost" className="text-[#14201B] hover:bg-[#14201B]/10 hover:text-[#0E6B4A]">
                <a href="https://www.instagram.com/humanity_ai_inc/" target="_blank" rel="noopener noreferrer" data-testid="link-instagram">
                  <SiInstagram className="h-4 w-4" />
                </a>
              </Button>
              <Button asChild size="icon" variant="ghost" className="text-[#14201B] hover:bg-[#14201B]/10 hover:text-[#0E6B4A]">
                <a href="https://www.linkedin.com/company/humanity-plus-ai-inc/" target="_blank" rel="noopener noreferrer" data-testid="link-linkedin">
                  <SiLinkedin className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-sm text-[#0E6B4A] uppercase tracking-wider">Quick Links</h3>
            <div className="flex flex-col gap-2">
              <Link href="/about" className="text-sm text-[#14201B]/65 hover:text-[#14201B] transition-colors" data-testid="link-footer-about">About Us</Link>
              <Link href="/programs" className="text-sm text-[#14201B]/65 hover:text-[#14201B] transition-colors" data-testid="link-footer-programs">Programs</Link>
              <Link href="/blog" className="text-sm text-[#14201B]/65 hover:text-[#14201B] transition-colors" data-testid="link-footer-blog">Blog</Link>
              <Link href="/training" className="text-sm text-[#14201B]/65 hover:text-[#14201B] transition-colors" data-testid="link-footer-training">Learning Hub</Link>
              <Link href="/events" className="text-sm text-[#14201B]/65 hover:text-[#14201B] transition-colors" data-testid="link-footer-events">Events</Link>
              <Link href="/donate" className="text-sm text-[#A8751C] font-semibold hover:text-[#A8751C]/80 transition-colors" data-testid="link-footer-donate">Become a Member</Link>
              <Link href="/privacy" className="text-sm text-[#14201B]/65 hover:text-[#14201B] transition-colors" data-testid="link-footer-privacy">Privacy Policy</Link>
              <Link href="/terms" className="text-sm text-[#14201B]/65 hover:text-[#14201B] transition-colors" data-testid="link-footer-terms">Terms of Service</Link>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-sm text-[#0E6B4A] uppercase tracking-wider">Contact</h3>
            <div className="flex flex-col gap-3">
              <a href="mailto:danielle@humanityplusai.org" className="flex items-center gap-2 text-sm text-[#14201B]/65 hover:text-[#14201B] transition-colors" data-testid="link-email">
                <Mail className="h-4 w-4 shrink-0" />
                danielle@humanityplusai.org
              </a>
              <a href="tel:8086522090" className="flex items-center gap-2 text-sm text-[#14201B]/65 hover:text-[#14201B] transition-colors" data-testid="link-phone">
                <Phone className="h-4 w-4 shrink-0" />
                (808) 652-2090
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-sm text-[#0E6B4A] uppercase tracking-wider">Newsletter</h3>
            <p className="text-sm text-[#14201B]/65 mb-3">Stay updated on our latest initiatives and events.</p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (email) newsletterMutation.mutate(email);
              }}
              className="flex gap-2"
            >
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="text-sm bg-[#14201B]/5 border-[#14201B]/20 text-[#14201B] placeholder:text-[#14201B]/40"
                data-testid="input-newsletter-email"
              />
              <Button
                type="submit"
                size="sm"
                disabled={newsletterMutation.isPending}
                className="bg-[#f0c674] text-[#FBFAF7] hover:bg-[#f0c674]/90"
                data-testid="button-newsletter-subscribe"
              >
                <Mail className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>

        <div className="border-t border-[#14201B]/15 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[#14201B]/50">
            &copy; {new Date().getFullYear()} Humanity + AI, Inc. All rights reserved.
          </p>
          <p className="text-xs text-[#14201B]/50 flex items-center gap-1">
            Made with <Heart className="h-3 w-3 text-[#A8751C] fill-current" /> for humanity
          </p>
        </div>
      </div>
    </footer>
  );
}
