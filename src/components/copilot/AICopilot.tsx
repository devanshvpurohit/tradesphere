'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { toast } from 'sonner';
import { soundManager } from '@/lib/sound';
import confetti from 'canvas-confetti';
import {
  Bot,
  Sparkles,
  Send,
  X,
  Minimize2,
  Maximize2,
  Mic,
  MicOff,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Layers,
  ArrowRight,
  Shield,
  Zap,
  Cpu,
  CornerDownLeft,
} from 'lucide-react';
import { CopilotExecutionReceipt, CopilotResponse } from '@/services/copilotService';

interface ChatMessage {
  id: string;
  sender: 'user' | 'copilot';
  text: string;
  receipts?: CopilotExecutionReceipt[];
  timestamp: string;
  modelUsed?: string;
}

const QUICK_ACTIONS = [
  { label: '💼 Audit Portfolio', prompt: 'Audit my portfolio P&L and risk breakdown' },
  { label: '🟢 Buy 10 RELIANCE', prompt: 'Buy 10 shares of RELIANCE with MIS 5x leverage' },
  { label: '🔍 Scan Oversold Dips', prompt: 'Scan Indian stocks for oversold dip setups' },
  { label: '⚡ Buy 5 TATAMOTORS', prompt: 'Buy 5 shares of Tata Motors at market price' },
  { label: '🔴 Square Off All', prompt: 'Square off all my active positions' },
  { label: '🔄 Reset to ₹100k', prompt: 'Reset my virtual balance to ₹1,00,000' },
];

const AVAILABLE_MODELS = [
  { id: 'gemma3:1b', name: 'Ollama Gemma 3 (1B)', provider: 'ollama', badge: 'Local Offline' },
  { id: 'llama3.2', name: 'Ollama Llama 3.2', provider: 'ollama', badge: 'Local' },
  { id: 'deepseek-r1', name: 'DeepSeek-R1 Quant', provider: 'ollama', badge: 'Local Quant' },
  { id: 'llama-3.3-70b-versatile', name: 'Groq LPU (500+ t/s)', provider: 'groq', badge: 'Ultra-Fast' },
  { id: 'gpt-4o', name: 'OpenAI GPT-4o', provider: 'openai', badge: 'Cloud Pro' },
  { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'claude', badge: 'Cloud' },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', provider: 'gemini', badge: 'Cloud' },
];

