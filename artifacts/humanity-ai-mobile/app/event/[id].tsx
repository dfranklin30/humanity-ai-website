import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Notifications from "expo-notifications";
import { Stack, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  Badge,
  ErrorState,
  GoldButton,
  GradientBar,
  Loading,
  OutlineButton,
  Screen,
} from "@/components/ui";
import colors from "@/constants/colors";
import { fonts } from "@/constants/typography";
import {
  absoluteUrl,
  API_BASE_URL,
  formatEventDate,
  isLumaLink,
  todayString,
  useEvents,
  type EventItem,
} from "@/lib/api";
import { ensureNotificationPermissions } from "@/services/notifications";
import { useBookmark } from "@/services/bookmarks";

const c = colors.light;

function InfoRow({ icon, text }: { icon: keyof typeof Feather.glyphMap; text: string }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Feather name={icon} size={15} color={c.mint} />
      </View>
      <Text style={styles.infoText}>{text}</Text>
    </View>
  );
}

/** Native in-app registration — posts to the same signup API the website uses. */
function RsvpForm({ event }: { event: EventItem }) {
  const [open, setOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [organization, setOrganization] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (submitting) return;
    setError(null);
    if (fullName.trim().length < 2) {
      setError("Please enter your full name.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/events/${event.id}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim(),
          organization: organization.trim() || undefined,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body?.error || "Registration failed. Please try again.");
      }
      setDone(
        body?.message || "You're signed up — check your email for confirmation.",
      );
    } catch (e: any) {
      setError(e?.message || "Registration failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <View style={styles.rsvpDone} testID="rsvp-success">
        <Feather name="check-circle" size={20} color={c.mint} />
        <Text style={styles.rsvpDoneText}>{done}</Text>
      </View>
    );
  }

  if (!open) {
    return (
      <GoldButton
        label="Register in App"
        icon="user-check"
        onPress={() => setOpen(true)}
        testID="button-event-register"
      />
    );
  }

  return (
    <View style={styles.rsvpCard}>
      <Text style={styles.rsvpTitle}>Register for this event</Text>
      <TextInput
        style={styles.field}
        placeholder="Full name"
        placeholderTextColor={c.mutedForeground}
        value={fullName}
        onChangeText={setFullName}
        autoCapitalize="words"
        testID="input-rsvp-name"
      />
      <TextInput
        style={styles.field}
        placeholder="Email address"
        placeholderTextColor={c.mutedForeground}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        testID="input-rsvp-email"
      />
      <TextInput
        style={styles.field}
        placeholder="Organization (optional)"
        placeholderTextColor={c.mutedForeground}
        value={organization}
        onChangeText={setOrganization}
        testID="input-rsvp-org"
      />
      {error ? <Text style={styles.rsvpError}>{error}</Text> : null}
      <Pressable
        onPress={submit}
        disabled={submitting}
        style={({ pressed }) => [
          styles.rsvpSubmit,
          (pressed || submitting) && { opacity: 0.8 },
        ]}
        testID="button-rsvp-submit"
      >
        {submitting ? (
          <ActivityIndicator size="small" color={c.primaryForeground} />
        ) : (
          <Text style={styles.rsvpSubmitText}>Confirm Registration</Text>
        )}
      </Pressable>
      <Text style={styles.rsvpNote}>
        We only use this to confirm your spot and send event details.
      </Text>
    </View>
  );
}

