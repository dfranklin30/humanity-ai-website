import { useQuery } from "@tanstack/react-query";
import { SiSlack } from "react-icons/si";
import { Hash } from "lucide-react";
import { motion } from "framer-motion";
import { SLACK_INVITE_URL } from "@/lib/community";

interface CommunityMessage {
  id: string;
  authorName: string;
  authorAvatar: string | null;
  text: string;
  ts: number;
}

interface CommunityFeed {
  connected: boolean;
  channelName: string | null;
  messages: CommunityMessage[];
}

const AUBERGINE = "#4A154B";
const SLACK_GREEN = "#007a5a";

function slackTime(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const time = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  if (d.toDateString() === now.toDateString()) return time;
  return `${d.toLocaleDateString([], { month: "short", day: "numeric" })} ${time}`;
}

function initials(name: string): string {
  return (
    name
      .split(/\s+/)
      .map((p) => p[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "M"
  );
}

function MessageRow({ m }: { m: CommunityMessage }) {
  return (
    <div
      className="flex gap-2.5 px-4 py-2 hover:bg-black/[0.03] dark:hover:bg-white/[0.04]"
      data-testid={`card-slack-message-${m.id}`}
    >
      {m.authorAvatar ? (
        <img
          src={m.authorAvatar}
          alt={m.authorName}
          className="h-9 w-9 rounded-md object-cover shrink-0"
        />
      ) : (
        <div className="h-9 w-9 rounded-md bg-[#4A154B] text-white flex items-center justify-center text-xs font-semibold shrink-0">
          {initials(m.authorName)}
        </div>
      )}
      <div className="min-w-0">
        <div className="flex items-baseline gap-2">
          <span
            className="font-bold text-[15px] leading-tight text-[#1d1c1d] dark:text-white"
            data-testid={`text-slack-author-${m.id}`}
          >
            {m.authorName}
          </span>
          <span className="text-[11px] text-[#616061] dark:text-[#9a9b9d]">{slackTime(m.ts)}</span>
        </div>
        <p className="text-[15px] leading-snug text-[#1d1c1d] dark:text-[#d1d2d3] whitespace-pre-wrap break-words">
          {m.text}
        </p>
      </div>
    </div>
  );
}

export function SlackCommunity({ className = "border-t border-border" }: { className?: string } = {}) {
  const { data, isLoading } = useQuery<CommunityFeed>({
    queryKey: ["/api/community/slack"],
    refetchInterval: 60000,
  });

  const messages = data?.messages ?? [];
  const channel = data?.channelName || "all-humanityplusai";

  return (
    <section className={`py-16 ${className}`}>
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        {/* Attention-drawing heading */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest font-bold text-primary mb-3">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            Live from our Slack
          </div>
          <h2
            className="font-serif text-3xl lg:text-4xl font-bold tracking-tight"
            data-testid="text-slack-community-title"
          >
            Join the conversation on Slack
          </h2>
          <p className="text-muted-foreground mt-3 max-w-lg mx-auto">
            See what our community is talking about right now in{" "}
            <span className="font-medium text-foreground">#{channel}</span> — then jump in and say hello.
          </p>
        </div>

        {/* Slack-style window */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="rounded-xl overflow-hidden border border-black/10 dark:border-white/10 shadow-2xl bg-white dark:bg-[#1a1d21]"
        >
          {/* Workspace bar */}
          <div
            className="flex items-center gap-2 px-4 py-2.5"
            style={{ backgroundColor: AUBERGINE }}
          >
            <SiSlack className="h-4 w-4 text-white" />
            <span className="text-white font-semibold text-sm">Humanity + AI</span>
            <span className="ml-auto flex items-center gap-1.5 text-[11px] text-white/70">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "#2bac76" }} />
              Online
            </span>
          </div>

          {/* Channel header */}
          <div className="flex items-center gap-2 border-b border-black/10 dark:border-white/10 px-4 py-3">
            <Hash className="h-4 w-4 text-[#616061] dark:text-[#ababad]" />
            <span className="font-bold text-[15px] text-[#1d1c1d] dark:text-white">{channel}</span>
          </div>

          {/* Messages */}
          <div className="max-h-[440px] overflow-y-auto py-2">
            {isLoading ? (
              [0, 1, 2].map((i) => (
                <div key={i} className="flex gap-2.5 px-4 py-2 animate-pulse">
                  <div className="h-9 w-9 rounded-md bg-black/10 dark:bg-white/10 shrink-0" />
                  <div className="flex-1">
                    <div className="h-3 w-28 bg-black/10 dark:bg-white/10 rounded mb-2" />
                    <div className="h-3 w-3/4 bg-black/10 dark:bg-white/10 rounded" />
                  </div>
                </div>
              ))
            ) : messages.length > 0 ? (
              messages.map((m) => <MessageRow key={m.id} m={m} />)
            ) : (
              <div className="px-4 py-14 text-center">
                <div
                  className="mx-auto mb-3 h-11 w-11 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${AUBERGINE}1a` }}
                >
                  <SiSlack className="h-5 w-5" style={{ color: AUBERGINE }} />
                </div>
                <p className="font-bold text-[#1d1c1d] dark:text-white">You're early to the channel</p>
                <p className="text-sm text-[#616061] dark:text-[#ababad] mt-1">
                  Messages from #{channel} will show up here. Be the first to say hello.
                </p>
              </div>
            )}
          </div>

          {/* Composer / join CTA */}
          <a
            href={SLACK_INVITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="block border-t border-black/10 dark:border-white/10 p-3 group"
            data-testid="button-join-slack-community"
          >
            <div className="flex items-center gap-2 rounded-lg border border-black/15 dark:border-white/15 px-3 py-2 transition-colors group-hover:border-[#007a5a]/60">
              <span className="flex-1 text-sm text-[#616061] dark:text-[#ababad]">
                Join to send a message…
              </span>
              <span
                className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold text-white transition-opacity group-hover:opacity-90"
                style={{ backgroundColor: SLACK_GREEN }}
              >
                <SiSlack className="h-3.5 w-3.5" />
                Join our Slack
              </span>
            </div>
          </a>
        </motion.div>
      </div>
    </section>
  );
}
