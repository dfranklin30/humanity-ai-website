/**
 * Kids AI Studio, inside the app.
 *
 * The Studio lives at aiforkids.humanityplusai.org and is built for touch
 * screens already, so this tab is a window onto it rather than a copy of it:
 * a child in a club signs in with the class code exactly as on a laptop, and
 * every room (Game Maker, Story Maker, Video Maker, the 3D Robotics Lab…)
 * is the real thing. Links that leave the Studio open in the phone's browser,
 * and the Android back button walks back through the Studio's pages before
 * it leaves the tab.
 */
import { Feather } from "@expo/vector-icons";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, BackHandler, Linking, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView, type WebViewNavigation } from "react-native-webview";

import { useColors } from "@/hooks/useColors";
import { fonts } from "@/constants/typography";

export const STUDIO_URL = "https://aiforkids.humanityplusai.org/aiforkids/studio";

/** Pages that stay inside the tab. Anything else is handed to the browser. */
const INSIDE = ["aiforkids.humanityplusai.org", "humanityplusai.org", "www.humanityplusai.org"];

function stayInside(url: string): boolean {
  try {
    const u = new URL(url);
    return (u.protocol === "https:" || u.protocol === "about:") && (u.protocol === "about:" || INSIDE.includes(u.hostname));
  } catch {
    return false;
  }
}

export default function StudioScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const web = useRef<WebView>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [key, setKey] = useState(0);

  // Android: the hardware back button goes back inside the Studio first.
  useEffect(() => {
    if (Platform.OS !== "android") return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (canGoBack && web.current) {
        web.current.goBack();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [canGoBack]);

  const onNav = useCallback((nav: WebViewNavigation) => setCanGoBack(nav.canGoBack), []);

  const reload = () => {
    setFailed(false);
    setLoading(true);
    setKey((k) => k + 1);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.backgroundDeep, paddingTop: insets.top }]}>
      <View style={[styles.bar, { borderBottomColor: colors.border }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          disabled={!canGoBack}
          onPress={() => web.current?.goBack()}
          style={({ pressed }) => [styles.barButton, { opacity: canGoBack ? (pressed ? 0.6 : 1) : 0.3 }]}
          testID="studio-back"
        >
          <Feather name="chevron-left" size={22} color={colors.gold} />
        </Pressable>
        <Text style={[styles.barTitle, { color: colors.foreground }]} numberOfLines={1}>
          Kids AI Studio
        </Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Reload" onPress={reload} style={({ pressed }) => [styles.barButton, { opacity: pressed ? 0.6 : 1 }]} testID="studio-reload">
          <Feather name="refresh-cw" size={18} color={colors.gold} />
        </Pressable>
      </View>

      {failed ? (
        <View style={styles.center}>
          <Feather name="wifi-off" size={28} color={colors.mutedForeground} />
          <Text style={[styles.message, { color: colors.foreground }]}>Couldn't reach the Studio. Check your connection and try again.</Text>
          <Pressable accessibilityRole="button" onPress={reload} style={[styles.retry, { borderColor: colors.gold }]} testID="studio-retry">
            <Text style={[styles.retryText, { color: colors.gold }]}>Try again</Text>
          </Pressable>
        </View>
      ) : (
        <WebView
          key={key}
          ref={web}
          source={{ uri: STUDIO_URL }}
          style={styles.web}
          onNavigationStateChange={onNav}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          onError={() => setFailed(true)}
          onHttpError={(e) => {
            if (e.nativeEvent.statusCode >= 500) setFailed(true);
          }}
          onShouldStartLoadWithRequest={(req) => {
            if (stayInside(req.url)) return true;
            void Linking.openURL(req.url);
            return false;
          }}
          // The Studio keeps a child's sign-in and robot choices in web storage; movies and songs play inline.
          javaScriptEnabled
          domStorageEnabled
          sharedCookiesEnabled
          thirdPartyCookiesEnabled={false}
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          allowsBackForwardNavigationGestures
          setSupportMultipleWindows={false}
          pullToRefreshEnabled
          // No camera, microphone or location: the Studio never asks for them.
          geolocationEnabled={false}
          cacheEnabled
          applicationNameForUserAgent="HumanityPlusAI-App"
          testID="studio-webview"
        />
      )}

      {loading && !failed && (
        <View pointerEvents="none" style={styles.loading}>
          <ActivityIndicator size="large" color={colors.gold} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  bar: {
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  barButton: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  barTitle: { flex: 1, textAlign: "center", fontFamily: fonts.displaySemiBold, fontSize: 16 },
  web: { flex: 1, backgroundColor: "#f8f7ff" },
  loading: { position: "absolute", left: 0, right: 0, top: 44, bottom: 0, alignItems: "center", justifyContent: "center" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 14 },
  message: { textAlign: "center", fontFamily: fonts.body, fontSize: 15, lineHeight: 22 },
  retry: { marginTop: 6, borderWidth: 1.5, borderRadius: 999, paddingHorizontal: 22, paddingVertical: 10 },
  retryText: { fontFamily: fonts.displaySemiBold, fontSize: 15 },
});
