import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Stack, useLocalSearchParams } from "expo-router";
import React from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";

import { Badge, ErrorState, GradientBar, Loading, Screen } from "@/components/ui";
import colors from "@/constants/colors";
import { fonts } from "@/constants/typography";
import { absoluteUrl, formatPostDate, useBlogPosts } from "@/lib/api";
import { useBookmark } from "@/services/bookmarks";

const c = colors.light;

export default function PostDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { data: posts, isLoading, isError, refetch } = useBlogPosts();

  const post = posts?.find((p) => p.slug === slug);
  const image = post && !post.noImage ? absoluteUrl(post.featuredImageUrl ?? post.imageUrl) : undefined;
  const date = post ? formatPostDate(post.publishedAt ?? post.createdAt) : "";
  const paragraphs = post
    ? post.content
        .split(/\n+/)
        .map((p) => p.trim())
        .filter(Boolean)
    : [];

  const { saved, toggle } = useBookmark(
    post
      ? {
          type: "post",
          ref: post.slug,
          title: post.title,
          subtitle: post.author,
        }
      : null,
  );

  return (
    <>
      <Stack.Screen options={{ title: "Update" }} />
      <Screen>
        {isLoading ? <Loading label="Loading update…" /> : null}
        {isError ? (
          <ErrorState message="Couldn't load this update. Check your connection." onRetry={() => refetch()} />
        ) : null}
        {!isLoading && !isError && !post ? (
          <ErrorState message="This update could not be found." />
        ) : null}

        {post ? (
          <View>
            <View style={styles.topRow}>
              <Badge label={post.category} color={c.gold} />
              <Pressable
                onPress={toggle}
                hitSlop={10}
                style={({ pressed }) => [styles.saveButton, pressed && { opacity: 0.7 }]}
                testID="button-post-save"
              >
                <Feather name="bookmark" size={18} color={saved ? c.gold : c.mutedForeground} />
                <Text style={[styles.saveText, saved && { color: c.gold }]}>
                  {saved ? "Saved" : "Save"}
                </Text>
              </Pressable>
            </View>
            <Text style={styles.title} testID="text-post-title">
              {post.title}
            </Text>
            {post.subtitle ? <Text style={styles.subtitle}>{post.subtitle}</Text> : null}
            <Text style={styles.meta}>
              {post.author}
              {date ? `  ·  ${date}` : ""}
            </Text>
            <GradientBar style={{ marginTop: 16 }} />

            {image ? (
              <Image source={{ uri: image }} style={styles.heroImage} contentFit="cover" transition={300} />
            ) : null}

            <View style={styles.body}>
              {paragraphs.map((paragraph, i) => (
                <Text key={i} style={styles.paragraph}>
                  {paragraph}
                </Text>
              ))}
            </View>

            {post.mediumUrl ? (
              <Pressable
                onPress={() => Linking.openURL(post.mediumUrl!)}
                style={({ pressed }) => [styles.mediumLink, pressed && { opacity: 0.8 }]}
                testID="button-medium"
              >
                <Text style={styles.mediumLinkText}>Read on Medium</Text>
                <Feather name="arrow-up-right" size={16} color={c.gold} />
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
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
    fontSize: 28,
    lineHeight: 35,
    marginTop: 12,
  },
  subtitle: {
    color: "rgba(250,249,246,0.75)",
    fontFamily: fonts.displayMedium,
    fontSize: 17,
    lineHeight: 24,
    marginTop: 10,
  },
  meta: {
    color: c.mutedForeground,
    fontFamily: fonts.bodyMedium,
    fontSize: 12.5,
    marginTop: 12,
  },
  heroImage: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: 18,
    marginTop: 18,
  },
  body: {
    marginTop: 20,
    gap: 16,
  },
  paragraph: {
    color: "rgba(250,249,246,0.82)",
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 24,
  },
  mediumLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 26,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "rgba(240,198,116,0.4)",
    borderRadius: 999,
  },
  mediumLinkText: {
    color: c.gold,
    fontFamily: fonts.bodySemiBold,
    fontSize: 14.5,
  },
});
