import { useState, useRef, useEffect } from "react";
import { sendChatMessage } from "../services/aiService";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  isError?: boolean;
}

const SUGGESTED_PROMPTS = [
  "What is our current balance?",
  "How much did we spend this month?",
  "What was our biggest expense?",
  "How many members have not paid?",
  "How is our cash condition this month?",
];

function renderSafeContent(text: string) {
  return text.split("\n").map((line, lineIndex) => {
    const parts = line.split(/(\*\*.*?\*\*)/g);
    return (
      <span key={lineIndex}>
        {lineIndex > 0 && <br />}
        {parts.map((part, partIndex) =>
          part.startsWith("**") && part.endsWith("**")
            ? <strong key={partIndex}>{part.slice(2, -2)}</strong>
            : <span key={partIndex}>{part}</span>
        )}
      </span>
    );
  });
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center shrink-0 mt-0.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275Z" />
          </svg>
        </div>
      )}
      <div
        className={`max-w-[calc(100vw-5rem)] sm:max-w-md rounded-xl px-4 py-3 text-sm leading-relaxed break-words ${
          isUser
            ? "bg-blue-500 text-white rounded-tr-sm"
            : message.isError
            ? "bg-red-50 border border-red-200 text-red-700 rounded-tl-sm"
            : "bg-white border border-slate-200 text-slate-800 rounded-tl-sm"
        }`}
      >
        {renderSafeContent(message.content)}
      </div>
      {isUser && (
        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-semibold text-xs shrink-0 mt-0.5">
          DA
        </div>
      )}
    </div>
  );
}

export default function AIAssistant({ groupName }: { groupName: string }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "0",
      role: "assistant",
      content:
        "Hi! I can help you understand your group's financial data. Ask me anything about the balance, transactions, or contribution status.",
    },
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || thinking) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setThinking(true);

    try {
      const result = await sendChatMessage(text, sessionId);

      // Preserve Langflow session ID for conversation threading
      if (result.sessionId) setSessionId(result.sessionId);

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: result.message,
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: unknown) {
      const errorText =
        err instanceof Error
          ? err.message
          : "Sorry, I couldn't reach the AI service. Please try again.";

      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: errorText,
        isError: true,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setThinking(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="sc-ai flex min-h-0 flex-col h-full max-h-[calc(100dvh-56px)]">
      {/* Context indicator */}
      <div className="bg-white border-b border-slate-200 px-5 py-2.5 flex items-center gap-2 shrink-0">
        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
        <span className="text-xs text-slate-500 font-medium">Using your group&apos;s financial data</span>
        <span className="text-slate-300 mx-1">·</span>
        <span className="text-xs text-slate-400">{groupName}</span>
      </div>

      {/* Message area */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-5 py-5 space-y-5">
        <div className="max-w-2xl mx-auto space-y-5">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}

          {thinking && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center shrink-0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275Z" />
                </svg>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl rounded-tl-sm px-4 py-3">
                <div className="flex gap-1 items-center h-5">
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Suggested prompts */}
      {messages.length <= 1 && (
        <div className="px-5 pb-3 shrink-0">
          <div className="max-w-2xl mx-auto">
            <div className="text-xs text-slate-400 mb-2 font-medium">Suggested questions</div>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  className="text-xs bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 text-slate-600 hover:text-blue-700 rounded-full px-3 py-1.5 transition-all font-medium"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="bg-white border-t border-slate-200 px-5 py-3 shrink-0">
        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your group's finances…"
              disabled={thinking}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={!input.trim() || thinking}
              className="w-10 h-10 bg-blue-500 hover:bg-blue-600 disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition-colors shrink-0"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </form>
          <p className="text-[10px] text-slate-400 mt-2 text-center">
            AI is read-only. It cannot modify financial records.
          </p>
        </div>
      </div>
    </div>
  );
}
