import { PageMeta } from "@/components/page-meta";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Heart, DollarSign, Shield, Users, BookOpen, Sparkles,
  CheckCircle, ArrowRight, Building2
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { EditorialMasthead } from "@/components/editorial-masthead";
import { type CampaignProgress } from "@/components/campaign-meter";

const donationSchema = z.object({
  donorName: z.string().min(1, "Name is required"),
  donorEmail: z.string().email("Invalid email"),
  amount: z.number().min(1, "Amount must be at least $1"),
  message: z.string().optional(),
  isRecurring: z.boolean().default(false),
});

type DonationForm = z.infer<typeof donationSchema>;

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5 },
};

const amounts = [25, 50, 100, 250, 500, 1000];

const impactAreas = [
  { icon: Shield, title: "AI Ethics Research", desc: "Fund research into responsible AI frameworks and governance." },
  { icon: BookOpen, title: "Education Programs", desc: "Support AI literacy workshops and community education." },
  { icon: Users, title: "Community Building", desc: "Help us expand our mentorship and networking programs." },
  { icon: Heart, title: "Animal Welfare", desc: "Contribute to Project ROSIE and interspecies research." },
];

const membershipTiers = [
  {
    id: "supporter",
    name: "Supporter",
    price: 10,
    tagline: "Stay close to the work and keep learning alongside our community.",
    perks: ["Exclusive webinars", "Podcast recordings", "AI resources"],
    includes: "",
    featured: false,
  },
  {
    id: "professional",
    name: "Professional",
    price: 25,
    tagline: "Grow your network and your toolkit with hands-on member resources.",
    perks: ["Networking events", "AI toolkits", "Certification discounts"],
    includes: "Supporter",
    featured: true,
  },
  {
    id: "executive",
    name: "Executive",
    price: 99,
    tagline: "A seat at the table with the leaders shaping responsible AI.",
    perks: ["Leadership roundtables", "Private discussions", "Speaker access"],
    includes: "Professional",
    featured: false,
  },
];

