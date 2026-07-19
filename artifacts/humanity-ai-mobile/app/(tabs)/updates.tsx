import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Badge, ErrorState, Loading, Masthead, Screen } from "@/components/ui";
import colors from "@/constants/colors";
import { fonts } from "@/constants/typography";
import { absoluteUrl, formatPostDate, useBlogPosts } from "@/lib/api";

const c = colors.light;

export default function UpdatesScreen() {
  const router = useRouter();
  const { data: posts, isLoading, isError, refetch } = useBlogPosts();

  return (
    <Screen>
      <Masthead kicker="The Journal" title="Updates" tagline="News, essays & research from Humanity + AI" />

      {isLoading ? <Loading label="Loading the latest updates…" /> : null}
      {isError ? (
        <ErrorState message="Couldn't reach humanityplusai.org. Check your connection." onRetry={() => refetch()} />
      ) : null}

      <View style={styles.list}>
        {posts?.map((post, i) => {
          const image = post.noImage ? undefined : absoluteUrl(post.featuredImageUrl ?? post.imageUrl);
          const date = formatPostDate(post.publishedAt ?? post.createdAt);
          return (
            <Pressable
              key={post.id}
              onPress={() => router.push({ pathname: "/post/[slug]", params: { slug: post.slug } })}
              style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
              testID={`card-post-${i}`}
            >
              {image ? (
                <Image source={{ uri: image }} style={styles.cardImage} contentFit="cover" transition={250} />
              ) : null}
              <View style={styles.cardBody}>
                <Badge label={post.category} color={c.gold} />
                <Text style={styles.cardTitle} numberOfLines={3}>
                  {post.title}
                </Text>
                <Text style={styles.cardExcerpt} numberOfLines={3}>
                  {post.excerpt}
                </Text>
                <View style={styles.metaRow}>
                  <Text style={styles.metaText} numberOfLines={1}>
                    {post.author}
                    {date ? `  ·  ${date}` : ""}
                  </Text>
                  <Feather name="arrow-right" size={16} color={c.mint} />
                </View>
              </View>
            </Pressable>
          );
        })}
      </View>

      {posts && posts.length === 0 ? (
        <Text style={styles.emptyText}>No updates published yet — check back soon.</Text>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 16,
  },
  card: {
    backgroundColor: c.card,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 22,
    overflow: "hidden",
  },
  cardImage: {
    width: "100%",
    height: 170,
  },
  cardBody: {
    padding: 16,
    gap: 10,
  },
  cardTitle: {
    color: c.cream,
    fontFamily: fonts.displaySemiBold,
    fontSize: 19,
    lineHeight: 25,
  },
  cardExcerpt: {
    color: c.mutedForeground,
    fontFamily: fonts.body,
    fontSize: 13.5,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginTop: 2,
  },
  metaText: {
    flex: 1,
    color: "rgba(250,249,246,0.5)",
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
  },
  emptyText: {
    color: c.mutedForeground,
    fontFamily: fonts.body,
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 40,
  },
});
