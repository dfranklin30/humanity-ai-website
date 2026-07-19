import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Stack, useLocalSearchParams } from "expo-router";
import React from "react";
import { Linking, StyleSheet, Text, View } from "react-native";

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
import { absoluteUrl, formatEventDate, isLumaLink, todayString, useEvents } from "@/lib/api";

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

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: events, isLoading, isError, refetch } = useEvents();

  const event = events?.find((e) => String(e.id) === id);
  const image = event ? absoluteUrl(event.imageUrl ?? event.secondaryImageUrl) : undefined;
  const isPast = event ? event.date < todayString() : false;
  const lumaRsvp = event ? isLumaLink(event.link) : false;

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
              {!isPast && event.link ? (
                <GoldButton
                  label={lumaRsvp ? "RSVP on Luma" : "Join / RSVP"}
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
    gap: 8,
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
});