export function AICopilot() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gemma3:1b');
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [balance, setBalance] = useState<number>(100000);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const speechRecognitionRef = useRef<any>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'copilot',
      text: `👋 **Welcome to TradeSphere AI Copilot!**\n\nI am your autonomous execution copilot. I can perform any trading and portfolio action on your behalf across all Indian & global stocks:\n\n• **Autonomous Execution:** *"Buy 10 RELIANCE"*, *"Sell half of my TCS"*\n• **Leverage Control:** Supports **MIS 5x Intraday** and **CNC Delivery**\n• **Market Scanning:** *"Scan NIFTY 50 for oversold dips"*\n• **Portfolio Health:** *"Audit my portfolio and unrealized P&L"*\n• **Risk Management:** *"Square off all positions"*, *"Reset capital to ₹1,00,000"*\n\nHow would you like to deploy your capital today?`,
      timestamp: 'Just now',
    },
  ]);

  // Extract active stock from path if on `/stocks/[symbol]`
  const activeStockSymbol = pathname?.startsWith('/stocks/') ? pathname.replace('/stocks/', '') : undefined;

  // Global Keyboard Shortcut: Cmd+K or Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch virtual balance
  const fetchBalance = async () => {
    try {
      const res = await fetch('/api/portfolio');
      if (res.ok) {
        const d = await res.json();
        if (d.balance !== undefined) setBalance(d.balance);
      }
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    fetchBalance();
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 150);
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, isMinimized, messages]);

  // Web Speech API Voice Recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-IN';

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInputMessage(transcript);
          setIsListening(false);
          toast.success('Voice recognized', { description: transcript });
        };

        recognition.onerror = () => {
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        speechRecognitionRef.current = recognition;
      }
    }
  }, []);

  const toggleVoiceInput = () => {
    if (!speechRecognitionRef.current) {
      toast.error('Voice input is not supported in this browser.');
      return;
    }
    if (isListening) {
      speechRecognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        speechRecognitionRef.current.start();
        setIsListening(true);
        toast.info('Listening... Speak your trading instruction');
      } catch {
        setIsListening(false);
      }
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputMessage;
    if (!query.trim() || isSending) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsSending(true);

    try {
      const modelObj = AVAILABLE_MODELS.find((m) => m.id === selectedModel) || AVAILABLE_MODELS[0];
      const res = await fetch('/api/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          model: modelObj.id,
          provider: modelObj.provider,
          activeContextSymbol: activeStockSymbol,
        }),
      });

      const data: CopilotResponse = await res.json();

      if (res.ok && data) {
        // Sound and Confetti feedback on trade fills
        if (data.receipts && data.receipts.length > 0) {
          const filled = data.receipts.some((r) => r.status === 'FILLED' || r.status === 'COMPLETED');
          if (filled) {
            soundManager.playOrderSuccess();
            confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
            fetchBalance();
          }
        }

        const copilotMsg: ChatMessage = {
          id: `ts-${Date.now()}`,
          sender: 'copilot',
          text: data.reply,
          receipts: data.receipts,
          timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
          modelUsed: modelObj.name,
        };

        setMessages((prev) => [...prev, copilotMsg]);
      } else {
        soundManager.playOrderCancel();
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            sender: 'copilot',
            text: `⚠️ **Processing Error:** Could not complete request. Please try again.`,
            timestamp: 'Just now',
          },
        ]);
      }
    } catch (err: any) {
      soundManager.playOrderCancel();
      setMessages((prev) => [
        ...prev,
        {
          id: `net-err-${Date.now()}`,
          sender: 'copilot',
          text: `⚠️ **Network Timeout:** Failed to communicate with Copilot backend.`,
          timestamp: 'Just now',
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      {/* 1. Floating Omnipresent Copilot Pill Trigger */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 group flex items-center gap-3 px-4 py-3 rounded-full bg-gradient-to-r from-emerald-950/90 via-slate-900/95 to-blue-950/90 border border-emerald-500/40 hover:border-emerald-400 text-white shadow-2xl shadow-emerald-500/20 backdrop-blur-md hover:scale-105 active:scale-95 transition-all duration-200"
          title="Open AI Trading Copilot (Cmd+K)"
        >
          <div className="relative">
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping opacity-75" />
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Bot className="w-4 h-4" />
            </div>
          </div>
          <div className="text-left hidden sm:block">
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>AI Copilot</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                ⌘K
              </span>
            </div>
            <div className="text-[10px] text-emerald-400/80 font-mono">
              ₹{balance.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
          </div>
        </button>
      )}

      {/* 2. Slide-out Copilot Window */}
      {isOpen && (
        <div
          className={`fixed z-50 transition-all duration-300 ease-out flex flex-col ${
            isMinimized
              ? 'bottom-6 right-6 w-80 h-14 rounded-2xl'
              : 'bottom-4 sm:bottom-6 right-4 sm:right-6 w-[calc(100vw-32px)] sm:w-[460px] md:w-[500px] h-[640px] max-h-[calc(100vh-48px)] rounded-3xl'
          } bg-[#0B0F19]/95 backdrop-blur-xl border border-slate-800 shadow-2xl shadow-black/80 overflow-hidden`}
        >
          {/* Header */}
          <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-900/70 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-blue-500 p-0.5 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <div className="w-full h-full bg-[#0B0F19] rounded-[10px] flex items-center justify-center text-emerald-400">
                  <Bot className="w-4 h-4" />
                </div>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-white tracking-tight truncate">
                    TradeSphere Copilot
                  </h3>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  Virtual Capital: <span className="text-emerald-400 font-semibold">₹{balance.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 text-slate-400">
              <button
                onClick={() => setIsMinimized((prev) => !prev)}
                className="p-1.5 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                title={isMinimized ? 'Expand' : 'Minimize'}
              >
                {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                title="Close Copilot"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Model Bar */}
              <div className="px-4 py-2 border-b border-slate-800/80 bg-slate-950/40 flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                  <Cpu className="w-3.5 h-3.5 text-blue-400" />
                  <span>Model:</span>
                </div>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="bg-slate-900 border border-slate-700/80 rounded-lg px-2 py-1 text-[11px] text-slate-200 font-mono focus:outline-none focus:border-blue-500"
                >
                  {AVAILABLE_MODELS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.badge})
                    </option>
                  ))}
                </select>
              </div>

              {/* Message List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs font-sans">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[88%] rounded-2xl px-4 py-3 leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                          : 'bg-slate-900/90 text-slate-200 border border-slate-800 shadow-md'
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{msg.text}</div>

                      {/* Execution Receipts Card */}
                      {msg.receipts && msg.receipts.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-800 space-y-2">
                          {msg.receipts.map((rcpt, idx) => (
                            <div
                              key={idx}
                              className="p-2.5 rounded-xl bg-slate-950/80 border border-emerald-500/40 text-[11px] font-mono text-slate-300"
                            >
                              <div className="flex items-center justify-between mb-1.5">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    rcpt.action === 'BUY'
                                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                      : rcpt.action === 'SELL'
                                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                                      : 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                                  }`}
                                >
                                  {rcpt.action} {rcpt.productType && `(${rcpt.productType})`}
                                </span>
                                <span className="text-[10px] text-slate-500">{rcpt.timestamp}</span>
                              </div>

                              {rcpt.symbol && (
                                <div className="text-slate-100 font-bold mb-1">
                                  {rcpt.quantity}x {rcpt.symbol} @ ₹{rcpt.price?.toFixed(2)}
                                </div>
                              )}

                              {rcpt.totalValue && (
                                <div className="text-[10px] text-slate-400">
                                  Total Value: ₹{rcpt.totalValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                                </div>
                              )}

                              {rcpt.realizedPnL !== undefined && (
                                <div
                                  className={`text-[10px] font-bold ${
                                    rcpt.realizedPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'
                                  }`}
                                >
                                  Realized P&L: {rcpt.realizedPnL >= 0 ? '+' : ''}₹{rcpt.realizedPnL.toFixed(2)}
                                </div>
                              )}

                              <div className="mt-2 pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                                <span className="text-emerald-400">✓ FILLED (Atomic Tx)</span>
                                {rcpt.symbol && (
                                  <Link
                                    href={`/stocks/${rcpt.symbol}`}
                                    className="text-blue-400 hover:text-blue-300 flex items-center gap-1"
                                  >
                                    <span>Open Chart</span>
                                    <ArrowRight className="w-2.5 h-2.5" />
                                  </Link>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <span className="text-[10px] text-slate-500 mt-1 px-1">{msg.timestamp}</span>
                  </div>
                ))}

                {isSending && (
                  <div className="flex items-center gap-2 text-slate-400 text-xs bg-slate-900/60 p-3 rounded-2xl border border-slate-800 w-fit">
                    <Bot className="w-4 h-4 text-emerald-400 animate-spin" />
                    <span>Analyzing technicals & executing trade...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Actions Scroll Strip */}
              <div className="px-4 py-2 border-t border-slate-800/80 bg-slate-950/60 overflow-x-auto flex items-center gap-2 scrollbar-none">
                {QUICK_ACTIONS.map((qa, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(qa.prompt)}
                    className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/60 hover:border-slate-600 text-[10px] text-slate-300 transition-colors"
                  >
                    {qa.label}
                  </button>
                ))}
              </div>

              {/* Input Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="p-3 border-t border-slate-800 bg-slate-900/90 flex items-center gap-2"
              >
                <button
                  type="button"
                  onClick={toggleVoiceInput}
                  className={`p-2 rounded-xl transition-all ${
                    isListening
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                  title="Voice Command"
                >
                  {isListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                </button>

                <input
                  ref={inputRef}
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Ask anything or execute: 'Buy 10 RELIANCE', 'Audit portfolio'..."
                  className="flex-1 bg-slate-950/80 border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
                />

                <button
                  type="submit"
                  disabled={!inputMessage.trim() || isSending}
                  className="p-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl transition-all shadow-md shadow-blue-600/30"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
}
