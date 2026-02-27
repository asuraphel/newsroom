"use client";

import { useChat } from "@ai-sdk/react";
import { useState, useMemo, useRef, useEffect } from "react";
import { DefaultChatTransport } from "ai";
import ControlsSidebar from "@/components/ControlsSidebar";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { QuickStart } from "@/components/QuickStart";

const SUMMARY_PROMPTS = {
  paragraph: "Please provide a one paragraph TLDR summary of this article:",
  bullets:
    "Please provide a concise bulleted list summary of the key points for this article:",
  "one-sentence":
    "Please provide a single, punchy TLDR sentence for this article:",
};

export default function Chat() {
  const [input, setInput] = useState("");
  const [selectedModel, setSelectedModel] = useState("openai/gpt-4.1-nano");
  const [summaryStyle, setSummaryStyle] = useState<
    "paragraph" | "bullets" | "one-sentence"
  >("paragraph");

  // Track which articles are being summarized
  const [summarizingIds, setSummarizingIds] = useState<Set<string>>(new Set());
  // Store summaries by article ID
  const [summaries, setSummaries] = useState<Record<string, string>>({});

  const transport = useMemo(
    () => new DefaultChatTransport({ body: { model: selectedModel } }),
    [selectedModel],
  );
  const { messages, sendMessage, setMessages, status, stop } = useChat({
    id: `chat-session`,
    // -${selectedModel}`,
    transport: transport,
    onFinish: (message) => {
      console.log("Message arrived:", message);
      //debugger;

      if (message.toolInvocations) {
        message.toolInvocations.forEach((invocation) => {
          if (
            invocation.toolName === "summarize_article" &&
            invocation.state === "output-available"
          ) {
            const { output } = invocation;
            // Extract article ID from the tool call args or generate a key
            const articleKey = output.url || invocation.args.articleUrl;

            setSummarizingIds((prev) => {
              const next = new Set(prev);
              next.delete(articleKey);
              return next;
            });
          }
        });
      }
    },
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const isLoading = status === "submitted" || status === "streaming";

  const handleSummarize = (article: any) => {
    const articleId = article.link;

    // if (summarizingIds.has(articleId) || summaries[articleId]) return;

    setSummarizingIds((prev) => new Set(prev).add(articleId));

    const promptBase = SUMMARY_PROMPTS[summaryStyle];

    sendMessage(
      {
        text: `${promptBase} "${article.title}" at ${article.link}`,
      },
      {
        body: {
          model: selectedModel,
        },
      },
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-800 font-sans">
      <ControlsSidebar
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
        summaryStyle={summaryStyle}
        onSummaryStyleChange={setSummaryStyle}
      />

      <div className="flex-1 flex flex-col min-h-screen md:pl-[280px] transition-[padding] duration-250 px-4">
        {messages.length === 0 ? (
          <QuickStart
            onSuggest={(prompt) => {
              sendMessage(
                { text: prompt },
                {
                  body: {
                    model: selectedModel,
                  },
                },
              );
            }}
          />
        ) : (
          <div className="flex-1 overflow-y-auto space-y-6 max-w-4xl mx-auto w-full pb-[40%] md:pb-[30%] pt-8 px-4 md:px-0">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                } items-start gap-3`}
              >
                {message.role !== "user" && (
                  <div className="w-8 h-8 rounded-full border border-slate-200 bg-white shadow-sm flex items-center justify-center mt-1 text-slate-400">
                    <span className="text-xs">✦</span>
                  </div>
                )}

                <div
                  className={`max-w-[90%] px-4 py-2 rounded-2xl text-sm leading-relaxed ${
                    message.role === "user"
                      ? "bg-blue-600 text-white shadow-sm rounded-br-none"
                      : "bg-transparent text-slate-700"
                  }`}
                >
                  {message.parts.map((part, i) => {
                    switch (part.type) {
                      case "text":
                        return (
                          <div
                            key={`${message.id}-${i}`}
                            className="whitespace-pre-wrap prose prose-slate max-w-none"
                          >
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {part.text}
                            </ReactMarkdown>
                          </div>
                        );

                      case "tool-summarize_article":
                        const isFinishedSummary =
                          part.state === "output-available";
                        const isCancelledSummary =
                          !isFinishedSummary && !isLoading;
                        const summaryInput = part.input;
                        const summaryResult = part.output;

                        return (
                          <div
                            key={`${message.id}-${i}`}
                            className="my-3 px-4 py-3 bg-white border border-slate-200 shadow-sm rounded-xl font-mono text-[11px]"
                          >
                            <div className="flex items-center justify-between gap-4">
                              {/* Left Side: Icon and Status */}
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="relative flex h-2 w-2">
                                  {/* The Blinking/Pulse effect */}
                                  {!isFinishedSummary &&
                                    !isCancelledSummary && (
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    )}
                                  <span
                                    className={`relative inline-flex h-2 w-2 rounded-full ${isFinishedSummary ? "bg-emerald-500" : isCancelledSummary ? "bg-red-500" : "bg-emerald-600"}`}
                                  ></span>
                                </div>

                                <span
                                  className={`font-bold uppercase tracking-tight whitespace-nowrap ${
                                    isFinishedSummary
                                      ? "text-slate-500"
                                      : isCancelledSummary
                                        ? "text-red-500"
                                        : "text-emerald-600 animate-pulse"
                                  }`}
                                >
                                  {isFinishedSummary
                                    ? "Summary Ready"
                                    : isCancelledSummary
                                      ? "Summarizing Stopped"
                                      : "Summarizing News"}
                                </span>

                                {/* Scrolling text effect for the title */}
                                <span className="text-slate-500 truncate italic border-l border-slate-200 pl-3">
                                  {summaryInput?.articleTitle ||
                                    "Reading content..."}
                                </span>
                              </div>

                              {/* Right Side: Execution Result or Loading Dots */}
                              <div className="shrink-0 font-bold">
                                {isFinishedSummary ? (
                                  <span className="text-emerald-600/80">
                                    DONE
                                  </span>
                                ) : isCancelledSummary ? (
                                  <button
                                    onClick={() =>
                                      handleSummarize(summaryInput)
                                    }
                                    className="text-[9px] hidden uppercase tracking-wider px-2 py-0.5 rounded border border-red-500/30 text-red-500 hover:bg-red-50 transition-colors"
                                  >
                                    Retry
                                  </button>
                                ) : (
                                  <div className="flex gap-1">
                                    <span className="animate-[bounce_1s_infinite_100ms] text-emerald-500">
                                      .
                                    </span>
                                    <span className="animate-[bounce_1s_infinite_200ms] text-emerald-500">
                                      .
                                    </span>
                                    <span className="animate-[bounce_1s_infinite_300ms] text-emerald-500">
                                      .
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Cancelled Info */}
                            {isCancelledSummary && (
                              <div className="mt-2 pt-2 border-t border-slate-100 text-slate-500 text-[10px] leading-relaxed animate-in fade-in slide-in-from-top-1">
                                This process was interrupted.
                              </div>
                            )}

                            {/* The Output (Shown only when finished) */}
                            {isFinishedSummary && (
                              <div className="mt-2 pt-2 border-t border-slate-100 text-slate-700 leading-relaxed animate-in fade-in slide-in-from-top-1">
                                {summaryResult?.error ? (
                                  <span className="text-red-500">
                                    Error: {summaryResult.error}
                                  </span>
                                ) : (
                                  <div className="flex flex-col gap-1">
                                    <span className="text-[9px] text-slate-400 uppercase font-bold">
                                      Source Content Extracted
                                    </span>
                                    <span className="text-slate-500 italic">
                                      {/* This confirms to the user the content was found and passed to the AI */}
                                      Successfully retrieved{" "}
                                      {summaryResult?.content?.slice(0, 100)}...
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );

                      case "tool-news":
                        const isFinishedNews =
                          part.state === "output-available";
                        const isCancelledNews = !isFinishedNews && !isLoading;
                        const articles = part.output || [];
                        const query = part.input?.query;

                        if (isCancelledNews) {
                          return (
                            <div
                              key={`${message.id}-${i}`}
                              className={`flex items-center justify-between bg-slate-50/80 py-3 border-b border-slate-100`}
                            >
                              <div
                                className={`h-2 w-2 rounded-full mr-2 bg-red-500`}
                              />
                              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 min-w-100">
                                News search for{" "}
                                <span className="text-slate-800 font-semibold">
                                  {query}
                                </span>{" "}
                                was cancelled.
                              </span>
                            </div>
                          );
                        }

                        if (!isFinishedNews) {
                          return (
                            <div
                              key={`${message.id}-${i}`}
                              className={`flex items-center justify-between bg-slate-50/80 py-3 border-b border-slate-100`}
                            >
                              <div
                                className={`h-2 w-2 rounded-full mr-2 bg-blue-500 animate-pulse`}
                              />
                              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 min-w-100">
                                {isFinishedNews
                                  ? `News for "${query}"`
                                  : isCancelledNews
                                    ? `Search Cancelled: "${query}"`
                                    : "Scouring the headlines..."}
                              </span>
                            </div>
                          );
                        }

                        return (
                          <div
                            key={`${message.id}-${i}`}
                            className={`my-4 overflow-hidden rounded-2xl border transition-all duration-500 shadow-sm ${
                              isFinishedNews
                                ? "bg-white border-slate-200"
                                : isCancelledNews
                                  ? "bg-red-50 border-red-200"
                                  : "bg-blue-50 border-blue-200 animate-pulse"
                            }`}
                          >
                            {/* Header */}
                            <div
                              className={`flex items-center justify-between bg-slate-50/80 px-4 py-3 border-b border-slate-100`}
                            >
                              <div className="flex items-center gap-2">
                                <div
                                  className={`h-2 w-2 rounded-full ${
                                    isFinishedNews
                                      ? "bg-emerald-500"
                                      : isCancelledNews
                                        ? "bg-red-500"
                                        : "bg-blue-500 animate-pulse"
                                  }`}
                                />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 min-w-100">
                                  {isFinishedNews
                                    ? `News for "${query}"`
                                    : isCancelledNews
                                      ? `Search Cancelled: "${query}"`
                                      : "Scouring the headlines..."}
                                </span>
                              </div>
                            </div>
                            {/* Articles Container */}
                            <div className="p-4 space-y-4">
                              {!isFinishedNews ? (
                                <div className="space-y-3">
                                  {[1, 2].map((n) => (
                                    <div
                                      key={n}
                                      className="h-20 w-full bg-slate-100 rounded-xl animate-pulse"
                                    />
                                  ))}
                                </div>
                              ) : (
                                <div
                                  key={`news-container-${message.id}`}
                                  className="flex flex-col gap-2"
                                >
                                  {articles.map((article: any) => {
                                    const isSummarizing = summarizingIds.has(
                                      article.link,
                                    );
                                    const hasSummary = summaries[article.link];

                                    return (
                                      <div
                                        key={article.id || article.link}
                                        className="group p-2 rounded-lg bg-white border border-slate-200 shadow-sm hover:border-slate-300 hover:shadow-md transition-all"
                                      >
                                        <div className="flex gap-3">
                                          {/* Smaller, denser image */}
                                          {article.image && (
                                            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-md bg-slate-100">
                                              <img
                                                src={article.image}
                                                alt=""
                                                className="h-full w-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                                              />
                                            </div>
                                          )}

                                          <div className="flex-1 min-w-0">
                                            {/* Ultra-compact header */}
                                            <div className="flex items-center justify-between mb-0.5">
                                              <div className="flex items-center gap-1.5 truncate">
                                                <span className="text-[8px] font-black text-blue-600 uppercase tracking-widest">
                                                  {article.source}
                                                </span>
                                                <span className="text-[8px] text-slate-400 font-mono">
                                                  {new Date(
                                                    article.date,
                                                  ).toLocaleDateString([], {
                                                    month: "short",
                                                    day: "numeric",
                                                  })}
                                                </span>
                                              </div>

                                              {/* Inline TLDR Trigger for "Latest" look */}
                                              {!hasSummary && (
                                                <button
                                                  onClick={() =>
                                                    handleSummarize(article)
                                                  }
                                                  className={`text-[8px] font-bold uppercase tracking-tighter px-1.5 py-0.5 rounded border border-slate-200 text-slate-500 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all`}
                                                >
                                                  TLDR
                                                </button>
                                              )}
                                            </div>

                                            <a
                                              href={article.link}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                            >
                                              <h4 className="text-[11px] font-medium text-slate-800 line-clamp-1 group-hover:text-blue-600 leading-tight">
                                                {article.title}
                                              </h4>
                                            </a>

                                            {/* Hidden description on mobile/compact to save space, visible only if no summary */}
                                            {!hasSummary &&
                                              article.description && (
                                                <p className="text-[9px] text-slate-500 line-clamp-1 mt-0.5 italic">
                                                  {article.description}
                                                </p>
                                              )}
                                          </div>
                                        </div>

                                        {/* Integrated Summary - No top border, just a subtle inset box */}
                                        {hasSummary && (
                                          <div className="mt-2 animate-in fade-in zoom-in-95 duration-300">
                                            <p className="text-[10px] leading-relaxed text-slate-700 bg-amber-50/50 p-2 rounded border-l-2 border-amber-400">
                                              <span className="text-amber-500 font-bold mr-1">
                                                ◆
                                              </span>
                                              {summaries[article.link]}
                                            </p>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        );

                      case "tool-changelog":
                        const isFinished =
                          part.state === "result" ||
                          part.state === "output-available";
                        const args = part.args || (part as any).input;
                        const requestedTopic = args?.topic || "technology...";

                        // The tool now returns { technology: string, releases:[] }
                        const resultData = part.result || (part as any).output;

                        // Extract values from our new Mock JSON structure
                        const techName =
                          resultData?.technology || requestedTopic;
                        const releases = Array.isArray(resultData?.releases)
                          ? resultData.releases
                          : [];
                        const changelogError = resultData?.error;

                        return (
                          <div
                            key={`${message.id}-${i}`}
                            className="my-6 border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-md animate-in fade-in slide-in-from-bottom-2 duration-500"
                          >
                            {/* Header */}
                            <div className="flex items-center justify-between px-5 py-3 bg-slate-50 border-b border-slate-100">
                              <div className="flex items-center gap-3">
                                <div className="h-2 w-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
                                  {isFinished
                                    ? `Changelog: ${techName}`
                                    : `Searching updates for ${requestedTopic}`}
                                </span>
                              </div>
                              {isFinished && !changelogError && (
                                <span className="text-[9px] font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                                  {releases.length} Versions Found
                                </span>
                              )}
                            </div>

                            <div className="p-1">
                              {!isFinished ? (
                                <div className="p-4 space-y-3">
                                  <div className="h-4 w-1/3 bg-slate-200 rounded animate-pulse" />
                                  <div className="h-20 w-full bg-slate-100 rounded-xl animate-pulse" />
                                </div>
                              ) : changelogError ? (
                                <div className="p-4 text-xs text-slate-500 italic flex items-center gap-2">
                                  <span className="text-red-500 text-lg font-bold">
                                    !
                                  </span>
                                  {changelogError}
                                </div>
                              ) : (
                                <div className="divide-y divide-slate-100">
                                  {releases.map((rel: any, idx: number) => (
                                    <div
                                      key={idx}
                                      className="p-5 hover:bg-slate-50 transition-colors"
                                    >
                                      <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                          <h3 className="text-sm font-bold text-slate-800 tracking-tight">
                                            Release Notes
                                          </h3>
                                          <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-[10px] font-mono border border-purple-200">
                                            {rel.version}
                                          </span>
                                        </div>
                                        <span className="text-[10px] text-slate-400 font-mono">
                                          {rel.date}
                                        </span>
                                      </div>

                                      <div className="relative group">
                                        <div className="max-h-48 overflow-y-auto pr-2 custom-scrollbar prose prose-slate prose-sm text-slate-600">
                                          {/* Since 'changes' is an array, we convert it to Markdown bullets */}
                                          <ReactMarkdown
                                            remarkPlugins={[remarkGfm]}
                                          >
                                            {rel.changes
                                              .map(
                                                (change: string) =>
                                                  `* ${change}`,
                                              )
                                              .join("\n")}
                                          </ReactMarkdown>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        );

                      default:
                        return null;
                    }
                  })}

                  <div ref={messagesEndRef} />
                </div>
              </div>
            ))}

            {status === "submitted" && (
              <div className="flex items-center gap-2 pl-16 animate-pulse">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                <span className="text-[10px] font-mono text-slate-500 uppercase">
                  Analyzing query...
                </span>
              </div>
            )}

            {status === "streaming" && (
              <div className="flex items-center gap-2 pl-16">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-bounce" />
                <span className="text-[10px] font-mono text-slate-500 uppercase">
                  Generating response...
                </span>
              </div>
            )}
          </div>
        )}
      </div>
      {/* Input Area - unchanged */}
      <div className="fixed bottom-0 left-0 md:left-[280px] right-0 p-4 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent transition-[left] duration-250">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!input.trim()) return;

            // 1. Filter the history based on message parts
            const cleanedMessages = messages
              .map((msg) => {
                // 1. Destructure to remove the top-level reasoning property if it exists
                const { reasoning, ...rest } = msg as any;

                // 2. Filter the 'parts' array to remove reasoning blocks
                if (rest.parts) {
                  rest.parts = rest.parts.filter(
                    (part: any) => part.type !== "reasoning",
                  );
                }

                return rest;
              })
              .filter((msg) => {
                // Always keep user messages
                if (msg.role === "user") return true;

                if (msg.role === "assistant") {
                  // Check if any part of the message is "complete"
                  const hasContent = msg.parts.some((part) => {
                    // Keep if there is text content
                    if (part.type === "text" && part.text.trim().length > 0)
                      return true;

                    // Keep if it's a tool part that successfully finished
                    if (
                      part.type.startsWith("tool-") &&
                      part.state === "result"
                    )
                      return true;

                    return false;
                  });

                  return hasContent;
                }

                return true;
              })
              .map((msg) => {
                const { reasoning, ...rest } = msg as any;

                console.log(msg);
                return rest;
              });

            // 2. Update state and send
            setMessages(cleanedMessages);

            sendMessage(
              { text: input },
              {
                body: {
                  model: selectedModel,
                },
              },
            );
            setInput("");
          }}
          className="max-w-4xl mx-auto relative group"
        >
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xl focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all">
            <textarea
              className="w-full bg-transparent border-none outline-none text-slate-800 placeholder-slate-400 resize-none min-h-[60px] max-h-40"
              value={input}
              placeholder="Ask Newsroom"
              rows={1}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  e.currentTarget.form?.requestSubmit();
                }
              }}
            />
            <div className="flex items-center justify-end mt-2 pt-2 border-t border-slate-100">
              {isLoading ? (
                /* STOP BUTTON */
                <button
                  type="button"
                  onClick={stop}
                  className="p-1.5 bg-red-50 border border-red-200 rounded-full text-red-500 hover:bg-red-100 transition-all float-right"
                >
                  <SquareIcon size={18} fill="currentColor" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="p-1.5 bg-blue-600 rounded-full text-white hover:bg-blue-700 disabled:opacity-50 disabled:bg-slate-100 disabled:text-slate-400 shadow-sm transition-all float-right"
                >
                  <ArrowUpIcon />
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// Icon Components
function ArrowUpIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m5 12 7-7 7 7" />
      <path d="M12 19V5" />
    </svg>
  );
}

function SquareIcon({
  size = 20,
  fill = "none",
}: {
  size?: number;
  fill?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="6" y="6" width="12" height="12" rx="2" />
    </svg>
  );
}