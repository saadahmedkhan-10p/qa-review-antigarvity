"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { usePathname } from "next/navigation";
import { MessageCircle, X, Send, Trash2, Bot, User, Loader2 } from "lucide-react";

interface Message {
    role: "user" | "assistant";
    content: string;
    timestamp: number;
}

const MAX_STORED_MESSAGES = 40;

const getStorageKey = (userId: string) => `qa_chatbot_history_${userId}`;

const SUGGESTED_QUESTIONS = [
    "How do I conduct a review?",
    "What does 'On Track' mean?",
    "Why can't I see my projects?",
    "How do I schedule a review?",
];

export function ChatBot() {
    const { user } = useAuth();
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isHydrated, setIsHydrated] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Hide on login page
    const isLoginPage = pathname === "/";

    // 1. Load from localStorage when user.id changes
    useEffect(() => {
        // Reset hydration and messages immediately on user change/logout
        setIsHydrated(false);
        setMessages([]);

        if (!user?.id) return;

        try {
            const stored = localStorage.getItem(getStorageKey(user.id));
            if (stored) {
                const parsed = JSON.parse(stored) as Message[];
                if (Array.isArray(parsed)) {
                    setMessages(parsed);
                }
            }
        } catch (e) {
            console.error("Failed to load chat history", e);
        } finally {
            // Mark as hydrated only after load attempt finishes
            setIsHydrated(true);
        }
    }, [user?.id]);

    // 2. Save to localStorage ONLY when hydrated and messages change
    useEffect(() => {
        if (!isHydrated || !user?.id) return;
        try {
            const toStore = messages.slice(-MAX_STORED_MESSAGES);
            localStorage.setItem(getStorageKey(user.id), JSON.stringify(toStore));
        } catch (e) {
            console.error("Failed to save chat history", e);
        }
    }, [messages, isHydrated, user?.id]);

    // Scroll to bottom on new messages
    useEffect(() => {
        if (isOpen) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, isOpen]);

    // Focus input when opened
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    const sendMessage = useCallback(async (text?: string) => {
        const content = (text ?? input).trim();
        if (!content || isLoading) return;

        const userMessage: Message = {
            role: "user",
            content,
            timestamp: Date.now(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        try {
            const history = [...messages, userMessage].slice(-20).map(m => ({
                role: m.role,
                content: m.content,
            }));

            const res = await fetch("/api/chatbot", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages: history }),
            });

            const data = await res.json();
            const reply = data.reply || "Sorry, I couldn't get a response.";

            setMessages(prev => [...prev, {
                role: "assistant",
                content: reply,
                timestamp: Date.now(),
            }]);
        } catch {
            setMessages(prev => [...prev, {
                role: "assistant",
                content: "⚠️ Connection error. Please check your network and try again.",
                timestamp: Date.now(),
            }]);
        } finally {
            setIsLoading(false);
        }
    }, [input, messages, isLoading]);

    const clearHistory = () => {
        setMessages([]);
        if (user?.id) localStorage.removeItem(getStorageKey(user.id));
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    if (!user || isLoginPage) return null;

    const userRoles = Array.isArray(user.roles) ? user.roles : [];

    return (
        <>
            {/* Floating button */}
            <div className="fixed bottom-6 right-6 z-50">
                {!isOpen && (
                    <button
                        onClick={() => setIsOpen(true)}
                        title="Ask AI Assistant"
                        className="group relative flex items-center justify-center w-14 h-14 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95"
                        style={{
                            background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)",
                            boxShadow: "0 0 20px rgba(139, 92, 246, 0.5), 0 4px 20px rgba(0,0,0,0.3)"
                        }}
                    >
                        <MessageCircle className="w-6 h-6 text-white" />
                        {/* Pulse ring */}
                        <span className="absolute inset-0 rounded-full animate-ping opacity-20"
                            style={{ background: "linear-gradient(135deg, #6366f1, #a855f7)" }}
                        />
                        {/* Tooltip */}
                        <span className="absolute right-16 bg-gray-900 text-white text-xs font-medium px-3 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg">
                            Ask AI Assistant
                        </span>
                    </button>
                )}

                {/* Chat Panel */}
                {isOpen && (
                    <div
                        className="flex flex-col rounded-2xl overflow-hidden"
                        style={{
                            width: "380px",
                            height: "540px",
                            background: "#0f0f1a",
                            border: "1px solid rgba(139, 92, 246, 0.3)",
                            boxShadow: "0 0 40px rgba(139, 92, 246, 0.2), 0 20px 60px rgba(0,0,0,0.6)",
                            animation: "slideUp 0.2s ease-out"
                        }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 flex-shrink-0"
                            style={{
                                background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                            }}
                        >
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                                    <Bot className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                    <p className="text-white font-semibold text-sm leading-tight">QA Assistant</p>
                                    <p className="text-purple-200 text-[10px]">Powered by AI · {userRoles[0] || "User"}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                {messages.length > 0 && (
                                    <button
                                        onClick={clearHistory}
                                        title="Clear conversation"
                                        className="p-1.5 rounded-lg hover:bg-white/20 text-purple-200 hover:text-white transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-1.5 rounded-lg hover:bg-white/20 text-purple-200 hover:text-white transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Messages area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(139,92,246,0.3) transparent" }}>
                            {messages.length === 0 && (
                                <div className="space-y-4">
                                    <div className="flex items-start gap-2.5">
                                        <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center"
                                            style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
                                            <Bot className="w-3.5 h-3.5 text-white" />
                                        </div>
                                        <div className="rounded-2xl rounded-tl-sm px-3.5 py-2.5 max-w-[85%]"
                                            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.08)" }}>
                                            <p className="text-gray-200 text-sm leading-relaxed">
                                                Hi <span className="text-purple-300 font-medium">{user.name.split(" ")[0]}</span>! 👋 I can help you navigate the QA Review app. What would you like to know?
                                            </p>
                                        </div>
                                    </div>

                                    {/* Suggested questions */}
                                    <div className="space-y-2 pl-9">
                                        {SUGGESTED_QUESTIONS.map((q, i) => (
                                            <button
                                                key={i}
                                                onClick={() => sendMessage(q)}
                                                className="block w-full text-left text-xs px-3 py-2 rounded-xl transition-all duration-150 hover:scale-[1.02]"
                                                style={{
                                                    background: "rgba(99, 102, 241, 0.1)",
                                                    border: "1px solid rgba(99, 102, 241, 0.25)",
                                                    color: "#a5b4fc"
                                                }}
                                            >
                                                {q}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {messages.map((msg, i) => (
                                <div key={i} className={`flex items-start gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                                    {/* Avatar */}
                                    <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center ${
                                        msg.role === "user"
                                            ? "bg-indigo-500"
                                            : ""
                                    }`}
                                        style={msg.role === "assistant" ? { background: "linear-gradient(135deg, #6366f1, #8b5cf6)" } : {}}
                                    >
                                        {msg.role === "user"
                                            ? <User className="w-3.5 h-3.5 text-white" />
                                            : <Bot className="w-3.5 h-3.5 text-white" />
                                        }
                                    </div>

                                    {/* Bubble */}
                                    <div
                                        className={`rounded-2xl px-3.5 py-2.5 max-w-[80%] text-sm leading-relaxed whitespace-pre-wrap ${
                                            msg.role === "user"
                                                ? "rounded-tr-sm"
                                                : "rounded-tl-sm"
                                        }`}
                                        style={msg.role === "user"
                                            ? { background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff" }
                                            : { background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.08)", color: "#e2e8f0" }
                                        }
                                    >
                                        {msg.content}
                                    </div>
                                </div>
                            ))}

                            {/* Typing indicator */}
                            {isLoading && (
                                <div className="flex items-start gap-2.5">
                                    <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center"
                                        style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
                                        <Bot className="w-3.5 h-3.5 text-white" />
                                    </div>
                                    <div className="rounded-2xl rounded-tl-sm px-4 py-3"
                                        style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.08)" }}>
                                        <div className="flex gap-1 items-center">
                                            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                                            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                                            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input area */}
                        <div className="flex-shrink-0 p-3"
                            style={{ borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.3)" }}>
                            <div className="flex gap-2 items-center">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Ask anything about the app..."
                                    disabled={isLoading}
                                    className="flex-1 text-sm px-3.5 py-2.5 rounded-xl outline-none transition-all disabled:opacity-50"
                                    style={{
                                        background: "rgba(255,255,255,0.07)",
                                        border: "1px solid rgba(139, 92, 246, 0.2)",
                                        color: "#e2e8f0",
                                    }}
                                    onFocus={e => e.target.style.borderColor = "rgba(139, 92, 246, 0.6)"}
                                    onBlur={e => e.target.style.borderColor = "rgba(139, 92, 246, 0.2)"}
                                />
                                <button
                                    onClick={() => sendMessage()}
                                    disabled={!input.trim() || isLoading}
                                    className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
                                    style={{
                                        background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                                    }}
                                >
                                    {isLoading
                                        ? <Loader2 className="w-4 h-4 text-white animate-spin" />
                                        : <Send className="w-4 h-4 text-white" />
                                    }
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <style jsx global>{`
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(16px) scale(0.97); }
                    to   { opacity: 1; transform: translateY(0)   scale(1); }
                }
            `}</style>
        </>
    );
}