/** Schedules a local reminder notification on the morning of the event. */
function ReminderButton({ event }: { event: EventItem }) {
  const [state, setState] = useState<"idle" | "set" | "unavailable">("idle");

  if (Platform.OS === "web") return null;

  const schedule = async () => {
    const granted = await ensureNotificationPermissions();
    if (!granted) {
      setState("unavailable");
      return;
    }
    const [y, m, d] = event.date.split("-").map(Number);
    if (!y || !m || !d) return;
    const fireAt = new Date(y, m - 1, d, 9, 0, 0);
    if (fireAt.getTime() <= Date.now()) return;
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `Today: ${event.title}`,
        body: `${event.time} · ${event.location}`,
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: fireAt },
    });
    setState("set");
  };

  if (state === "set") {
    return (
      <View style={styles.reminderSet}>
        <Feather name="bell" size={15} color={c.mint} />
        <Text style={styles.reminderSetText}>Reminder set for the morning of the event</Text>
      </View>
    );
  }
  if (state === "unavailable") {
    return (
      <Text style={styles.reminderUnavailable}>
        Notifications are off — enable them in Settings to get event reminders.
      </Text>
    );
  }
  return (
    <OutlineButton
      label="Remind Me"
      icon="bell"
      onPress={() => schedule().catch(() => setState("unavailable"))}
      testID="button-event-remind"
    />
  );
}

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: events, isLoading, isError, refetch } = useEvents();

  const event = events?.find((e) => String(e.id) === id);
  const image = event ? absoluteUrl(event.imageUrl ?? event.secondaryImageUrl) : undefined;
  const isPast = event ? event.date < todayString() : false;
  const lumaRsvp = event ? isLumaLink(event.link) : false;

  const { saved, toggle } = useBookmark(
    event
      ? {
          type: "event",
          ref: String(event.id),
          title: event.title,
          subtitle: `${formatEventDate(event.date)} · ${event.location}`,
        }
      : null,
  );

  return (
    <>
      <Stack.Screen options={{ title: "Event" }} />
      <Screen>
        {isLoading ? <Loading label="Loading event…" /> : null}
        {isError ? (
          <ErrorState message="Couldn't load this event. Check your connection." onRetry={() => refetch()} />
        ) : null}
        {!isLoading && !isError && !event ? <ErrorState message="This event could not be found." /> : null}

        {event ? (
          <View>
            <View style={styles.badgeRow}>
              <Badge label={event.type} color={c.mint} />
              {isPast ? <Badge label="Past Event" color={c.mutedForeground} /> : null}
              <View style={{ flex: 1 }} />
              <Pressable
                onPress={toggle}
                hitSlop={10}
                style={({ pressed }) => [styles.saveButton, pressed && { opacity: 0.7 }]}
                testID="button-event-save"
              >
                <Feather name="bookmark" size={18} color={saved ? c.gold : c.mutedForeground} />
                <Text style={[styles.saveText, saved && { color: c.gold }]}>
                  {saved ? "Saved" : "Save"}
                </Text>
              </Pressable>
            </View>
            <Text style={styles.title} testID="text-event-title">
              {event.title}
            </Text>
            <GradientBar style={{ marginTop: 14 }} />

            {image ? (
              <Image source={{ uri: image }} style={styles.heroImage} contentFit="cover" transition={300} />
            ) : null}

            <View style={styles.infoCard}>
              <InfoRow icon="calendar" text={formatEventDate(event.date)} />
              <InfoRow icon="clock" text={event.time} />
              <InfoRow icon="map-pin" text={event.location} />
              {event.speakerName ? <InfoRow icon="mic" text={event.speakerName} /> : null}
            </View>

            <Text style={styles.description}>{event.description}</Text>

            <View style={styles.actions}>
              {!isPast ? <RsvpForm event={event} /> : null}
              {!isPast ? <ReminderButton event={event} /> : null}
              {!isPast && event.link ? (
                <OutlineButton
                  label={lumaRsvp ? "RSVP on Luma" : "Event Page"}
                  icon="external-link"
                  onPress={() => Linking.openURL(event.link!)}
                  testID="button-event-rsvp"
                />
              ) : null}
              {event.recordingUrl ? (
                <OutlineButton
                  label="Watch the Recording"
                  icon="play"
                  onPress={() => Linking.openURL(event.recordingUrl!)}
                  testID="button-event-recording"
                />
              ) : null}
              {event.speakerProfileUrl ? (
                <OutlineButton
                  label="Speaker Profile"
                  icon="user"
                  onPress={() => Linking.openURL(event.speakerProfileUrl!)}
                  testID="button-event-speaker"
                />
              ) : null}
            </View>
          </View>
        ) : null}
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  saveText: {
    color: c.mutedForeground,
    fontFamily: fonts.bodySemiBold,
    fontSize: 12.5,
  },
  title: {
    color: c.cream,
    fontFamily: fonts.display,
    fontSize: 27,
    lineHeight: 34,
    marginTop: 12,
  },
  heroImage: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: 18,
    marginTop: 18,
  },
  infoCard: {
    backgroundColor: c.card,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 20,
    padding: 16,
    gap: 12,
    marginTop: 18,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  infoIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(110,231,183,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  infoText: {
    flex: 1,
    color: "rgba(250,249,246,0.85)",
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    lineHeight: 20,
  },
  description: {
    color: "rgba(250,249,246,0.78)",
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 23,
    marginTop: 18,
  },
  actions: {
    gap: 12,
    marginTop: 24,
  },
  rsvpCard: {
    backgroundColor: c.card,
    borderWidth: 1,
    borderColor: "rgba(240,198,116,0.35)",
    borderRadius: 20,
    padding: 16,
    gap: 12,
  },
  rsvpTitle: {
    color: c.cream,
    fontFamily: fonts.displaySemiBold,
    fontSize: 17,
  },
  field: {
    backgroundColor: c.backgroundDeep,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: c.cream,
    fontFamily: fonts.body,
    fontSize: 14.5,
  },
  rsvpError: {
    color: c.destructive,
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
  },
  rsvpSubmit: {
    backgroundColor: c.primary,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
  },
  rsvpSubmitText: {
    color: c.primaryForeground,
    fontFamily: fonts.bodyBold,
    fontSize: 15,
  },
  rsvpNote: {
    color: c.mutedForeground,
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 17,
    textAlign: "center",
  },
  rsvpDone: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(110,231,183,0.1)",
    borderWidth: 1,
    borderColor: "rgba(110,231,183,0.4)",
    borderRadius: 18,
    padding: 16,
  },
  rsvpDoneText: {
    flex: 1,
    color: c.cream,
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    lineHeight: 20,
  },
  reminderSet: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
  },
  reminderSetText: {
    color: c.mint,
    fontFamily: fonts.bodyMedium,
    fontSize: 13.5,
  },
  reminderUnavailable: {
    color: c.mutedForeground,
    fontFamily: fonts.body,
    fontSize: 12.5,
    textAlign: "center",
  },
});
