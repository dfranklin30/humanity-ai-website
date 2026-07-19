import { PageMeta } from "@/components/page-meta";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sparkles, Send, Bot, User, Loader2, Plus, Trash2,
  MessageSquare, Brain, Shield, BookOpen, Heart
} from "lucide-react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Conversation } from "@workspace/db";
import { EditorialMasthead } from "@/components/editorial-masthead";
import { SlackCommunity } from "@/components/slack-community";

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5 },
};

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const suggestedQuestions = [
  { icon: Brain, question: "What is Humanity + AI's mission?" },
  { icon: Shield, question: "Tell me about your AI ethics framework" },
  { icon: BookOpen, question: "What is Project ROSIE?" },
  { icon: Heart, question: "How can I support your work?" },
];

export default function AiHub() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: conversationsList } = useQuery<Conversation[]>({ queryKey: ["/api/conversations"] });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streaming]);

  const loadConversation = async (id: number) => {
    try {
      const res = await fetch(`/api/conversations/${id}`);
      const data = await res.json();
      setConversationId(id);
      setMessages(data.messages?.map((m: any) => ({ role: m.role, content: m.content })) || []);
    } catch (error) {
      console.error("Failed to load conversation:", error);
    }
  };

  const newConversation = () => {
    setConversationId(null);
    setMessages([]);
  };

  const deleteConversation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/conversations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      if (conversationId) {
        newConversation();
      }
    },
  });

  const sendMessage = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || streaming) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setStreaming(true);

    try {
      let convId = conversationId;
      if (!convId) {
        const res = await apiRequest("POST", "/api/conversations", { title: text.slice(0, 50) });
        const conv = await res.json();
        convId = conv.id;
        setConversationId(convId);
        queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      }

      const response = await fetch(`/api/conversations/${convId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });

      const reader = response.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
      let assistantContent = "";
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.content) {
              assistantContent += data.content;
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: "assistant", content: assistantContent };
                return updated;
              });
            }
          } catch {}
        }
      }
    } catch {
      setMessages((prev) => [
        ...prev.slice(0, -1),
        { role: "assistant", content: "I'm sorry, I encountered an error. Please try again." },
      ]);
    } finally {
      setStreaming(false);
    }
  };

  return (
    <div>
      <PageMeta
        title="AI Hub — Community Q&A Assistant"
        description="Chat with our AI assistant for answers about Humanity + AI programs, resources, AI ethics, and community initiatives. Powered by OpenAI."
        canonical="/ai-hub"
        noIndex={true}
      />
      <EditorialMasthead kicker="Ask Our AI" title="AI Hub" tagline="Conversations About Our Work" />
      <section className="py-12 bg-gradient-to-br from-primary/5 via-background to-accent/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeIn} className="text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <Sparkles className="h-3.5 w-3.5" />
              AI-Powered
            </div>
            <h1 className="font-serif text-3xl lg:text-4xl font-bold tracking-tight mb-4" data-testid="text-ai-hub-title">
              Community AI Hub
            </h1>
            <p className="text-muted-foreground">
              Ask our AI assistant about our mission, programs, AI ethics, and how you can get involved.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-4 gap-6" style={{ height: "calc(100vh - 320px)", minHeight: "500px" }}>
            <div className="hidden lg:flex flex-col border rounded-lg bg-card">
              <div className="p-3 border-b flex items-center justify-between">
                <h3 className="text-sm font-semibold">Conversations</h3>
                <Button size="icon" variant="ghost" onClick={newConversation} data-testid="button-new-chat">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {(conversationsList || []).map((conv) => (
                  <div
                    key={conv.id}
                    className={`flex items-center justify-between gap-1 px-3 py-2 rounded-md cursor-pointer text-sm group ${
                      conversationId === conv.id ? "bg-accent" : "hover-elevate"
                    }`}
                    onClick={() => loadConversation(conv.id)}
                    data-testid={`conv-${conv.id}`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <MessageSquare className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="truncate text-sm">{conv.title}</span>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteConversation.mutate(conv.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                {(!conversationsList || conversationsList.length === 0) && (
                  <div className="text-center py-8">
                    <MessageSquare className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">No conversations yet</p>
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-3 flex flex-col border rounded-lg bg-card">
              <div className="p-3 border-b flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">H+AI Assistant</h3>
                  <p className="text-[10px] text-muted-foreground">Ask anything about Humanity + AI</p>
                </div>
              </div>

              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center px-4">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <Sparkles className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="font-serif text-xl font-bold mb-2">Welcome to the AI Hub</h3>
                    <p className="text-sm text-muted-foreground max-w-md mb-6">
                      I'm here to help you learn about Humanity + AI, Inc., our programs, and how AI can serve humanity. What would you like to know?
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg w-full">
                      {suggestedQuestions.map((sq, i) => (
                        <button
                          key={i}
                          onClick={() => sendMessage(sq.question)}
                          className="flex items-center gap-2 text-left text-sm px-4 py-3 rounded-md bg-accent hover-elevate"
                          data-testid={`button-suggested-${i}`}
                        >
                          <sq.icon className="h-4 w-4 text-primary shrink-0" />
                          <span>{sq.question}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((msg, i) => (
                  <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    {msg.role === "assistant" && (
                      <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    <div
                      className={`max-w-[75%] rounded-lg px-4 py-3 ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-accent"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    </div>
                    {msg.role === "user" && (
                      <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center shrink-0 mt-0.5">
                        <User className="h-4 w-4 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                ))}

                {streaming && messages[messages.length - 1]?.content === "" && (
                  <div className="flex gap-3">
                    <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                    <div className="bg-accent rounded-lg px-4 py-3 flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Thinking...</span>
                    </div>
                  </div>
                )}
              </div>

              <form
                onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
                className="p-3 border-t flex gap-2"
              >
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about our mission, programs, or AI ethics..."
                  disabled={streaming}
                  data-testid="input-ai-hub-message"
                />
                <Button type="submit" disabled={streaming || !input.trim()} data-testid="button-ai-hub-send">
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>

      <SlackCommunity />
    </div>
  );
}
