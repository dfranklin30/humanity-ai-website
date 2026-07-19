import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, Loader2 } from "lucide-react";
import type { Event } from "@workspace/db";

const formSchema = z.object({
  fullName: z.string().min(2, "Please enter your full name"),
  email: z.string().email("Please enter a valid email address"),
  organization: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface Props {
  event: Event;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EventSignupDialog({ event, open, onOpenChange }: Props) {
  const { toast } = useToast();
  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { fullName: "", email: "", organization: "", notes: "" },
  });

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const res = await apiRequest("POST", `/api/events/${event.id}/signup`, values);
      return res.json() as Promise<{ message: string; emailSent: boolean }>;
    },
    onSuccess: (data) => {
      setSubmittedMessage(data.message);
      form.reset();
    },
    onError: (err: any) => {
      toast({
        title: "Signup failed",
        description: err?.message || "Please try again in a moment.",
        variant: "destructive",
      });
    },
  });

  const handleClose = (next: boolean) => {
    if (!next) {
      setSubmittedMessage(null);
      form.reset();
    }
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg" data-testid="dialog-event-signup">
        <DialogHeader>
          <DialogTitle data-testid="text-signup-title">Sign up — {event.title}</DialogTitle>
          <DialogDescription>
            Reserve your spot. We'll send a confirmation email with the event details.
          </DialogDescription>
        </DialogHeader>

        {submittedMessage ? (
          <div className="py-6 text-center" data-testid="block-signup-success">
            <div className="mx-auto w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="font-semibold text-lg mb-2">You're on the list</h3>
            <p className="text-sm text-muted-foreground mb-6">{submittedMessage}</p>
            <Button onClick={() => handleClose(false)} data-testid="button-signup-close">
              Done
            </Button>
          </div>
        ) : (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Jane Doe" {...field} data-testid="input-signup-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="you@example.com" {...field} data-testid="input-signup-email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="organization"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organization <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                    <FormControl>
                      <Input placeholder="Company, university, or community" {...field} data-testid="input-signup-organization" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Anything you'd like us to know? <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                    <FormControl>
                      <Textarea rows={3} placeholder="Topics you're hoping we cover, questions, etc." {...field} data-testid="input-signup-notes" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => handleClose(false)} data-testid="button-signup-cancel">
                  Cancel
                </Button>
                <Button type="submit" disabled={mutation.isPending} data-testid="button-signup-submit">
                  {mutation.isPending ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Reserving…</>
                  ) : (
                    "Reserve my spot"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
