import { Feather } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Badge, Loading, Masthead, Screen } from "@/components/ui";
import colors from "@/constants/colors";
import { fonts } from "@/constants/typography";
import { toggleBookmark, useBookmarks, type Bookmark } from "@/services/bookmarks";

const c = colors.light;

function SavedRow({ item, index }: { item: Bookmark; index: number }) {
  const router = useRouter();
  const isEvent = item.type === "event";

  const open = () => {
    if (isEvent) {
      router.push({ pathname: "/event/[id]", params: { id: item.ref } });
    } else {
      router.push({ pathname: "/post/[slug]", params: { slug: item.ref } });
    }
  };

  return (
    <Pressable
      onPress={open}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
      testID={`card-saved-${index}`}
    >
      <View style={styles.icon}>
        <Feather name={isEvent ? "calendar" : "file-text"} size={16} color={c.mint} />
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <Badge label={isEvent ? "Event" : "Update"} color={isEvent ? c.mint : c.gold} />
        <Text style={styles.title} numberOfLines={2}>
          {item.title}
        </Text>
        {item.subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {item.subtitle}
          </Text>
        ) : null}
      </View>
      <Pressable
        onPress={() => toggleBookmark(item)}
        hitSlop={10}
        style={({ pressed }) => pressed && { opacity: 0.6 }}
        testID={`button-unsave-${index}`}
      >
        <Feather name="bookmark" size={18} color={c.gold} />
      </Pressable>
    </Pressable>
  );
}

export default function SavedScreen() {
  const { bookmarks, ready } = useBookmarks();

  return (
    <>
      <Stack.Screen options={{ title: "Saved" }} />
      <Screen>
        <Masthead
          kicker="Your Library"
          title="Saved"
          tagline="Updates and events you bookmarked to revisit"
        />
        {!ready ? <Loading label="Loading your saved items…" /> : null}
        {ready && bookmarks.length === 0 ? (
          <View style={styles.emptyBox}>
            <Feather name="bookmark" size={26} color={c.mutedForeground} />
            <Text style={styles.emptyText}>
              Nothing saved yet. Tap the bookmark on any update or event and it
              will be waiting for you here — even offline.
            </Text>
          </View>
        ) : null}
        <View style={styles.list}>
          {bookmarks.map((b, i) => (
            <SavedRow key={`${b.type}:${b.ref}`} item={b} index={i} />
          ))}
        </View>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 12,
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
  icon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(110,231,183,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: c.cream,
    fontFamily: fonts.displaySemiBold,
    fontSize: 15,
    lineHeight: 20,
  },
  subtitle: {
    color: c.mutedForeground,
    fontFamily: fonts.body,
    fontSize: 12.5,
  },
  emptyBox: {
    alignItems: "center",
    gap: 14,
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyText: {
    color: c.mutedForeground,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
  },
});
