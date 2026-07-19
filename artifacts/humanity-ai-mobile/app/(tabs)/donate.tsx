import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { GoldButton, GradientBar, Kicker, Masthead, OutlineButton, Screen } from "@/components/ui";
import colors from "@/constants/colors";
import { impactAreas, membershipTiers } from "@/constants/content";
import { fonts } from "@/constants/typography";
import { DonationService } from "@/services/donations";

const c = colors.light;

export default function DonateScreen() {
  return (
    <Screen>
      <Masthead kicker="Support" title="Donate" tagline="Keep the most powerful technology of our time deeply human" />

      <Text style={styles.intro}>
        Your generous donation helps us continue our mission of bridging humanity
        and AI — funding research like Project ROSIE, free education programs, and
        community initiatives that put people first.
      </Text>

      <View style={styles.donateCard}>
        <Text style={styles.donateTitle}>Make a Donation</Text>
        <Text style={styles.donateBody}>
          Donations are processed securely on our website. Tapping the button below
          opens humanityplusai.org/donate in your browser.
        </Text>
        <GoldButton
          label="Donate on humanityplusai.org"
          icon="heart"
          onPress={() => DonationService.startDonation()}
          testID="button-donate"
        />
        <Text style={styles.finePrint}>
          Humanity + AI, Inc. is a nonprofit organization. Donations are
          tax-deductible to the extent allowed by law.
        </Text>
      </View>

      <View style={{ marginTop: 30 }}>
        <Kicker>Where Your Gift Goes</Kicker>
        <View style={styles.impactList}>
          {impactAreas.map((area) => (
            <View key={area.title} style={styles.impactCard}>
              <View style={styles.impactIcon}>
                <Feather name={area.icon} size={17} color={c.mint} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.impactTitle}>{area.title}</Text>
                <Text style={styles.impactDesc}>{area.desc}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <GradientBar style={{ marginVertical: 30 }} />

      <Kicker>Membership</Kicker>
      <Text style={styles.memberIntro}>
        Join the community behind the mission. Membership is a recurring
        donation — levels and pricing are managed entirely on our website.
      </Text>

      <View style={styles.tierList}>
        {membershipTiers.map((tier) => (
          <View
            key={tier.name}
            style={[styles.tierCard, tier.featured && styles.tierCardFeatured]}
            testID={`card-tier-${tier.name.toLowerCase()}`}
          >
            {tier.featured ? (
              <View style={styles.tierFlag}>
                <Text style={styles.tierFlagText}>MOST POPULAR</Text>
              </View>
            ) : null}
            <View style={styles.tierHeader}>
              <Text style={styles.tierName}>{tier.name}</Text>
            </View>
            <Text style={styles.tierTagline}>{tier.tagline}</Text>
            <View style={styles.perkList}>
              {tier.perks.map((perk) => (
                <View key={perk} style={styles.perkRow}>
                  <Feather name="check" size={14} color={c.mint} />
                  <Text style={styles.perkText}>{perk}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}
      </View>

      <View style={{ marginTop: 18 }}>
        <OutlineButton
          label="Become a Member on Our Website"
          icon="arrow-up-right"
          onPress={() => DonationService.startMembership()}
          testID="button-membership"
        />
      </View>
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
  donateCard: {
    backgroundColor: c.card,
    borderWidth: 1,
    borderColor: "rgba(240,198,116,0.35)",
    borderRadius: 24,
    padding: 20,
    gap: 14,
  },
  donateTitle: {
    color: c.cream,
    fontFamily: fonts.display,
    fontSize: 24,
  },
  donateBody: {
    color: c.mutedForeground,
    fontFamily: fonts.body,
    fontSize: 13.5,
    lineHeight: 20,
  },
  finePrint: {
    color: "rgba(250,249,246,0.45)",
    fontFamily: fonts.body,
    fontSize: 11.5,
    lineHeight: 17,
    textAlign: "center",
  },
  impactList: {
    gap: 12,
    marginTop: 14,
  },
  impactCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    backgroundColor: c.card,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 18,
    padding: 16,
  },
  impactIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(110,231,183,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  impactTitle: {
    color: c.cream,
    fontFamily: fonts.displaySemiBold,
    fontSize: 15.5,
  },
  impactDesc: {
    color: c.mutedForeground,
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 3,
  },
  memberIntro: {
    color: "rgba(250,249,246,0.7)",
    fontFamily: fonts.body,
    fontSize: 14.5,
    lineHeight: 22,
    marginTop: 10,
    marginBottom: 16,
  },
  tierList: {
    gap: 14,
  },
  tierCard: {
    backgroundColor: c.card,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 22,
    padding: 18,
  },
  tierCardFeatured: {
    borderColor: "rgba(240,198,116,0.55)",
  },
  tierFlag: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(240,198,116,0.15)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginBottom: 10,
  },
  tierFlagText: {
    color: c.gold,
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    letterSpacing: 1.5,
  },
  tierHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
  },
  tierName: {
    color: c.cream,
    fontFamily: fonts.display,
    fontSize: 20,
  },
  tierTagline: {
    color: c.mutedForeground,
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
  },
  perkList: {
    gap: 7,
    marginTop: 12,
  },
  perkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  perkText: {
    color: "rgba(250,249,246,0.85)",
    fontFamily: fonts.bodyMedium,
    fontSize: 13.5,
  },
});
