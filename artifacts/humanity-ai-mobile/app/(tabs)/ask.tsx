import { Feather } from "@expo/vector-icons";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { GradientBar, Kicker } from "@/components/ui";
import colors from "@/constants/colors";
import { fonts } from "@/constants/typography";
import {
  ensureConversation,
  loadStoredConversation,
  resetConversation,
  sendChatMessage,
  type ChatMessage,
} from "@/lib/chat";

const c = colors.light;

const STARTERS = [
  "What does Humanity + AI do?",
  "How can I get involved as a volunteer?",
  "Tell me about the AI for Kids program.",
  "What free courses can I take?",
];

interface Bubble {
  key: string;
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
}

export default function AskScreen() {
  const insets = useSafeAreaInsets();
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [restoring, setRestoring] = useState(true);
  const scrollRef = useRef<any>(null);

  // Restore the previous thread so the conversation survives app restarts.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const conv = await loadStoredConversation();
      if (!cancelled && conv?.messages?.length) {
        setBubbles(
          conv.messages.map((m: ChatMessage) => ({
            key: `h-${m.id}`,
            role: m.role,
            content: m.content,
          })),
        );
      }
      if (!cancelled) setRestoring(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const scrollToEnd = useCallback(() => {
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd?.({ animated: true }));
  }, []);

  const send = useCallback(
    async (raw?: string) => {
      const content = (raw ?? input).trim();
      if (!content || busy) return;
      setInput("");
      setBusy(true);
      const userKey = `u-${Date.now()}`;
      const aiKey = `a-${Date.now()}`;
      setBubbles((prev) => [
        ...prev,
        { key: userKey, role: "user", content },
        { key: aiKey, role: "assistant", content: "", streaming: true },
      ]);
      scrollToEnd();
      try {
        const conversationId = await ensureConversation();
        const full = await sendChatMessage(conversationId, content, (partial) => {
          setBubbles((prev) =>
            prev.map((b) => (b.key === aiKey ? { ...b, content: partial } : b)),
          );
          scrollToEnd();
        });
        setBubbles((prev) =>
          prev.map((b) =>
            b.key === aiKey ? { ...b, content: full, streaming: false } : b,
          ),
        );
      } catch (e: any) {
        setBubbles((prev) =>
          prev.map((b) =>
            b.key === aiKey
              ? {
                  ...b,
                  streaming: false,
                  content:
                    e?.message ||
                    "Something went wrong. Please try again in a moment.",
                }
              : b,
          ),
        );
      } finally {
        setBusy(false);
        scrollToEnd();
      }
    },
    [busy, input, scrollToEnd],
  );

  const startFresh = useCallback(async () => {
    if (busy) return;
    await resetConversation();
    setBubbles([]);
  }, [busy]);

  const empty = bubbles.length === 0;

  return (
    <View style={styles.root}>
      <KeyboardAwareScrollViewCompat
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: insets.top + 18,
          paddingHorizontal: 20,
          paddingBottom: 16,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Kicker>Companion</Kicker>
            <Text style={styles.title}>Ask Humanity + AI</Text>
          </View>
          {!empty ? (
            <Pressable
              onPress={startFresh}
              style={({ pressed }) => [styles.newChat, pressed && { opacity: 0.7 }]}
              testID="button-new-chat"
            >
              <Feather name="edit-3" size={13} color={c.mint} />
              <Text style={styles.newChatText}>New chat</Text>
            </Pressable>
          ) : null}
        </View>
        <GradientBar style={{ marginTop: 12, marginBottom: 18 }} />

        {restoring ? (
          <View style={styles.emptyBox}>
            <ActivityIndicator color={c.mint} />
          </View>
        ) : null}

        {!restoring && empty ? (
          <View style={styles.emptyBox}>
            <View style={styles.sparkleBadge}>
              <Feather name="message-circle" size={22} color={c.mint} />
            </View>
            <Text style={styles.emptyTitle}>Your guide to our mission</Text>
            <Text style={styles.emptyBody}>
              Ask anything about our programs, events, research, or how to get
              involved — answered by the same assistant that lives on
              humanityplusai.org.
            </Text>
            <View style={styles.starterList}>
              {STARTERS.map((s) => (
                <Pressable
                  key={s}
                  onPress={() => send(s)}
                  style={({ pressed }) => [styles.starter, pressed && { opacity: 0.75 }]}
                >
                  <Feather name="arrow-up-right" size={13} color={c.gold} />
                  <Text style={styles.starterText}>{s}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        <View style={styles.thread}>
          {bubbles.map((b) => (
            <View
              key={b.key}
              style={[styles.bubble, b.role === "user" ? styles.bubbleUser : styles.bubbleAI]}
            >
              {b.streaming && !b.content ? (
                <ActivityIndicator size="small" color={c.mint} />
              ) : (
                <Text style={b.role === "user" ? styles.bubbleUserText : styles.bubbleAIText}>
                  {b.content}
                </Text>
              )}
            </View>
          ))}
        </View>
      </KeyboardAwareScrollViewCompat>

      <View
        style={[
          styles.inputRow,
          { paddingBottom: Platform.OS === "web" ? 96 : insets.bottom + 64 },
        ]}
      >
        <TextInput
          style={styles.input}
          placeholder="Ask about our mission, programs, events…"
          placeholderTextColor={c.mutedForeground}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={() => send()}
          returnKeyType="send"
          multiline
          testID="input-chat"
        />
        <Pressable
          onPress={() => send()}
          disabled={busy || !input.trim()}
          style={({ pressed }) => [
            styles.sendButton,
            (busy || !input.trim()) && { opacity: 0.4 },
            pressed && { opacity: 0.7 },
          ]}
          testID="button-send"
        >
          {busy ? (
            <ActivityIndicator size="small" color={c.primaryForeground} />
          ) : (
            <Feather name="arrow-up" size={20} color={c.primaryForeground} />
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: c.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 12,
  },
  title: {
    color: c.cream,
    fontFamily: fonts.display,
    fontSize: 30,
    lineHeight: 36,
    marginTop: 8,
  },
  newChat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(110,231,183,0.4)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  newChatText: {
    color: c.mint,
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
  },
  emptyBox: {
    alignItems: "center",
    paddingVertical: 24,
    gap: 12,
  },
  sparkleBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(110,231,183,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    color: c.cream,
    fontFamily: fonts.displaySemiBold,
    fontSize: 19,
  },
  emptyBody: {
    color: c.mutedForeground,
    fontFamily: fonts.body,
    fontSize: 13.5,
    lineHeight: 20,
    textAlign: "center",
  },
  starterList: {
    alignSelf: "stretch",
    gap: 10,
    marginTop: 10,
  },
  starter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: c.card,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  starterText: {
    flex: 1,
    color: "rgba(250,249,246,0.85)",
    fontFamily: fonts.bodyMedium,
    fontSize: 13.5,
  },
  thread: {
    gap: 12,
  },
  bubble: {
    maxWidth: "88%",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  bubbleUser: {
    alignSelf: "flex-end",
    backgroundColor: "rgba(240,198,116,0.16)",
    borderWidth: 1,
    borderColor: "rgba(240,198,116,0.35)",
  },
  bubbleAI: {
    alignSelf: "flex-start",
    backgroundColor: c.card,
    borderWidth: 1,
    borderColor: c.border,
  },
  bubbleUserText: {
    color: c.cream,
    fontFamily: fonts.bodyMedium,
    fontSize: 14.5,
    lineHeight: 21,
  },
  bubbleAIText: {
    color: "rgba(250,249,246,0.86)",
    fontFamily: fonts.body,
    fontSize: 14.5,
    lineHeight: 22,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: c.border,
    backgroundColor: c.backgroundDeep,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    backgroundColor: c.card,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    color: c.cream,
    fontFamily: fonts.body,
    fontSize: 14.5,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: c.primary,
    alignItems: "center",
    justifyContent: "center",
  },
});
