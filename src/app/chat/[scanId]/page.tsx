"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Send, ShieldAlert, AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Message {
  id: string;
  scan_id: string;
  sender_type: "scanner" | "owner";
  content: string;
  is_read: boolean;
  created_at: string;
}

const SCANNER_QUICK_REPLIES = [
  "Thank you! I'll wait 🙏",
  "Please hurry, I'm getting late ⏰",
  "How long will you be?",
  "Should I contact security?",
];

const OWNER_QUICK_REPLIES = [
  "Coming in 2 mins! 🏃",
  "Please wait, on my way",
  "Someone else will move it",
  "Sorry for the inconvenience 🙏",
];

export default function ChatPage({ params }: { params: { scanId: string } }) {
  const searchParams = useSearchParams();
  const role = (searchParams.get("role") || "scanner") as "scanner" | "owner";
  const scanId = params.scanId;

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const quickReplies = role === "scanner" ? SCANNER_QUICK_REPLIES : OWNER_QUICK_REPLIES;

  // Fetch existing messages
  const fetchMessages = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("scan_id", scanId)
      .order("created_at", { ascending: true });

    if (data) setMessages(data as Message[]);
  }, [scanId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Supabase Realtime for new messages
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("chat-" + scanId)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: "scan_id=eq." + scanId,
        },
        (payload: { new: Record<string, unknown> }) => {
          const newMsg = payload.new as unknown as Message;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [scanId]);

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || sending) return;
    setSending(true);

    try {
      const res = await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scanId, content: content.trim(), senderType: role }),
      });

      if (!res.ok) {
        const data = await res.json();
        console.error("Send error:", data.error);
      }
      setInput("");
    } catch (err) {
      console.error("Send failed:", err);
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <div className="bg-secondary text-white px-4 py-4 flex items-center gap-3 shadow-lg sticky top-0 z-10">
        <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
          <span className="text-lg font-bold text-primary">P</span>
        </div>
        <div className="flex-1">
          <h1 className="font-bold text-lg">Anonymous Chat</h1>
          <p className="text-xs text-gray-400">
            {role === "scanner" ? "Chatting with car owner" : "Chatting with scanner"}
          </p>
        </div>
      </div>

      {/* Warning Banner */}
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center gap-2 text-xs text-amber-800 font-medium">
        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
        <span>Do not share personal contact details in this chat.</span>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 py-12">
            <p className="text-sm font-medium">No messages yet. Start the conversation!</p>
          </div>
        )}

        {messages.map((msg, i) => {
          const isMine = msg.sender_type === role;
          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              className={`flex ${isMine ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 shadow-sm ${
                  isMine
                    ? "bg-orange-500 text-white rounded-br-md"
                    : "bg-secondary text-white rounded-bl-md"
                }`}
              >
                <p className="text-xs font-semibold uppercase tracking-wider opacity-70 mb-1">
                  {isMine ? "You" : msg.sender_type === "scanner" ? "Scanner" : "Owner"}
                </p>
                <p className="text-sm leading-relaxed">{msg.content}</p>
                <p className={`text-[10px] mt-1 text-right ${isMine ? "text-white/60" : "text-gray-400"}`}>
                  {formatTime(msg.created_at)}
                  {isMine && <span className="ml-1">{msg.is_read ? "✓✓" : "✓"}</span>}
                </p>
              </div>
            </motion.div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Quick Replies */}
      <div className="px-4 py-2 flex gap-2 overflow-x-auto scrollbar-hide border-t border-gray-200 bg-white">
        {quickReplies.map((text) => (
          <button
            key={text}
            onClick={() => sendMessage(text)}
            className="shrink-0 px-3 py-1.5 rounded-full bg-gray-100 text-xs font-medium text-gray-700 hover:bg-primary/10 hover:text-primary transition-colors whitespace-nowrap"
          >
            {text}
          </button>
        ))}
      </div>

      {/* Input Bar */}
      <form
        onSubmit={handleSubmit}
        className="px-4 py-3 bg-white border-t border-gray-200 flex items-center gap-3 sticky bottom-0"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 bg-gray-100 rounded-full px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
          disabled={sending}
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          className="w-10 h-10 bg-orange-500 hover:bg-orange-600 text-white rounded-full flex items-center justify-center disabled:opacity-50 transition-colors shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

      {/* Footer */}
      <div className="bg-gray-50 px-4 py-2 text-center">
        <p className="text-[10px] text-gray-400 flex items-center justify-center gap-1">
          <ShieldAlert className="w-3 h-3" /> Powered by ParkPing • Misuse is logged
        </p>
      </div>
    </div>
  );
}
