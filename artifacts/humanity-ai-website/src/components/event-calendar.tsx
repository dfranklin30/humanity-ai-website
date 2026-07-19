import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import type { Event } from "@workspace/db";

const typeAccent: Record<string, string> = {
  Workshop: "bg-blue-500",
  Education: "bg-emerald-500",
  Networking: "bg-purple-500",
  Research: "bg-amber-500",
  Podcast: "bg-rose-500",
};

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addMonths(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function parseEventDate(date: string) {
  return new Date(date + "T00:00:00");
}

export function EventCalendar({
  events,
  onSelectEvent,
}: {
  events: Event[];
  onSelectEvent?: (event: Event) => void;
}) {
  const today = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);

  // Anchor: month of next upcoming event, or current month
  const initialMonth = useMemo(() => {
    const upcoming = events
      .map((e) => parseEventDate(e.date))
      .filter((d) => d >= today)
      .sort((a, b) => a.getTime() - b.getTime());
    return startOfMonth(upcoming[0] ?? today);
  }, [events, today]);

  const [viewMonth, setViewMonth] = useState<Date>(initialMonth);

  const monthLabel = viewMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const firstDay = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
  const lastDay = new Date(
    viewMonth.getFullYear(),
    viewMonth.getMonth() + 1,
    0,
  );
  const startWeekday = firstDay.getDay(); // 0=Sun
  const daysInMonth = lastDay.getDate();

  // Build 6x7 grid cells
  const cells: Array<Date | null> = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), d));
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, Event[]>();
    for (const e of events) {
      const d = parseEventDate(e.date);
      if (
        d.getFullYear() === viewMonth.getFullYear() &&
        d.getMonth() === viewMonth.getMonth()
      ) {
        const key = String(d.getDate());
        const arr = map.get(key) || [];
        arr.push(e);
        map.set(key, arr);
      }
    }
    return map;
  }, [events, viewMonth]);

  // Side list: upcoming events in this month (or next 5 if none)
  const monthEvents = useMemo(() => {
    return events
      .filter((e) => {
        const d = parseEventDate(e.date);
        return (
          d.getFullYear() === viewMonth.getFullYear() &&
          d.getMonth() === viewMonth.getMonth()
        );
      })
      .sort((a, b) => (a.date < b.date ? -1 : 1));
  }, [events, viewMonth]);

  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div
      className="border border-foreground/10 bg-card"
      data-testid="event-calendar"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-foreground/10">
        <div className="flex items-center gap-3">
          <CalendarIcon className="h-4 w-4 text-primary" />
          <h3
            className="font-serif text-xl font-bold"
            data-testid="text-calendar-month"
          >
            {monthLabel}
          </h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setViewMonth((m) => addMonths(m, -1))}
            className="p-2 hover:bg-foreground/5 transition-colors"
            aria-label="Previous month"
            data-testid="button-calendar-prev"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMonth(startOfMonth(today))}
            className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest hover:bg-foreground/5 transition-colors"
            data-testid="button-calendar-today"
          >
            Today
          </button>
          <button
            onClick={() => setViewMonth((m) => addMonths(m, 1))}
            className="p-2 hover:bg-foreground/5 transition-colors"
            aria-label="Next month"
            data-testid="button-calendar-next"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_280px]">
        {/* Month grid */}
        <div className="p-4 sm:p-6 border-b md:border-b-0 md:border-r border-foreground/10">
          <div className="grid grid-cols-7 gap-px text-center mb-2">
            {weekdays.map((w) => (
              <div
                key={w}
                className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground py-2"
              >
                {w}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-px bg-foreground/5">
            {cells.map((cell, i) => {
              if (!cell) {
                return (
                  <div key={i} className="bg-card aspect-square sm:aspect-[1/0.9]" />
                );
              }
              const isToday = sameDay(cell, today);
              const isPast = cell < today;
              const dayEvents = eventsByDay.get(String(cell.getDate())) || [];
              const hasEvents = dayEvents.length > 0;
              return (
                <div
                  key={i}
                  className={`bg-card aspect-square sm:aspect-[1/0.9] p-1.5 flex flex-col items-start gap-1 relative ${
                    isPast ? "opacity-50" : ""
                  } ${isToday ? "ring-2 ring-primary ring-inset" : ""}`}
                  data-testid={`calendar-cell-${cell.getFullYear()}-${cell.getMonth() + 1}-${cell.getDate()}`}
                >
                  <span
                    className={`text-[11px] font-bold leading-none ${
                      isToday ? "text-primary" : "text-foreground/80"
                    }`}
                  >
                    {cell.getDate()}
                  </span>
                  <div className="flex flex-col gap-0.5 w-full overflow-hidden">
                    {dayEvents.slice(0, 2).map((e) => (
                      <button
                        key={e.id}
                        onClick={() => onSelectEvent?.(e)}
                        className={`group/event text-[9px] leading-tight text-left truncate flex items-center gap-1 hover:text-primary transition-colors ${
                          isPast ? "text-muted-foreground" : "text-foreground"
                        }`}
                        title={e.title}
                        data-testid={`calendar-event-${e.id}`}
                      >
                        <span
                          className={`w-1 h-1 rounded-full shrink-0 ${
                            typeAccent[e.type] || "bg-foreground/40"
                          }`}
                        />
                        <span className="truncate">{e.title}</span>
                      </button>
                    ))}
                    {dayEvents.length > 2 && (
                      <span className="text-[9px] text-muted-foreground font-semibold">
                        +{dayEvents.length - 2} more
                      </span>
                    )}
                  </div>
                  {hasEvents && (
                    <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-primary" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Side list */}
        <div className="p-4 sm:p-6 bg-background/40">
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">
            {monthEvents.length > 0
              ? `${monthEvents.length} Event${monthEvents.length === 1 ? "" : "s"} This Month`
              : "Nothing on the calendar"}
          </div>
          {monthEvents.length > 0 ? (
            <ul className="space-y-3" data-testid="calendar-month-list">
              {monthEvents.map((e) => {
                const d = parseEventDate(e.date);
                const isPast = d < today;
                return (
                  <li key={e.id}>
                    <button
                      onClick={() => onSelectEvent?.(e)}
                      className="w-full text-left group flex gap-3 items-start hover:bg-foreground/5 -mx-2 px-2 py-2 transition-colors"
                      data-testid={`calendar-side-event-${e.id}`}
                    >
                      <div className="w-10 shrink-0 text-center">
                        <div className="text-[9px] font-bold uppercase tracking-wider text-primary">
                          {d.toLocaleString("en-US", { month: "short" })}
                        </div>
                        <div className="font-serif text-lg font-bold leading-none mt-0.5">
                          {d.getDate()}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span
                            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                              typeAccent[e.type] || "bg-foreground/40"
                            }`}
                          />
                          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                            {e.type}
                          </span>
                          {isPast && (
                            <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/70">
                              · Past
                            </span>
                          )}
                        </div>
                        <div className="font-serif text-sm font-bold leading-snug group-hover:text-primary transition-colors line-clamp-2">
                          {e.title}
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          {e.time}
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground italic">
              Use the arrows to browse other months.
            </p>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 sm:px-6 py-3 border-t border-foreground/10 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        <span>Legend:</span>
        {Object.entries(typeAccent).map(([type, color]) => (
          <span key={type} className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${color}`} />
            {type}
          </span>
        ))}
      </div>
    </div>
  );
}
