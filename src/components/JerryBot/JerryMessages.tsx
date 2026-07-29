import { memo, useEffect, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { Link } from "react-router-dom";
import JerryAvatar from "./JerryAvatar";
import JerryLoading from "./JerryLoading";
import { formatTime } from "@/utils/formatter";
import { jt } from "@/services/translation";
import type { JerryLangCode, JerryMessage, JerryStatus } from "@/types/jerry";
import { cn } from "@/lib/utils";

type Props = {
  messages: JerryMessage[];
  status: JerryStatus;
  lang: JerryLangCode;
  speaking: boolean;
};

/** Internal links open through the router; external links are safe-guarded. */
function MarkdownLink({ href, children }: { href?: string; children?: React.ReactNode }) {
  if (href && href.startsWith("/")) {
    return (
      <Link to={href} className="font-semibold text-primary underline underline-offset-2">
        {children}
      </Link>
    );
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className="font-semibold text-primary underline underline-offset-2"
    >
      {children}
    </a>
  );
}

const Bubble = memo(({ msg, lang }: { msg: JerryMessage; lang: JerryLangCode }) => {
  const isUser = msg.role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn("flex items-end gap-2", isUser && "flex-row-reverse")}
    >
      {!isUser && <JerryAvatar size={28} />}
      <div className={cn("max-w-[85%] space-y-1", isUser && "items-end text-right")}>
        <div
          className={cn(
            "rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm",
            isUser
              ? "rounded-br-sm bg-primary text-primary-foreground"
              : "rounded-bl-sm bg-muted text-foreground",
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap break-words">{msg.content}</p>
          ) : (
            <div className="prose prose-sm max-w-none break-words dark:prose-invert prose-p:my-1.5 prose-ul:my-1.5 prose-headings:mt-2 prose-headings:mb-1">
              <ReactMarkdown components={{ a: MarkdownLink }}>{msg.content}</ReactMarkdown>
            </div>
          )}
        </div>
        <span className="px-1 text-[10px] text-muted-foreground">{formatTime(msg.createdAt)}</span>
      </div>
    </motion.div>
  );
});
Bubble.displayName = "JerryBubble";

const JerryMessages = memo(({ messages, status, lang, speaking }: Props) => {
  const endRef = useRef<HTMLDivElement>(null);

  // Virtualized-lite: only the most recent slice is mounted, keeping long chats fast.
  const visible = useMemo(() => messages.slice(-30), [messages]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [visible.length, status]);

  const waiting = status === "thinking" && !visible[visible.length - 1]?.content;

  return (
    <div className="flex flex-col gap-3 px-3 py-4" role="log" aria-live="polite" aria-relevant="additions text">
      {messages.length === 0 && (
        <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-primary/10 to-transparent p-4">
          <div className="flex items-center gap-3">
            <JerryAvatar size={44} speaking={speaking} />
            <div>
              <p className="font-display text-base font-bold">{jt(lang, "title")}</p>
              <p className="text-xs text-muted-foreground">{jt(lang, "subtitle")}</p>
            </div>
          </div>
          <div className="prose prose-sm mt-3 max-w-none text-foreground dark:prose-invert">
            <ReactMarkdown>{jt(lang, "greeting")}</ReactMarkdown>
          </div>
        </div>
      )}

      {visible.map((m) =>
        m.role === "assistant" && !m.content ? null : <Bubble key={m.id} msg={m} lang={lang} />,
      )}

      {waiting && <JerryLoading lang={lang} />}
      <div ref={endRef} />
    </div>
  );
});

JerryMessages.displayName = "JerryMessages";
export default JerryMessages;
