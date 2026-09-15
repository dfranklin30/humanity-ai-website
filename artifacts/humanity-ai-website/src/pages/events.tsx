import { PageMeta } from "@/components/page-meta";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Clock, MapPin, ExternalLink, UserPlus, PlayCircle, UserCircle } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import type { Event } from "@workspace/db";
import { EventSignupDialog } from "@/components/event-signup-dialog";
import { EditorialMasthead } from "@/components/editorial-masthead";
import { EventCalendar } from "@/components/event-calendar";

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5 },
};

const typeColors: Record<string, string> = {
  Workshop: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  Education: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  Networking: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  Research: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  Podcast: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
};

export default function Events() {
  const { data: eventsList, isLoading } = useQuery<Event[]>({ queryKey: ["/api/events"] });
  const [signupEvent, setSignupEvent] = useState<Event | null>(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const sortedAll = [...(eventsList || [])].sort((a, b) =>
    a.date < b.date ? -1 : a.date > b.date ? 1 : 0,
  );
  const upcoming = sortedAll.filter(
    (e) => !e.recordingUrl && new Date(e.date + "T00:00:00") >= today,
  );
  const past = sortedAll
    .filter((e) => e.recordingUrl || new Date(e.date + "T00:00:00") < today)
    .reverse();

  const renderEvent = (event: Event, i: number, isPast: boolean) => {
    const eventDate = new Date(event.date + "T00:00:00");
    const isLumaRsvp = !!event.link && /^https?:\/\/(www\.)?(luma\.com|lu\.ma)\//.test(event.link);
    const month = eventDate
      .toLocaleString("en-US", { month: "short" })
      .toUpperCase();
    const day = eventDate.getDate();
    return (
      <motion.div
        key={event.id}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: i * 0.1, duration: 0.4 }}
      >
        <Card className="overflow-hidden hover-elevate" data-testid={`card-event-${event.id}`}>
          {event.imageUrl && (
            <div className="relative w-full bg-gradient-to-br from-primary/5 via-background to-accent/10 overflow-hidden">
              {event.secondaryImageUrl ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-0">
                  <img
                    src={event.imageUrl}
                    alt={event.title}
                    className={`w-full h-80 sm:h-96 object-contain p-3 ${isPast ? "grayscale" : ""}`}
                    data-testid={`img-event-${event.id}`}
                  />
                  <img
                    src={event.secondaryImageUrl}
                    alt={`${event.title} — board lineup`}
                    className={`w-full h-80 sm:h-96 object-contain p-3 ${isPast ? "grayscale" : ""}`}
                    data-testid={`img-event-secondary-${event.id}`}
                  />
                </div>
              ) : (
                <img
                  src={event.imageUrl}
                  alt={event.title}
                  className={`w-full h-80 sm:h-[28rem] object-contain p-4 ${isPast ? "grayscale" : ""}`}
                  data-testid={`img-event-${event.id}`}
                />
              )}
              <div className="absolute top-4 left-4 bg-background/95 backdrop-blur rounded-md shadow-md px-3 py-2 flex flex-col items-center min-w-[60px]">
                <span className="text-[10px] font-bold text-primary uppercase tracking-wider">{month}</span>
                <span className="text-2xl font-bold text-foreground leading-none">{day}</span>
              </div>
              <div className="absolute top-4 right-4 flex flex-col gap-2 items-end">
                <span className={`text-xs px-3 py-1 rounded-full font-medium shadow-sm ${typeColors[event.type] || "bg-muted text-muted-foreground"}`}>
                  {event.type}
                </span>
                {isPast && (
                  <span className="text-[10px] uppercase tracking-widest font-bold bg-foreground/90 text-background px-2 py-1 rounded-full">
                    Past · Recording
                  </span>
                )}
              </div>
            </div>
          )}
          <div className="p-6">
            {!event.imageUrl && (
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-md flex flex-col items-center justify-center shrink-0">
                    <span className="text-[9px] font-bold text-primary uppercase">{month}</span>
                    <span className="text-base font-bold text-primary leading-none">{day}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeColors[event.type] || "bg-muted text-muted-foreground"}`}>
                    {event.type}
                  </span>
                  {isPast && (
                    <span className="text-[10px] uppercase tracking-widest font-bold bg-foreground/90 text-background px-2 py-0.5 rounded-full">
                      Past
                    </span>
                  )}
                </div>
              </div>
            )}
            <h3 className="font-serif text-xl font-bold mb-3" data-testid={`text-event-title-${event.id}`}>{event.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">{event.description}</p>
            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground mb-5">
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {event.time}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                {event.location}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {!isPast && isLumaRsvp && event.link && (
                <a href={event.link} target="_blank" rel="noopener noreferrer">
                  <Button className="gap-1.5" data-testid={`button-event-rsvp-${event.id}`}>
                    <ExternalLink className="h-4 w-4" />
                    RSVP on Luma
                  </Button>
                </a>
              )}
              {!isPast && !isLumaRsvp && (
                <Button
                  onClick={() => setSignupEvent(event)}
                  className="gap-1.5"
                  data-testid={`button-event-signup-${event.id}`}
                >
                  <UserPlus className="h-4 w-4" />
                  Sign up to attend
                </Button>
              )}
              {!isPast && !isLumaRsvp && event.link && (
                <a href={event.link} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="gap-1.5" data-testid={`button-event-join-${event.id}`}>
                    <ExternalLink className="h-4 w-4" />
                    Join Event Link
                  </Button>
                </a>
              )}
              {isPast && event.recordingUrl && (
                <a href={event.recordingUrl} target="_blank" rel="noopener noreferrer">
                  <Button className="gap-1.5" data-testid={`button-event-recording-${event.id}`}>
                    <PlayCircle className="h-4 w-4" />
                    Watch the Recording
                  </Button>
                </a>
              )}
              {isPast && !event.recordingUrl && (
                <span className="text-xs text-muted-foreground italic">
                  Recording coming soon.
                </span>
              )}
              {event.speakerProfileUrl && event.speakerName && (
                <Link href={event.speakerProfileUrl}>
                  <Button variant="outline" className="gap-1.5" data-testid={`button-event-speaker-${event.id}`}>
                    <UserCircle className="h-4 w-4" />
                    Meet the speaker: {event.speakerName}
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </Card>
      </motion.div>
    );
  };

  return (
    <div>
      <PageMeta
        title="Events — Workshops, Talks & Meetups"
        description="Join Humanity + AI events including workshops, seminars, networking meetups, and educational talks on AI ethics, technology leadership, and community empowerment."
        canonical="/events"
      />
      <EditorialMasthead kicker="Calendar" title="Events" tagline="Workshops, Talks & Meetups" />
      <section className="py-20 bg-gradient-to-br from-primary/5 via-background to-accent/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeIn} className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Calendar className="h-3.5 w-3.5" />
              Events
            </div>
            <h1 className="font-serif text-4xl lg:text-5xl font-bold tracking-tight leading-[1.1] mb-6" data-testid="text-events-title">
              Upcoming <span className="text-primary">Events</span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Join our workshops, seminars, and community gatherings. Together, we explore the future of AI and its impact on humanity.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="p-6">
                  <div className="flex gap-6">
                    <Skeleton className="w-20 h-20 rounded-md shrink-0" />
                    <div className="flex-1 space-y-3">
                      <Skeleton className="h-5 w-48" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : eventsList && eventsList.length > 0 ? (
            <div className="space-y-12">
              <div data-testid="section-calendar">
                <h2 className="font-serif text-2xl font-bold mb-1 text-[#14201B]" data-testid="heading-calendar">
                  Calendar
                </h2>
                <p className="text-sm text-[#4B5F55] mb-6">
                  Browse upcoming sessions and past recordings by month. Click any event to scroll to its details.
                </p>
                <EventCalendar
                  events={eventsList}
                  onSelectEvent={(e) => {
                    const el = document.querySelector(
                      `[data-testid="card-event-${e.id}"]`,
                    ) as HTMLElement | null;
                    if (el) {
                      el.scrollIntoView({ behavior: "smooth", block: "center" });
                      const prev = el.getAttribute("tabindex");
                      el.setAttribute("tabindex", "-1");
                      el.focus({ preventScroll: true });
                      window.setTimeout(() => {
                        if (prev === null) el.removeAttribute("tabindex");
                        else el.setAttribute("tabindex", prev);
                      }, 1000);
                    }
                  }}
                />
              </div>
              <div>
                <h2 className="font-serif text-2xl font-bold mb-1 text-[#14201B]" data-testid="heading-upcoming-events">
                  Upcoming
                </h2>
                <p className="text-sm text-[#4B5F55] mb-6">
                  Workshops, seminars and gatherings open to the community.
                </p>
                {upcoming.length > 0 ? (
                  <div className="space-y-6">
                    {upcoming.map((e, i) => renderEvent(e, i, false))}
                  </div>
                ) : (
                  <div className="border border-dashed border-black/15 rounded-md p-8 text-center text-sm text-[#4B5F55]">
                    No upcoming events on the calendar right now — check back soon.
                  </div>
                )}
              </div>
              {past.length > 0 && (
                <div>
                  <h2 className="font-serif text-2xl font-bold mb-1 text-[#14201B]" data-testid="heading-past-events">
                    Past Events &amp; Recordings
                  </h2>
                  <p className="text-sm text-[#4B5F55] mb-6">
                    Catch up on conversations and sessions from the community.
                  </p>
                  <div className="space-y-6">
                    {past.map((e, i) => renderEvent(e, i, true))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-16">
              <Calendar className="h-12 w-12 text-[#8A9A92] mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2 text-[#14201B]">No events yet</h3>
              <p className="text-[#4B5F55]">Check back soon for new events and gatherings.</p>
            </div>
          )}
        </div>
      </section>

      {signupEvent && (
        <EventSignupDialog
          event={signupEvent}
          open={!!signupEvent}
          onOpenChange={(open) => { if (!open) setSignupEvent(null); }}
        />
      )}
    </div>
  );
}
