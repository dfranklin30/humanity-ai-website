import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import colors from "@/constants/colors";
import { brandGradient, fonts } from "@/constants/typography";

const c = colors.light;

/** Scrollable screen wrapper with safe-area padding and brand background. */
export function Screen({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.screenRoot}>
      <ScrollView
        contentContainerStyle={[
          {
            paddingTop: insets.top + 18,
            paddingBottom: insets.bottom + 110,
            paddingHorizontal: 20,
          },
          style,
        ]}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </View>
  );
}

/** The website's signature thin multi-color gradient rule. */
export function GradientBar({ style }: { style?: StyleProp<ViewStyle> }) {
  return (
    <LinearGradient
      colors={[...brandGradient]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={[styles.gradientBar, style]}
    />
  );
}

/** Small uppercase mint kicker line, e.g. "WHAT WE DO". */
export function Kicker({ children }: { children: string }) {
  return <Text style={styles.kicker}>{children.toUpperCase()}</Text>;
}

/** Editorial page masthead: kicker + display title + gradient rule. */
export function Masthead({
  kicker,
  title,
  tagline,
}: {
  kicker: string;
  title: string;
  tagline?: string;
}) {
  return (
    <View style={styles.masthead}>
      <Kicker>{kicker}</Kicker>
      <Text style={styles.mastheadTitle}>{title}</Text>
      {tagline ? <Text style={styles.mastheadTagline}>{tagline}</Text> : null}
      <GradientBar style={{ marginTop: 14 }} />
    </View>
  );
}

/** Rounded pill badge. */
export function Badge({
  label,
  color = c.mint,
}: {
  label: string;
  color?: string;
}) {
  return (
    <View style={[styles.badge, { borderColor: `${color}55` }]}>
      <View style={[styles.badgeDot, { backgroundColor: color }]} />
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

/** Primary gold pill button. */
export function GoldButton({
  label,
  icon,
  onPress,
  testID,
}: {
  label: string;
  icon?: keyof typeof Feather.glyphMap;
  onPress: () => void;
  testID?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [styles.goldButton, pressed && { opacity: 0.85 }]}
    >
      {icon ? <Feather name={icon} size={17} color={c.primaryForeground} /> : null}
      <Text style={styles.goldButtonText}>{label}</Text>
    </Pressable>
  );
}

/** Outline (cream) pill button. */
export function OutlineButton({
  label,
  icon,
  onPress,
  testID,
}: {
  label: string;
  icon?: keyof typeof Feather.glyphMap;
  onPress: () => void;
  testID?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [styles.outlineButton, pressed && { opacity: 0.7 }]}
    >
      {icon ? <Feather name={icon} size={16} color={c.cream} /> : null}
      <Text style={styles.outlineButtonText}>{label}</Text>
    </Pressable>
  );
}

/** Centered loading state. */
export function Loading({ label = "Loading…" }: { label?: string }) {
  return (
    <View style={styles.centerBox}>
      <ActivityIndicator color={c.mint} size="large" />
      <Text style={styles.centerText}>{label}</Text>
    </View>
  );
}

/** Centered error state with retry. */
export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <View style={styles.centerBox}>
      <Feather name="wifi-off" size={28} color={c.mutedForeground} />
      <Text style={styles.centerText}>{message}</Text>
      {onRetry ? <OutlineButton label="Try Again" icon="refresh-cw" onPress={onRetry} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screenRoot: {
    flex: 1,
    backgroundColor: c.background,
  },
  gradientBar: {
    height: 3,
    borderRadius: 2,
  },
  kicker: {
    color: c.mint,
    fontFamily: fonts.bodySemiBold,
    fontSize: 11,
    letterSpacing: 3,
  },
  masthead: {
    marginBottom: 22,
  },
  mastheadTitle: {
    color: c.cream,
    fontFamily: fonts.display,
    fontSize: 40,
    lineHeight: 44,
    marginTop: 8,
  },
  mastheadTagline: {
    color: c.mutedForeground,
    fontFamily: fonts.body,
    fontSize: 14,
    marginTop: 6,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  badgeText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 11,
    letterSpacing: 0.5,
  },
  goldButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: c.primary,
    borderRadius: 999,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  goldButtonText: {
    color: c.primaryForeground,
    fontFamily: fonts.bodyBold,
    fontSize: 15,
  },
  outlineButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(250,249,246,0.35)",
    borderRadius: 999,
    paddingVertical: 13,
    paddingHorizontal: 22,
  },
  outlineButtonText: {
    color: c.cream,
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
  },
  centerBox: {
    alignItems: "center",
    gap: 12,
    paddingVertical: 60,
  },
  centerText: {
    color: c.mutedForeground,
    fontFamily: fonts.body,
    fontSize: 14,
    textAlign: "center",
  },
});