export default function Donate() {
  const { toast } = useToast();
  const [selectedAmount, setSelectedAmount] = useState<number | null>(100);
  const [customAmount, setCustomAmount] = useState("");
  const [success, setSuccess] = useState(false);
  const [memberOpen, setMemberOpen] = useState(false);
  const [memberTierId, setMemberTierId] = useState<string>("professional");
  const [memberName, setMemberName] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const activeTier = membershipTiers.find((t) => t.id === memberTierId) ?? membershipTiers[0];

  const { data: stats } = useQuery<{ total: number; count: number }>({
    queryKey: ["/api/donations/stats"],
  });

  const [campaignSlug] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("campaign") || "";
  });
  const { data: campaigns } = useQuery<CampaignProgress[]>({ queryKey: ["/api/campaigns"] });
  const selectedCampaign = campaigns?.find((c) => c.slug === campaignSlug);

  const form = useForm<DonationForm>({
    resolver: zodResolver(donationSchema),
    defaultValues: {
      donorName: "",
      donorEmail: "",
      amount: 100,
      message: "",
      isRecurring: false,
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: DonationForm) => {
      const res = await apiRequest("POST", "/api/donations/checkout", { ...data, campaignSlug });
      return (await res.json()) as { url?: string; error?: string };
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast({ title: "Error", description: data.error || "Could not start checkout.", variant: "destructive" });
      }
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to start checkout. Please try again.", variant: "destructive" });
    },
  });

  const membershipMutation = useMutation({
    mutationFn: async (data: { donorName: string; donorEmail: string; membershipTier: string }) => {
      const res = await apiRequest("POST", "/api/donations/checkout", { ...data, membership: true });
      return (await res.json()) as { url?: string; error?: string };
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast({ title: "Error", description: data.error || "Could not start membership checkout.", variant: "destructive" });
      }
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to start checkout. Please try again.", variant: "destructive" });
    },
  });

  const openMembership = (tierId: string) => {
    setMemberTierId(tierId);
    setMemberOpen(true);
  };

  const scrollToTiers = () => {
    document.getElementById("membership-tiers")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleMembershipSubmit = () => {
    if (!memberName.trim()) {
      toast({ title: "Name required", description: "Please enter your organization or full name.", variant: "destructive" });
      return;
    }
    if (!memberEmail.includes("@")) {
      toast({ title: "Valid email required", description: "Please enter a valid email address.", variant: "destructive" });
      return;
    }
    membershipMutation.mutate({ donorName: memberName.trim(), donorEmail: memberEmail.trim(), membershipTier: activeTier.id });
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("canceled")) {
      toast({ title: "Donation canceled", description: "No payment was made. You can try again anytime." });
      window.history.replaceState({}, "", "/donate");
      return;
    }
    const sessionId = params.get("session_id");
    if (params.get("success") && sessionId) {
      setSuccess(true);
      window.history.replaceState({}, "", "/donate");
      apiRequest("GET", `/api/donations/verify?session_id=${encodeURIComponent(sessionId)}`)
        .then(() => queryClient.invalidateQueries({ queryKey: ["/api/donations/stats"] }))
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount("");
    form.setValue("amount", amount);
  };

  const handleCustomAmount = (value: string) => {
    setCustomAmount(value);
    setSelectedAmount(null);
    const num = parseInt(value);
    if (!isNaN(num) && num > 0) {
      form.setValue("amount", num);
    }
  };

  if (success) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="text-center max-w-md"
        >
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className="font-serif text-2xl font-bold mb-3 text-white" data-testid="text-donation-success">Thank You!</h2>
          <p className="text-white/70 mb-6">
            Your generous donation helps us continue our mission of bridging humanity and AI. Together, we're making a difference.
          </p>
          <Button onClick={() => setSuccess(false)} variant="outline" className="gap-2 text-white hover:text-white border-white/25" data-testid="button-donate-again">
            <Heart className="h-4 w-4" />
            Make Another Donation
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div>
      <PageMeta
        title="Donate — Support Ethical AI for All"
        description="Support Humanity + AI, Inc. with a tax-deductible donation. Fund AI education, ethics programs, and community empowerment initiatives that make AI accessible to everyone."
        canonical="/donate"
      />
      <EditorialMasthead kicker="Support Our Mission" title="Donate" tagline="Power AI for Good" />
      <section className="py-20 bg-gradient-to-br from-primary/5 via-background to-accent/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeIn} className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Heart className="h-3.5 w-3.5" />
              Support Our Mission
            </div>
            <h1 className="font-serif text-4xl lg:text-5xl font-bold tracking-tight leading-[1.1] mb-6" data-testid="text-donate-title">
              Make a <span className="text-primary">Difference</span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Your tax-deductible donation directly supports our research, education programs, and community initiatives. Every contribution helps shape a better future.
            </p>
          </motion.div>
        </div>
      </section>

      <section id="membership-tiers" className="py-20 border-b border-border" data-testid="section-membership-tiers">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeIn} className="max-w-3xl mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-400/10 text-emerald-300 text-sm font-medium mb-6">
              <Sparkles className="h-3.5 w-3.5" />
              Membership Program
            </div>
            <h2 className="font-serif text-3xl lg:text-4xl font-bold tracking-tight leading-[1.1] mb-5 text-white" data-testid="text-membership-title">
              Join the community at the{" "}
              <span className="text-emerald-300">level that fits you</span>
            </h2>
            <p className="text-lg text-white/70 leading-relaxed">
              Become a member and power our mission while unlocking benefits that
              grow at every tier. Choose a monthly plan below — cancel anytime.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 items-stretch">
            {membershipTiers.map((tier, i) => (
              <motion.div
                key={tier.id}
                {...fadeIn}
                transition={{ delay: i * 0.08, duration: 0.5 }}
                className="h-full"
              >
                <Card
                  className={`relative p-8 h-full flex flex-col ${tier.featured ? "border-primary border-2 shadow-lg" : ""}`}
                  data-testid={`card-tier-${tier.id}`}
                >
                  {tier.featured && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider px-3 py-1">
                      Most Popular
                    </span>
                  )}
                  <h3 className="font-serif text-2xl font-bold mb-1" data-testid={`text-tier-name-${tier.id}`}>{tier.name}</h3>
                  <div className="flex items-baseline gap-1 mb-3">
                    <span className="font-serif text-4xl font-bold" data-testid={`text-tier-price-${tier.id}`}>${tier.price}</span>
                    <span className="text-sm text-muted-foreground">/ month</span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-5">{tier.tagline}</p>
                  {tier.includes && (
                    <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-3">
                      Everything in {tier.includes}, plus:
                    </p>
                  )}
                  <ul className="space-y-3 mb-8">
                    {tier.perks.map((perk) => (
                      <li key={perk} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <span>{perk}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full gap-2 mt-auto"
                    size="lg"
                    variant={tier.featured ? "default" : "outline"}
                    onClick={() => openMembership(tier.id)}
                    data-testid={`button-join-${tier.id}`}
                  >
                    Join {tier.name}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Card>
              </motion.div>
            ))}
          </div>

          <p className="text-sm text-white/70 mt-8 text-center">
            Cancel anytime. Secure checkout powered by Stripe.
          </p>

          <Dialog open={memberOpen} onOpenChange={setMemberOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-serif" data-testid="text-dialog-tier-title">
                  Join the {activeTier.name} tier
                </DialogTitle>
                <DialogDescription>
                  ${activeTier.price}/month, billed monthly. You can cancel anytime. Secure checkout powered by Stripe.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div>
                  <Label htmlFor="member-name" className="mb-2 block">Organization or Full Name</Label>
                  <Input
                    id="member-name"
                    placeholder="Acme Foundation"
                    value={memberName}
                    onChange={(e) => setMemberName(e.target.value)}
                    data-testid="input-member-name"
                  />
                </div>
                <div>
                  <Label htmlFor="member-email" className="mb-2 block">Email</Label>
                  <Input
                    id="member-email"
                    type="email"
                    placeholder="contact@organization.org"
                    value={memberEmail}
                    onChange={(e) => setMemberEmail(e.target.value)}
                    data-testid="input-member-email"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  className="w-full gap-2"
                  size="lg"
                  onClick={handleMembershipSubmit}
                  disabled={membershipMutation.isPending}
                  data-testid="button-submit-membership"
                >
                  {membershipMutation.isPending ? "Processing..." : (
                    <>
                      Join for ${activeTier.price}/month
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-5 gap-12">
            <motion.div {...fadeIn} className="lg:col-span-3">
              <Card className="p-8">
                <h2 className="font-serif text-xl font-bold mb-6">Your Donation</h2>

                {selectedCampaign && (
                  <div
                    className="mb-6 border border-primary/30 bg-primary/5 p-4 flex items-start gap-3"
                    data-testid="banner-selected-campaign"
                  >
                    <Heart className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary mb-1">
                        Supporting Campaign
                      </p>
                      <p className="font-serif text-lg font-bold leading-tight" data-testid="text-selected-campaign">
                        {selectedCampaign.title}
                      </p>
                      {selectedCampaign.description && (
                        <p className="text-sm text-muted-foreground mt-1">{selectedCampaign.description}</p>
                      )}
                    </div>
                  </div>
                )}

                <div className="mb-6">
                  <Label className="text-sm font-medium mb-3 block">Select Amount</Label>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {amounts.map((amount) => (
                      <button
                        key={amount}
                        type="button"
                        onClick={() => handleAmountSelect(amount)}
                        className={`py-3 rounded-md text-sm font-semibold transition-colors ${
                          selectedAmount === amount
                            ? "bg-primary text-primary-foreground"
                            : "bg-accent text-accent-foreground hover-elevate"
                        }`}
                        data-testid={`button-amount-${amount}`}
                      >
                        ${amount}
                      </button>
                    ))}
                  </div>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      placeholder="Custom amount"
                      value={customAmount}
                      onChange={(e) => handleCustomAmount(e.target.value)}
                      className="pl-9"
                      data-testid="input-custom-amount"
                    />
                  </div>
                </div>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-5">
                    <FormField
                      control={form.control}
                      name="donorName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Your full name" {...field} data-testid="input-donor-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="donorEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="your@email.com" {...field} data-testid="input-donor-email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Message (Optional)</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Leave a message with your donation..." rows={3} {...field} data-testid="input-donor-message" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="isRecurring"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-md border p-4">
                          <div>
                            <FormLabel className="text-sm font-medium">Monthly Recurring</FormLabel>
                            <p className="text-xs text-muted-foreground mt-0.5">Make this a monthly contribution</p>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="switch-recurring"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full gap-2" size="lg" disabled={mutation.isPending} data-testid="button-submit-donation">
                      {mutation.isPending ? (
                        <>Processing...</>
                      ) : (
                        <>
                          <Heart className="h-4 w-4" />
                          Donate ${form.watch("amount") || 0}
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-center text-muted-foreground">
                      Secure checkout powered by Stripe. Humanity + AI, Inc. is a 501(c)(3) nonprofit — your donation is tax-deductible.
                    </p>
                  </form>
                </Form>
              </Card>
            </motion.div>

            <motion.div {...fadeIn} transition={{ delay: 0.2, duration: 0.5 }} className="lg:col-span-2 space-y-6">
              <Card className="p-6 border-primary/40 bg-gradient-to-br from-primary/10 via-background to-accent/10">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-9 h-9 rounded-md bg-primary/15 flex items-center justify-center shrink-0">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-primary">Membership Program</span>
                </div>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="font-serif text-3xl font-bold" data-testid="text-membership-price">From $10</span>
                  <span className="text-sm text-muted-foreground">/ month</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  Three tiers of support with benefits that grow at every level —
                  join our community while powering our mission.
                </p>
                <ul className="space-y-2 mb-5">
                  {membershipTiers.map((tier) => (
                    <li key={tier.id} className="flex items-center justify-between gap-2 text-sm">
                      <span className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                        {tier.name}
                      </span>
                      <span className="font-semibold">${tier.price}/mo</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full gap-2"
                  size="lg"
                  onClick={scrollToTiers}
                  data-testid="button-open-membership"
                >
                  <Building2 className="h-4 w-4" />
                  Choose a Plan
                </Button>
              </Card>

              {stats && (
                <Card className="p-6 bg-primary text-primary-foreground">
                  <h3 className="font-semibold mb-2">Donation Impact</h3>
                  <div className="text-3xl font-serif font-bold mb-1" data-testid="text-total-donated">
                    ${(stats.total / 100).toLocaleString()}
                  </div>
                  <p className="text-sm text-primary-foreground/70">
                    raised from {stats.count} {stats.count === 1 ? "donor" : "donors"}
                  </p>
                </Card>
              )}

              <Card className="p-6">
                <h3 className="font-semibold mb-4">Your Impact</h3>
                <div className="space-y-4">
                  {impactAreas.map((area, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                        <area.icon className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{area.title}</p>
                        <p className="text-xs text-muted-foreground">{area.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-6 bg-accent/50">
                <Sparkles className="h-5 w-5 text-primary mb-2" />
                <h3 className="font-semibold mb-2 text-sm">Every Dollar Counts</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  100% of your donation goes directly to supporting our programs, research, and community initiatives.
                </p>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
