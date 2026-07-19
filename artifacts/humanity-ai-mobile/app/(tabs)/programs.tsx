import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";

import { GradientBar, Kicker, Masthead, Screen } from "@/components/ui";
import colors from "@/constants/colors";
import { learningPhases, programs } from "@/constants/content";
import { fonts } from "@/constants/typography";

const c = colors.light;

export default function ProgramsScreen() {
  const router = useRouter();

  return (
    <Screen>
      <Masthead kicker="What We Do" title="Programs" tagline="Initiatives & Research" />

      <Text style={styles.intro}>
        From groundbreaking research to community education, our initiatives tackle
        the most pressing questions at the intersection of people and AI — each one
        led, in the open, by the experts building it.
      </Text>

      <View style={styles.list}>
        {programs.map((program, i) => (
          <Pressable
            key={program.title}
            onPress={() => router.push({ pathname: "/program/[id]", params: { id: String(i) } })}
            style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
            testID={`card-program-${i}`}
          >
            <View style={styles.cardImageWrap}>
              <Image source={program.image} style={styles.cardImage} contentFit="cover" transition={250} />
              <View style={styles.cardNumber}>
                <Text style={styles.cardNumberText}>{String(i + 1).padStart(2, "0")}</Text>
              </View>
            </View>
            <View style={styles.cardBody}>
              <View style={[styles.cardIcon, { backgroundColor: `${program.tint}22` }]}>
                <Feather name={program.icon} size={18} color={program.tint} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{program.title}</Text>
                <Text style={styles.cardSubtitle}>{program.subtitle}</Text>
              </View>
              <Feather name="chevron-right" size={20} color={c.mutedForeground} />
            </View>
          </Pressable>
        ))}
      </View>

      <GradientBar style={{ marginVertical: 30 }} />

      <Kicker>Learn</Kicker>
      <Text style={styles.learnTitle}>The AI Journey</Text>
      <Text style={styles.learnIntro}>
        Free learning paths from our AI Training Hub — follow the four phases of the
        nonprofit AI journey, from first curiosity to lasting impact.
      </Text>

      <View style={styles.list}>
        {learningPhases.map((phase, pi) => (
          <View key={phase.title} style={styles.phaseCard} testID={`card-phase-${pi}`}>
            <View style={styles.phaseHeader}>
              <View style={[styles.cardIcon, { backgroundColor: `${phase.tint}22` }]}>
                <Feather name={phase.icon} size={18} color={phase.tint} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{phase.title}</Text>
              </View>
              <Text style={[styles.phaseIndex, { color: phase.tint }]}>
                {String(pi + 1).padStart(2, "0")}
              </Text>
            </View>
            <Text style={styles.phaseDesc}>{phase.description}</Text>
            <View style={styles.moduleList}>
              {phase.modules.map((mod) => (
                <Pressable
                  key={mod.title}
                  onPress={() => Linking.openURL(mod.url)}
                  style={({ pressed }) => [styles.moduleRow, pressed && { opacity: 0.7 }]}
                >
                  <Text style={styles.moduleTitle}>{mod.title}</Text>
                  <Feather name="external-link" size={14} color={c.mint} />
                </Pressable>
              ))}
            </View>
          </View>
        ))}
      </View>

      <Pressable
        onPress={() => Linking.openURL("https://humanityplusai.org/training")}
        style={({ pressed }) => [styles.hubLink, pressed && { opacity: 0.8 }]}
        testID="button-training-hub"
      >
        <Text style={styles.hubLinkText}>Visit the full AI Training Hub</Text>
        <Feather name="arrow-up-right" size={16} color={c.gold} />
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: {
    color: "rgba(250,249,246,0.75)",
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 23,
    marginBottom: 22,
  },
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
  cardImageWrap: {
    position: "relative",
  },
  cardImage: {
    width: "100%",
    height: 150,
  },
  cardNumber: {
    position: "absolute",
    top: 12,
    left: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(8,28,20,0.85)",
    alignItems: "center",
    justifyContent: "center",
  },
  cardNumberText: {
    color: c.gold,
    fontFamily: fonts.display,
    fontSize: 14,
  },
  cardBody: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
  },
  cardIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    color: c.cream,
    fontFamily: fonts.displaySemiBold,
    fontSize: 16.5,
    lineHeight: 21,
  },
  cardSubtitle: {
    color: c.mutedForeground,
    fontFamily: fonts.body,
    fontSize: 12.5,
    marginTop: 2,
  },
  learnTitle: {
    color: c.cream,
    fontFamily: fonts.display,
    fontSize: 30,
    marginTop: 8,
  },
  learnIntro: {
    color: "rgba(250,249,246,0.7)",
    fontFamily: fonts.body,
    fontSize: 14.5,
    lineHeight: 22,
    marginTop: 8,
    marginBottom: 18,
  },
  phaseCard: {
    backgroundColor: c.card,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 22,
    padding: 16,
  },
  phaseHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  phaseIndex: {
    fontFamily: fonts.display,
    fontSize: 18,
  },
  phaseDesc: {
    color: c.mutedForeground,
    fontFamily: fonts.body,
    fontSize: 13.5,
    lineHeight: 20,
    marginTop: 10,
  },
  moduleList: {
    marginTop: 12,
    gap: 8,
  },
  moduleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: c.secondary,
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 14,
  },
  moduleTitle: {
    color: c.cream,
    fontFamily: fonts.bodyMedium,
    fontSize: 13.5,
  },
  hubLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 22,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "rgba(240,198,116,0.4)",
    borderRadius: 999,
  },
  hubLinkText: {
    color: c.gold,
    fontFamily: fonts.bodySemiBold,
    fontSize: 14.5,
  },
});
