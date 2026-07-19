import { PageMeta } from "@/components/page-meta";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, Phone, MapPin, Send, CheckCircle } from "lucide-react";
import { SiInstagram, SiLinkedin } from "react-icons/si";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { EditorialMasthead } from "@/components/editorial-masthead";

const contactSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

type ContactForm = z.infer<typeof contactSchema>;

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5 },
};

export default function Contact() {
  const { toast } = useToast();

  const form = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
    defaultValues: { firstName: "", lastName: "", email: "", message: "" },
  });

  const mutation = useMutation({
    mutationFn: async (data: ContactForm) => {
      await apiRequest("POST", "/api/contact", data);
    },
    onSuccess: () => {
      toast({ title: "Message sent!", description: "We'll get back to you soon." });
      form.reset();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to send message. Please try again.", variant: "destructive" });
    },
  });

  return (
    <div>
      <PageMeta
        title="Contact — Questions, Partnerships & Press"
        description="Get in touch with Humanity + AI, Inc. We welcome questions, partnership inquiries, media requests, and community collaboration. Reach us at danielle@humanityplusai.org."
        canonical="/contact"
      />
      <EditorialMasthead kicker="Get In Touch" title="Contact" tagline="Questions, Partnerships & Press" />
      <section className="py-20 bg-gradient-to-br from-primary/5 via-background to-accent/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeIn} className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Mail className="h-3.5 w-3.5" />
              Contact
            </div>
            <h1 className="font-serif text-4xl lg:text-5xl font-bold tracking-tight leading-[1.1] mb-6" data-testid="text-contact-title">
              Get In <span className="text-primary">Touch</span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Have a question, want to collaborate, or interested in our programs? We'd love to hear from you.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-5 gap-12">
            <motion.div {...fadeIn} className="lg:col-span-3">
              <Card className="p-8">
                <h2 className="font-serif text-xl font-bold mb-6">Send Us a Message</h2>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input placeholder="First name" {...field} data-testid="input-first-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Last name" {...field} data-testid="input-last-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="your@email.com" {...field} data-testid="input-contact-email" />
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
                          <FormLabel>Message</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Tell us how we can help..." rows={5} {...field} data-testid="input-contact-message" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full gap-2" disabled={mutation.isPending} data-testid="button-send-contact">
                      {mutation.isPending ? (
                        <>Sending...</>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          Send Message
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </Card>
            </motion.div>

            <motion.div {...fadeIn} transition={{ delay: 0.2, duration: 0.5 }} className="lg:col-span-2 space-y-6">
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Contact Information</h3>
                <div className="space-y-4">
                  <a href="mailto:danielle@humanityplusai.org" className="flex items-start gap-3 group" data-testid="link-contact-email">
                    <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Mail className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Email</p>
                      <p className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">danielle@humanityplusai.org</p>
                    </div>
                  </a>
                  <a href="tel:8086522090" className="flex items-start gap-3 group" data-testid="link-contact-phone">
                    <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Phone className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Phone</p>
                      <p className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">(808) 652-2090</p>
                    </div>
                  </a>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold mb-4">Follow Us</h3>
                <div className="flex gap-3">
                  <a href="https://www.instagram.com/humanity_ai_inc/" target="_blank" rel="noopener noreferrer" data-testid="link-contact-instagram">
                    <Button variant="outline" size="icon">
                      <SiInstagram className="h-4 w-4" />
                    </Button>
                  </a>
                  <a href="https://www.linkedin.com/company/humanity-plus-ai-inc/" target="_blank" rel="noopener noreferrer" data-testid="link-contact-linkedin">
                    <Button variant="outline" size="icon">
                      <SiLinkedin className="h-4 w-4" />
                    </Button>
                  </a>
                </div>
              </Card>

              <Card className="p-6 bg-primary text-primary-foreground">
                <h3 className="font-semibold mb-2">Humanity + AI, Inc.</h3>
                <p className="text-sm text-primary-foreground/80 leading-relaxed">
                  A 501(c)(3) nonprofit dedicated to ensuring AI serves humanity through ethical development, education, and community building.
                </p>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
