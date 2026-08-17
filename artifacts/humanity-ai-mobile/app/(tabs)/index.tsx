import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { GoldButton, GradientBar, Kicker, OutlineButton, Screen } from "@/components/ui";
import colors from "@/constants/colors";
import { mission, pillars } from "@/constants/content";
import { fonts } from "@/constants/typography";

const c = colors.light;

export default function HomeScreen() {
  const router = useRouter();

  return (
    <Screen>
      <View style={styles.hero}>
        <Image
          source={require("@/assets/images/humanity-ai-logo.png")}
          style={styles.logo}
          contentFit="cover"
          transition={300}
        />
        <View style={styles.kickerRow}>
          <View style={styles.kickerLine} />
          <Kicker>{mission.kicker}</Kicker>
          <View style={styles.kickerLine} />
        </View>
        <Text style={styles.masthead} testID="text-masthead">
          {mission.masthead}
        </Text>
        <View style={styles.metaStrip}>
          <Text style={styles.metaText}>ISSUE 01</Text>
          <Text style={styles.metaDot}>◦</Text>
          <Text style={styles.metaText}>EST. 2024</Text>
        </View>
        <Text style={styles.headline}>
          {mission.headline}{" "}
          <Text style={styles.headlineAccent}>{mission.headlineAccent}</Text>
        </Text>
        <Text style={styles.missionBody} testID="text-hero-subtitle">
          {mission.body}
        </Text>
        <View style={styles.ctaColumn}>
          <GoldButton
            label="Ask Our AI Companion"
            icon="message-circle"
            onPress={() => router.push("/(tabs)/ask")}
            testID="button-hero-ask"
          />
          <OutlineButton
            label="Explore Our Programs"
            icon="arrow-right"
            onPress={() => router.push("/(tabs)/programs")}
            testID="button-hero-programs"
          />
          <OutlineButton
            label="Saved for Later"
            icon="bookmark"
            onPress={() => router.push("/saved")}
            testID="button-hero-saved"
          />
        </View>
      </View>

      <GradientBar style={{ marginVertical: 28 }} />

      <View>
        <Kicker>Cover Feature — The Team</Kicker>
        <Image
          source={require("@/assets/images/humanity-ai-team.png")}
          style={styles.teamPhoto}
          contentFit="cover"
          transition={300}
        />
      </View>

      <View style={styles.orgCard} testID="card-organization">
        <Text style={styles.orgTitle}>The Organization</Text>
        <Text style={styles.orgBody}>{mission.orgBrief1}</Text>
        <Text style={[styles.orgBody, { marginTop: 12 }]}>{mission.orgBrief2}</Text>
      </View>

      <View style={{ marginTop: 30 }}>
        <Kicker>What We Stand For</Kicker>
        <View style={styles.pillarList}>
          {pillars.map((pillar) => (
            <View key={pillar.title} style={styles.pillarCard}>
              <View style={styles.pillarIcon}>
                <Feather name={pillar.icon} size={18} color={c.mint} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.pillarTitle}>{pillar.title}</Text>
                <Text style={styles.pillarDesc}>{pillar.desc}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <Text style={styles.footerNote}>
        Humanity + AI, Inc. · Nonprofit · Est. 2024{"\n"}humanityplusai.org
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: "center",
  },
  logo: {
    width: 132,
    height: 132,
    borderRadius: 28,
    marginBottom: 20,
  },
  kickerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },
  kickerLine: {
    width: 22,
    height: 1,
    backgroundColor: "rgba(110,231,183,0.5)",
  },
  masthead: {
    color: c.cream,
    fontFamily: fonts.display,
    fontSize: 46,
    lineHeight: 50,
    textAlign: "center",
  },
  metaStrip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "rgba(250,249,246,0.15)",
    paddingVertical: 8,
    paddingHorizontal: 18,
    marginTop: 16,
  },
  metaText: {
    color: "rgba(250,249,246,0.55)",
    fontFamily: fonts.bodySemiBold,
    fontSize: 10,
    letterSpacing: 2.5,
  },
  metaDot: {
    color: "rgba(110,231,183,0.7)",
    fontSize: 10,
  },
  headline: {
    color: c.cream,
    fontFamily: fonts.displaySemiBold,
    fontSize: 27,
    lineHeight: 33,
    textAlign: "center",
    marginTop: 26,
  },
  headlineAccent: {
    color: c.mint,
    fontFamily: fonts.displayMedium,
  },
  missionBody: {
    color: "rgba(250,249,246,0.7)",
    fontFamily: fonts.body,
    fontSize: 15.5,
    lineHeight: 24,
    textAlign: "center",
    marginTop: 14,
  },
  ctaColumn: {
    alignSelf: "stretch",
    gap: 12,
    marginTop: 26,
  },
  teamPhoto: {
    width: "100%",
    aspectRatio: 4 / 3,
    borderRadius: 20,
    marginTop: 12,
  },
  orgCard: {
    backgroundColor: c.card,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 20,
    padding: 20,
    marginTop: 26,
  },
  orgTitle: {
    color: c.gold,
    fontFamily: fonts.display,
    fontSize: 22,
    marginBottom: 10,
  },
  orgBody: {
    color: "rgba(250,249,246,0.8)",
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 22,
  },
  pillarList: {
    gap: 12,
    marginTop: 14,
  },
  pillarCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    backgroundColor: c.card,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 18,
    padding: 16,
  },
  pillarIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(110,231,183,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  pillarTitle: {
    color: c.cream,
    fontFamily: fonts.displaySemiBold,
    fontSize: 16,
  },
  pillarDesc: {
    color: c.mutedForeground,
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 3,
  },
  footerNote: {
    color: "rgba(250,249,246,0.4)",
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    marginTop: 36,
  },
});
