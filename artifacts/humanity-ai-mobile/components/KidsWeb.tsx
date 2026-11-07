/**
 * One AI for Kids page, inside the app.
 *
 * The Studio, the Hub and the Facilitator dashboard all live at
 * aiforkids.humanityplusai.org and are built for touch screens already, so
 * the app shows the real pages rather than copies of them: every room, the
 * Arcade and Lounge, the roster and approvals are exactly what a laptop
 * shows. This panel is the window: it keeps links inside the site, hands
 * anything else to the phone's browser, lets the Android back button walk
 * back through pages, offers the camera for Homework Help photos, and shows
 * a plain retry screen when the connection drops.
 *
 * All three panels share the app's cookie jar, so a child who signs in on
 * the Studio is signed in on the Hub too, and a facilitator stays signed in
 * between visits.
 */
import { Feather } from "@expo/vector-icons";
import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { ActivityIndicator, BackHandler, Linking, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { WebView, type WebViewNavigation } from "react-native-webview";

import { useColors } from "@/hooks/useColors";
import { fonts } from "@/constants/typography";

export const KIDS_ORIGIN = "https://aiforkids.humanityplusai.org";

/** Pages that stay inside the panel. Anything else is handed to the browser. */
const INSIDE = ["aiforkids.humanityplusai.org", "humanityplusai.org", "www.humanityplusai.org"];

export function stayInside(url: string): boolean {
  try {
    const u = new URL(url);
    if (u.protocol === "about:" || u.protocol === "blob:" || u.protocol === "data:") return true;
    return u.protocol === "https:" && INSIDE.includes(u.hostname);
  } catch {
    return false;
  }
}

export type KidsWebHandle = {
  goBack: () => boolean;
  reload: () => void;
  /** Loads a page inside the panel (a deep link, for instance). */
  open: (url: string) => void;
};

export const KidsWeb = forwardRef<
  KidsWebHandle,
  {
    url: string;
    /** Only the panel on screen answers the hardware back button. */
    active: boolean;
    testID: string;
  }
>(function KidsWeb({ url, active, testID }, ref) {
  const colors = useColors();
  const web = useRef<WebView>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [source, setSource] = useState(url);
  const [key, setKey] = useState(0);

  const reload = useCallback(() => {
    setFailed(false);
    setLoading(true);
    setKey((k) => k + 1);
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      goBack: () => {
        if (!canGoBack || !web.current) return false;
        web.current.goBack();
        return true;
      },
      reload,
      open: (next) => {
        if (!stayInside(next)) return;
        setFailed(false);
        setSource(next);
        setKey((k) => k + 1);
      },
    }),
    [canGoBack, reload],
  );

  // Android: the hardware back button goes back inside the page first.
  useEffect(() => {
    if (Platform.OS !== "android" || !active) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (canGoBack && web.current) {
        web.current.goBack();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [active, canGoBack]);

  const onNav = useCallback((nav: WebViewNavigation) => setCanGoBack(nav.canGoBack), []);

  if (failed) {
    return (
      <View style={styles.center} testID={`${testID}-offline`}>
        <Feather name="wifi-off" size={28} color={colors.mutedForeground} />
        <Text style={[styles.message, { color: colors.foreground }]}>Couldn't reach AI for Kids. Check your connection and try again.</Text>
        <Pressable accessibilityRole="button" onPress={reload} style={[styles.retry, { borderColor: colors.gold }]} testID={`${testID}-retry`}>
          <Text style={[styles.retryText, { color: colors.gold }]}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <WebView
        key={key}
        ref={web}
        source={{ uri: source }}
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
        // Sign-ins and robot choices live in cookies and web storage; movies and songs play inline.
        javaScriptEnabled
        domStorageEnabled
        sharedCookiesEnabled
        thirdPartyCookiesEnabled={false}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        allowsBackForwardNavigationGestures
        setSupportMultipleWindows={false}
        pullToRefreshEnabled
        // Homework Help can take a photo of a worksheet: the page's file picker
        // offers the camera (Android asks for permission the first time).
        // No microphone or location: the pages never ask for them in the app;
        // the keyboard's own voice typing fills any box.
        geolocationEnabled={false}
        cacheEnabled
        applicationNameForUserAgent="HumanityPlusAI-App"
        testID={`${testID}-webview`}
      />
      {loading && (
        <View pointerEvents="none" style={styles.loading}>
          <ActivityIndicator size="large" color={colors.gold} />
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  root: { flex: 1 },
  web: { flex: 1, backgroundColor: "#f8f7ff" },
  loading: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 14 },
  message: { textAlign: "center", fontFamily: fonts.body, fontSize: 15, lineHeight: 22 },
  retry: { marginTop: 6, borderWidth: 1.5, borderRadius: 999, paddingHorizontal: 22, paddingVertical: 10 },
  retryText: { fontFamily: fonts.displaySemiBold, fontSize: 15 },
});
