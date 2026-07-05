import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, Sparkles, User, RefreshCw, Minimize2, Check, Copy } from "lucide-react";
import { EducationalResource } from "../types";

interface Message {
  sender: "user" | "ai";
  text: string;
}

interface StudyAssistantPanelProps {
  resource: EducationalResource;
}

export default function StudyAssistantPanel({ resource }: StudyAssistantPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "ai",
      text: `Hi! I'm your **EduVault AI Study Assistant**. 📚\n\nI can help you review **"${resource.title}"**. Click any quick action below or ask me a question!`
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Reset assistant chat when resource changes
    setMessages([
      {
        sender: "ai",
        text: `Hi! I'm your **EduVault AI Study Assistant**. 📚\n\nI can help you review **"${resource.title}"**. Click any quick action below or ask me a question!`
      }
    ]);
  }, [resource]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || input;
    if (!textToSend.trim() || isLoading) return;

    const newMessages = [...messages, { sender: "user", text: textToSend } as Message];
    setMessages(newMessages);
    if (!customText) setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/study-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resourceTitle: resource.title,
          resourceContent: resource.content || resource.description,
          userMessage: textToSend,
          history: messages.slice(-6).map((msg) => ({
            role: msg.sender === "user" ? "user" : "model",
            parts: [{ text: msg.text }]
          }))
        })
      });

      const data = await response.json();
      setMessages((prev) => [...prev, { sender: "ai", text: data.text || "I was unable to formulate an answer. Let's try again!" }]);
    } catch (error) {
      console.error("Study assistant API error:", error);
      setMessages((prev) => [
        ...prev,
        { sender: "ai", text: "Oops, I'm having trouble connecting to the EduVault AI core. Please check your internet or retry!" }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const quickActions = [
    { label: "Summarize this material", prompt: "Can you provide a bulleted summary of this study material with the key takeaways?" },
    { label: "List 5 exam questions", prompt: "What are 5 highly likely exam questions that can be asked from this topic, along with brief key points for answers?" },
    { label: "Create a 2-day study plan", prompt: "Help me create a simple 2-day study schedule to fully master this material." }
  ];

  return (
    <div className="bg-gray-50 border border-gray-100 rounded-2xl flex flex-col h-[550px] overflow-hidden">
      {/* Title bar */}
      <div className="bg-indigo-600 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300" />
          <span className="text-sm font-bold tracking-tight">AI Study Assistant</span>
        </div>
        <span className="text-[10px] font-mono bg-indigo-500 text-indigo-100 px-2 py-0.5 rounded uppercase font-semibold">
          Gemini 3.5 Active
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 scrollbar-thin">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}>
            <div className="flex items-center gap-1 mb-1 text-[10px] text-gray-400">
              {msg.sender === "user" ? (
                <>
                  <span>You</span>
                  <User className="w-3 h-3" />
                </>
              ) : (
                <>
                  <Sparkles className="w-3 h-3 text-indigo-500" />
                  <span>AI Assistant</span>
                </>
              )}
            </div>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs shadow-xs leading-relaxed whitespace-pre-wrap ${
                msg.sender === "user"
                  ? "bg-indigo-600 text-white rounded-tr-none"
                  : "bg-white text-gray-800 border border-gray-100 rounded-tl-none"
              }`}
            >
              {msg.text}
              
              {msg.sender === "ai" && idx > 0 && (
                <div className="mt-2 pt-1 border-t border-gray-50 flex justify-end">
                  <button
                    onClick={() => handleCopy(msg.text, idx)}
                    className="text-gray-400 hover:text-gray-600 flex items-center gap-1 text-[10px] bg-gray-50 px-1.5 py-0.5 rounded transition-all"
                  >
                    {copiedIndex === idx ? (
                      <>
                        <Check className="w-2.5 h-2.5 text-green-500" />
                        <span className="text-green-600">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-2.5 h-2.5" />
                        <span>Copy notes</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex flex-col items-start">
            <div className="flex items-center gap-1 mb-1 text-[10px] text-gray-400">
              <Sparkles className="w-3 h-3 text-indigo-500 animate-spin" />
              <span>AI is thinking...</span>
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-2">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Quick suggestions */}
      {messages.length === 1 && (
        <div className="px-4 py-2 border-t border-gray-100 bg-gray-50 space-y-1.5">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Quick Prompts</p>
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={() => handleSendMessage(action.prompt)}
              className="w-full text-left bg-white hover:bg-indigo-50 hover:border-indigo-200 border border-gray-200 rounded-lg px-3 py-1.5 text-[11px] text-gray-700 transition-all font-medium flex items-center justify-between"
            >
              <span>{action.label}</span>
              <Sparkles className="w-3 h-3 text-indigo-400 flex-shrink-0" />
            </button>
          ))}
        </div>
      )}

      {/* Footer input */}
      <div className="p-3 border-t border-gray-100 bg-white">
        <div className="flex items-center gap-1.5">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            disabled={isLoading}
            placeholder="Ask anything about these notes..."
            className="flex-1 px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 disabled:bg-gray-50"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!input.trim() || isLoading}
            className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all disabled:opacity-50 disabled:hover:bg-indigo-600 flex-shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
