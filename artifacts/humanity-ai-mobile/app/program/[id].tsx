import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Stack, useLocalSearchParams } from "expo-router";
import React from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";

import { ErrorState, GradientBar, Kicker, Screen } from "@/components/ui";
import colors from "@/constants/colors";
import { programs } from "@/constants/content";
import { fonts } from "@/constants/typography";

const c = colors.light;

export default function ProgramDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const index = Number(id);
  const program = Number.isInteger(index) ? programs[index] : undefined;

  if (!program) {
    return (
      <>
        <Stack.Screen options={{ title: "Program" }} />
        <Screen>
          <ErrorState message="This program could not be found." />
        </Screen>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: program.title }} />
      <Screen>
        <View style={styles.headerRow}>
          <View style={[styles.icon, { backgroundColor: `${program.tint}22` }]}>
            <Feather name={program.icon} size={22} color={program.tint} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title} testID="text-program-title">
              {program.title}
            </Text>
            <Text style={styles.subtitle}>{program.subtitle}</Text>
          </View>
        </View>
        <GradientBar style={{ marginTop: 16 }} />

        <Image source={program.image} style={styles.heroImage} contentFit="cover" transition={300} />

        <Text style={styles.description}>{program.desc}</Text>

        <View style={{ marginTop: 24 }}>
          <Kicker>Highlights</Kicker>
          <View style={styles.chipWrap}>
            {program.highlights.map((highlight) => (
              <View key={highlight} style={styles.chip}>
                <View style={[styles.chipDot, { backgroundColor: program.tint }]} />
                <Text style={styles.chipText}>{highlight}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={{ marginTop: 24 }}>
          <Kicker>Led By</Kicker>
          <View style={styles.peopleList}>
            {program.people.map((person) => (
              <View key={`${person.name}-${person.role}`} style={styles.personRow}>
                <Image source={person.photo} style={styles.personPhoto} contentFit="cover" transition={200} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.personName}>{person.name}</Text>
                  <Text style={styles.personRole}>{person.role}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {program.links?.length ? (
          <View style={styles.linkList}>
            {program.links.map((link) => (
              <Pressable
                key={link.url}
                onPress={() => Linking.openURL(link.url)}
                style={({ pressed }) => [styles.linkButton, pressed && { opacity: 0.8 }]}
                testID={`button-program-link-${link.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
              >
                <Text style={styles.linkButtonText}>{link.label}</Text>
                <Feather name="arrow-up-right" size={16} color={c.gold} />
              </Pressable>
            ))}
          </View>
        ) : null}
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: c.cream,
    fontFamily: fonts.display,
    fontSize: 24,
    lineHeight: 30,
  },
  subtitle: {
    color: c.mutedForeground,
    fontFamily: fonts.body,
    fontSize: 13.5,
    marginTop: 3,
  },
  heroImage: {
    width: "100%",
    aspectRatio: 16 / 10,
    borderRadius: 20,
    marginTop: 18,
  },
  description: {
    color: "rgba(250,249,246,0.8)",
    fontFamily: fonts.body,
    fontSize: 14.5,
    lineHeight: 23,
    marginTop: 18,
  },
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: c.secondary,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  chipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  chipText: {
    color: "rgba(250,249,246,0.85)",
    fontFamily: fonts.bodyMedium,
    fontSize: 12.5,
  },
  peopleList: {
    gap: 12,
    marginTop: 12,
  },
  personRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: c.card,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 999,
    padding: 8,
    paddingRight: 16,
  },
  personPhoto: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  personName: {
    color: c.cream,
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
  },
  personRole: {
    color: c.mutedForeground,
    fontFamily: fonts.body,
    fontSize: 12,
    marginTop: 1,
  },
  linkList: {
    gap: 10,
    marginTop: 26,
  },
  linkButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "rgba(240,198,116,0.4)",
    borderRadius: 999,
  },
  linkButtonText: {
    color: c.gold,
    fontFamily: fonts.bodySemiBold,
    fontSize: 14.5,
  },
});
