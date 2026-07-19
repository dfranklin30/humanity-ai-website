import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Badge, ErrorState, Kicker, Loading, Masthead, Screen } from "@/components/ui";
import colors from "@/constants/colors";
import { fonts } from "@/constants/typography";
import { todayString, useEvents, type EventItem } from "@/lib/api";

const c = colors.light;

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

function dateParts(dateStr: string): { month: string; day: string } {
  const [, m, d] = dateStr.split("-").map(Number);
  return { month: MONTHS[(m ?? 1) - 1] ?? "", day: String(d ?? "") };
}

function EventCard({ event, past, index }: { event: EventItem; past?: boolean; index: number }) {
  const router = useRouter();
  const { month, day } = dateParts(event.date);
  return (
    <Pressable
      onPress={() => router.push({ pathname: "/event/[id]", params: { id: String(event.id) } })}
      style={({ pressed }) => [styles.card, past && styles.cardPast, pressed && { opacity: 0.85 }]}
      testID={`card-event-${index}`}
    >
      <View style={[styles.dateBlock, past && { borderColor: c.border }]}>
        <Text style={[styles.dateMonth, past && { color: c.mutedForeground }]}>{month}</Text>
        <Text style={[styles.dateDay, past && { color: c.mutedForeground }]}>{day}</Text>
      </View>
      <View style={{ flex: 1, gap: 5 }}>
        <Badge label={event.type} color={past ? c.mutedForeground : c.mint} />
        <Text style={styles.cardTitle} numberOfLines={2}>
          {event.title}
        </Text>
        <View style={styles.metaRow}>
          <Feather name="clock" size={12} color={c.mutedForeground} />
          <Text style={styles.metaText} numberOfLines={1}>
            {event.time}
          </Text>
        </View>
        <View style={styles.metaRow}>
          <Feather name="map-pin" size={12} color={c.mutedForeground} />
          <Text style={styles.metaText} numberOfLines={1}>
            {event.location}
          </Text>
        </View>
      </View>
      <Feather name="chevron-right" size={20} color={c.mutedForeground} />
    </Pressable>
  );
}

export default function EventsScreen() {
  const { data: events, isLoading, isError, refetch } = useEvents();

  const { upcoming, past } = useMemo(() => {
    const today = todayString();
    const all = events ?? [];
    return {
      upcoming: all.filter((e) => e.date >= today).sort((a, b) => a.date.localeCompare(b.date)),
      past: all.filter((e) => e.date < today).sort((a, b) => b.date.localeCompare(a.date)),
    };
  }, [events]);

  return (
    <Screen>
      <Masthead kicker="Gatherings" title="Events" tagline="Podcasts, sessions & community meetups" />

      {isLoading ? <Loading label="Loading events…" /> : null}
      {isError ? (
        <ErrorState message="Couldn't reach humanityplusai.org. Check your connection." onRetry={() => refetch()} />
      ) : null}

      {events ? (
        <>
          <Kicker>Upcoming</Kicker>
          <View style={styles.list}>
            {upcoming.length > 0 ? (
              upcoming.map((event, i) => <EventCard key={event.id} event={event} index={i} />)
            ) : (
              <Text style={styles.emptyText}>No upcoming events right now — check back soon.</Text>
            )}
          </View>

          {past.length > 0 ? (
            <>
              <View style={{ marginTop: 28 }}>
                <Kicker>Past Events</Kicker>
              </View>
              <View style={styles.list}>
                {past.map((event, i) => (
                  <EventCard key={event.id} event={event} past index={upcoming.length + i} />
                ))}
              </View>
            </>
          ) : null}
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 12,
    marginTop: 12,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: c.card,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 20,
    padding: 14,
  },
  cardPast: {
    opacity: 0.75,
  },
  dateBlock: {
    width: 54,
    borderWidth: 1,
    borderColor: "rgba(240,198,116,0.45)",
    borderRadius: 14,
    alignItems: "center",
    paddingVertical: 8,
  },
  dateMonth: {
    color: c.gold,
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    letterSpacing: 1.5,
  },
  dateDay: {
    color: c.cream,
    fontFamily: fonts.display,
    fontSize: 20,
    marginTop: 2,
  },
  cardTitle: {
    color: c.cream,
    fontFamily: fonts.displaySemiBold,
    fontSize: 15.5,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaText: {
    flex: 1,
    color: c.mutedForeground,
    fontFamily: fonts.body,
    fontSize: 12,
  },
  emptyText: {
    color: c.mutedForeground,
    fontFamily: fonts.body,
    fontSize: 14,
    paddingVertical: 16,
  },
});
