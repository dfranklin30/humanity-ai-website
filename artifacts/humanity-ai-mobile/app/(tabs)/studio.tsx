/**
 * AI for Kids, inside the app: the Studio, the Hub and the Facilitator
 * dashboard, each the real page from aiforkids.humanityplusai.org, behind
 * one switcher at the top of the tab.
 *
 *   Studio       a child signs in with the class code and makes things
 *   Hub          the Arcade, Lounge and Gallery of what the class made
 *   Facilitator  the grown-up's roster, approvals and class switches
 *
 * The three panels stay mounted, so switching between them keeps each one
 * where it was (a half-written order in the Studio survives a peek at the
 * Hub). A link into the app — humanity-ai-mobile://kids?room=hub, or an
 * https://aiforkids.humanityplusai.org/aiforkids/… link (see
 * app/+native-intent.ts) — opens the right panel at the right page.
 */
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { KIDS_ORIGIN, KidsWeb, stayInside, type KidsWebHandle } from "@/components/KidsWeb";
import { useColors } from "@/hooks/useColors";
import { fonts } from "@/constants/typography";

export const ROOMS = [
  { id: "studio", label: "Studio", path: "/aiforkids/studio" },
  { id: "hub", label: "Hub", path: "/aiforkids/hub" },
  { id: "facilitator", label: "Facilitator", path: "/aiforkids/facilitator" },
] as const;
export type RoomId = (typeof ROOMS)[number]["id"];

export const STUDIO_URL = `${KIDS_ORIGIN}${ROOMS[0].path}`;

export function roomOf(value: unknown): RoomId {
  return ROOMS.some((r) => r.id === value) ? (value as RoomId) : "studio";
}

export default function KidsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ room?: string; url?: string }>();
  const [room, setRoom] = useState<RoomId>(() => roomOf(params.room));
  const panels = useRef<Record<RoomId, KidsWebHandle | null>>({ studio: null, hub: null, facilitator: null });

  // A deep link while the tab is open switches rooms and, when it names a
  // page, loads that page in the room's panel.
  useEffect(() => {
    const next = roomOf(params.room);
    setRoom(next);
    const url = typeof params.url === "string" ? params.url : "";
    if (url && stayInside(url)) panels.current[next]?.open(url);
  }, [params.room, params.url]);

  return (
    <View style={[styles.root, { backgroundColor: colors.backgroundDeep, paddingTop: insets.top }]}>
      <View style={[styles.bar, { borderBottomColor: colors.border }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={() => panels.current[room]?.goBack()}
          style={({ pressed }) => [styles.barButton, { opacity: pressed ? 0.6 : 1 }]}
          testID="kids-back"
        >
          <Feather name="chevron-left" size={22} color={colors.gold} />
        </Pressable>

        <View style={[styles.switcher, { backgroundColor: colors.background, borderColor: colors.border }]} accessibilityRole="tablist" testID="kids-switcher">
          {ROOMS.map((r) => {
            const on = r.id === room;
            return (
              <Pressable
                key={r.id}
                accessibilityRole="tab"
                accessibilityState={{ selected: on }}
                onPress={() => setRoom(r.id)}
                style={[styles.segment, on && { backgroundColor: colors.gold }]}
                testID={`kids-room-${r.id}`}
              >
                <Text style={[styles.segmentText, { color: on ? colors.backgroundDeep : colors.foreground }]} numberOfLines={1}>
                  {r.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Reload"
          onPress={() => panels.current[room]?.reload()}
          style={({ pressed }) => [styles.barButton, { opacity: pressed ? 0.6 : 1 }]}
          testID="kids-reload"
        >
          <Feather name="refresh-cw" size={18} color={colors.gold} />
        </Pressable>
      </View>

      <View style={styles.body}>
        {ROOMS.map((r) => (
          <View key={r.id} style={[styles.panel, r.id !== room && styles.hidden]} testID={`kids-panel-${r.id}`}>
            <KidsWeb
              ref={(h) => {
                panels.current[r.id] = h;
              }}
              url={`${KIDS_ORIGIN}${r.path}`}
              active={r.id === room}
              testID={`kids-${r.id}`}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  bar: {
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  barButton: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  switcher: { flex: 1, flexDirection: "row", borderRadius: 999, borderWidth: StyleSheet.hairlineWidth, padding: 3, marginHorizontal: 4 },
  segment: { flex: 1, borderRadius: 999, paddingVertical: 6, alignItems: "center", justifyContent: "center" },
  segmentText: { fontFamily: fonts.displaySemiBold, fontSize: 13 },
  body: { flex: 1 },
  panel: { ...StyleSheet.absoluteFillObject },
  hidden: { display: "none" },
});
