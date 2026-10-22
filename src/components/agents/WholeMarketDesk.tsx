'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { soundManager } from '@/lib/sound';
import confetti from 'canvas-confetti';
import {
  Globe2,
  Play,
  Square,
  Zap,
  RotateCcw,
  TrendingUp,
  TrendingDown,
  Activity,
  CheckCircle2,
  AlertCircle,
  Sliders,
  Cpu,
  Layers,
  ArrowRight,
  Shield,
  Clock,
  Radio,
  Check,
  ChevronDown,
  ChevronUp,
  Save,
  Plus,
  X,
  Sparkles,
  SlidersHorizontal,
  FileCode2,
  Bot,
  Key,
  Eye,
  EyeOff,
  RefreshCw,
  Flame,
  Database,
} from 'lucide-react';
import { useRealtimeTrading } from '@/hooks/useRealtimeTrading';
import {
  MarketSignalRecord,
  WholeMarketExecutionItem,
  WholeMarketScanResult,
  WHOLE_MARKET_UNIVERSE,
  STRATEGY_PRESETS,
  StrategyPreset,
  WholeMarketAgentConfig,
  AIProvider,
  WholeMarketLLMConfig,
} from '@/lib/agents/wholeMarketTypes';

const LLM_PROVIDERS: {
  id: AIProvider;
  name: string;
  icon: string;
  description: string;
  requiresKey: boolean;
  models: { id: string; name: string }[];
}[] = [
  {
    id: 'groq',
    name: 'Groq LPU (Ultra-Fast 500+ t/s)',
    icon: '⚡',
    description: 'Sub-second real-time inference optimized for high-frequency quant sweeps.',
    requiresKey: true,
    models: [
      { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B Versatile (Recommended)' },
      { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B MoE' },
      { id: 'gemma2-9b-it', name: 'Gemma 2 9B IT' },
    ],
  },
  {
    id: 'ollama',
    name: 'Ollama (Local / Offline / Free)',
    icon: '🦙',
    description: '100% private on localhost:11434 with zero API cost or rate limits.',
    requiresKey: false,
    models: [
      { id: 'gemma3:1b', name: 'Gemma 3 1B (Ultra-fast Local)' },
      { id: 'llama3.2', name: 'Llama 3.2 3B' },
      { id: 'deepseek-r1', name: 'DeepSeek R1 (Reasoning)' },
      { id: 'mistral', name: 'Mistral 7B' },
      { id: 'qwen2.5-coder', name: 'Qwen 2.5 Coder' },
    ],
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    icon: '🔵',
    description: 'Flagship multimodal speed and massive context reasoning.',
    requiresKey: true,
    models: [
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash (Super Fast)' },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro (Deep Quantitative Reasoning)' },
      { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash (Next-Gen)' },
    ],
  },
  {
    id: 'openai',
    name: 'OpenAI GPT-4o',
    icon: '🟢',
    description: 'Institutional-grade market reasoning and structured decision synthesis.',
    requiresKey: true,
    models: [
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini (High-Speed)' },
      { id: 'gpt-4o', name: 'GPT-4o (Flagship Multimodal)' },
    ],
  },
  {
    id: 'anthropic',
    name: 'Anthropic Claude',
    icon: '🟣',
    description: 'Rigorous chain-of-thought risk evaluation and discipline.',
    requiresKey: true,
    models: [
      { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku (Fast)' },
      { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet (Institutional)' },
    ],
  },
];

interface WholeMarketDeskProps {
  systemPrompt?: string;
  decisionRules?: string;
  onTradeExecuted?: () => void;
}

export function WholeMarketDesk({
  systemPrompt: initialPrompt = 'You are an aggressive autonomous quantitative desk. Scan the entire market universe. Buy momentum pullbacks on oversold confluence. Short sell overbought exhaustion breakdowns. Take profit at +2.5% and stop loss at -1.2%.',
  decisionRules: initialRules = '1. Buy Long on RSI < 40 + EMA breakout.\n2. Short Sell on RSI > 68.\n3. Take profit at +2.5%, stop loss at -1.2%.\n4. Sizing: MIS 5x leverage.',
  onTradeExecuted,
}: WholeMarketDeskProps) {
  // Runner State
  const [isRunning, setIsRunning] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [cycleCount, setCycleCount] = useState(0);
  const [countdown, setCountdown] = useState(20);

  // Customization Suite Drawer State
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [activePresetId, setActivePresetId] = useState<string>('custom');

  // Core Customizable Parameters
  const [systemPrompt, setSystemPrompt] = useState(initialPrompt);
  const [decisionRules, setDecisionRules] = useState(initialRules);
  const [takeProfitPercent, setTakeProfitPercent] = useState<number>(2.5);
  const [stopLossPercent, setStopLossPercent] = useState<number>(1.2);
  const [rsiBuyThreshold, setRsiBuyThreshold] = useState<number>(40);
  const [rsiShortThreshold, setRsiShortThreshold] = useState<number>(68);
  const [minConfidence, setMinConfidence] = useState<number>(70);
  const [maxAllocationPerStock, setMaxAllocationPerStock] = useState<number>(15000);
  const [productType, setProductType] = useState<'MIS' | 'CNC'>('MIS');
  const [allowShorts, setAllowShorts] = useState<boolean>(true);
  const [intervalSec, setIntervalSec] = useState<number>(20);
  const [customUniverse, setCustomUniverse] = useState<string[]>(WHOLE_MARKET_UNIVERSE);
  const [newTickerInput, setNewTickerInput] = useState<string>('');

  // LLM Engine State
  const [enableLLM, setEnableLLM] = useState<boolean>(true);
  const [llmProvider, setLlmProvider] = useState<AIProvider>('groq');
  const [llmModel, setLlmModel] = useState<string>('llama-3.3-70b-versatile');
  const [llmApiKey, setLlmApiKey] = useState<string>('');
  const [ollamaBaseUrl, setOllamaBaseUrl] = useState<string>('http://localhost:11434');
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  const [temperature, setTemperature] = useState<number>(0.1);

  // Firebase Realtime Database Hook
  const {
    balance: rtdbBalance,
    positions: rtdbPositions,
    userOrders: rtdbOrders,
    liveTrades: rtdbLiveTrades,
    isConnected: rtdbConnected,
  } = useRealtimeTrading();
  const [feedTab, setFeedTab] = useState<'AGENT_LOGS' | 'FIREBASE_RTDB'>('AGENT_LOGS');

  // Dynamic Models from API Key
  const [dynamicModels, setDynamicModels] = useState<{ id: string; label: string; description?: string }[]>([]);
  const [fetchingModels, setFetchingModels] = useState<boolean>(false);
  const [modelFetchStatus, setModelFetchStatus] = useState<{ success: boolean; message: string } | null>(null);

  const fetchModelsForProvider = async (prov: AIProvider, key?: string, url?: string) => {
    const keyToUse = key !== undefined ? key : llmApiKey;
    const urlToUse = url !== undefined ? url : ollamaBaseUrl;

    if (prov !== 'ollama' && (!keyToUse || !keyToUse.trim())) {
      setDynamicModels([]);
      setModelFetchStatus({ success: false, message: `Please enter your ${prov.toUpperCase()} API key first.` });
      return;
    }

    setFetchingModels(true);
    setModelFetchStatus(null);

    try {
      const res = await fetch('/api/agents/provider-models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: prov,
          apiKey: (keyToUse || '').trim(),
          ollamaBaseUrl: urlToUse || 'http://localhost:11434',
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.models) && data.models.length > 0) {
        setDynamicModels(data.models);
        setModelFetchStatus({
          success: true,
          message: `✓ Retrieved ${data.models.length} live models from your ${prov.toUpperCase()} account`,
        });

        const exists = data.models.some((m: any) => m.id === llmModel);
        if (!exists && data.models[0]?.id) {
          setLlmModel(data.models[0].id);
        }
      } else {
        setDynamicModels([]);
        setModelFetchStatus({
          success: false,
          message: data.error || `No models returned from ${prov.toUpperCase()}.`,
        });
      }
    } catch (err: any) {
      setDynamicModels([]);
      setModelFetchStatus({
        success: false,
        message: err.message || 'Failed to retrieve models with this key.',
      });
    } finally {
      setFetchingModels(false);
    }
  };

  // Results State
  const [scanResult, setScanResult] = useState<WholeMarketScanResult | null>(null);
  const [executionLogs, setExecutionLogs] = useState<WholeMarketExecutionItem[]>([]);
  const [activeSignals, setActiveSignals] = useState<MarketSignalRecord[]>([]);

  const runnerTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Hydrate custom config & API keys from localStorage on mount
  useEffect(() => {
    try {
      // 1. Load saved API keys from Agent Playground/Copilot
      const savedKeys = JSON.parse(localStorage.getItem('tradesphere_api_keys') || '{}');
      if (savedKeys[llmProvider]) {
        setLlmApiKey(savedKeys[llmProvider]);
      }

      // 2. Load whole-market custom config
      const savedConfig = localStorage.getItem('tradesphere_whole_market_config');
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig);
        if (parsed.systemPrompt) setSystemPrompt(parsed.systemPrompt);
        if (parsed.decisionRules) setDecisionRules(parsed.decisionRules);
        if (typeof parsed.takeProfitPercent === 'number') setTakeProfitPercent(parsed.takeProfitPercent);
        if (typeof parsed.stopLossPercent === 'number') setStopLossPercent(parsed.stopLossPercent);
        if (typeof parsed.rsiBuyThreshold === 'number') setRsiBuyThreshold(parsed.rsiBuyThreshold);
        if (typeof parsed.rsiShortThreshold === 'number') setRsiShortThreshold(parsed.rsiShortThreshold);
        if (typeof parsed.minConfidence === 'number') setMinConfidence(parsed.minConfidence);
        if (typeof parsed.maxAllocationPerStock === 'number') setMaxAllocationPerStock(parsed.maxAllocationPerStock);
        if (parsed.productType) setProductType(parsed.productType);
        if (typeof parsed.allowShorts === 'boolean') setAllowShorts(parsed.allowShorts);
        if (typeof parsed.intervalSec === 'number') {
          setIntervalSec(parsed.intervalSec);
          setCountdown(parsed.intervalSec);
        }
        if (Array.isArray(parsed.universe) && parsed.universe.length > 0) {
          setCustomUniverse(parsed.universe);
        }
        if (parsed.activePresetId) setActivePresetId(parsed.activePresetId);
        if (typeof parsed.enableLLM === 'boolean') setEnableLLM(parsed.enableLLM);
        if (parsed.llmProvider) {
          setLlmProvider(parsed.llmProvider);
          if (savedKeys[parsed.llmProvider]) {
            setLlmApiKey(savedKeys[parsed.llmProvider]);
          } else if (parsed.llmApiKey) {
            setLlmApiKey(parsed.llmApiKey);
          }
        }
        if (parsed.llmModel) setLlmModel(parsed.llmModel);
        if (parsed.ollamaBaseUrl) setOllamaBaseUrl(parsed.ollamaBaseUrl);
        if (typeof parsed.temperature === 'number') setTemperature(parsed.temperature);

        // Fetch dynamic models if key/url present
        const activeProv = parsed.llmProvider || llmProvider;
        const activeKey = savedKeys[activeProv] || parsed.llmApiKey || '';
        if (activeProv === 'ollama' || activeKey) {
          fetchModelsForProvider(activeProv, activeKey, parsed.ollamaBaseUrl);
        }
      } else {
        const defaultKey = savedKeys[llmProvider] || '';
        if (llmProvider === 'ollama' || defaultKey) {
          fetchModelsForProvider(llmProvider, defaultKey);
        }
      }
    } catch (e) {
      console.warn('Failed loading whole-market custom config from localStorage:', e);
    }
  }, []);

  // Update model & API key when provider changes
  const handleSelectProvider = (prov: AIProvider) => {
    setLlmProvider(prov);
    setDynamicModels([]);
    setModelFetchStatus(null);
    const providerMeta = LLM_PROVIDERS.find((p) => p.id === prov);
    if (providerMeta && providerMeta.models.length > 0) {
      setLlmModel(providerMeta.models[0].id);
    }
    const savedKeys = JSON.parse(localStorage.getItem('tradesphere_api_keys') || '{}');
    const key = savedKeys[prov] || '';
    setLlmApiKey(key);

    if (prov === 'ollama' || key) {
      fetchModelsForProvider(prov, key);
    }
  };

  // Save config to localStorage
  const handleSaveConfig = () => {
    try {
      const configToSave = {
        activePresetId,
        systemPrompt,
        decisionRules,
        takeProfitPercent,
        stopLossPercent,
        rsiBuyThreshold,
        rsiShortThreshold,
        minConfidence,
        maxAllocationPerStock,
        productType,
        allowShorts,
        intervalSec,
        universe: customUniverse,
        enableLLM,
        llmProvider,
        llmModel,
        llmApiKey,
        ollamaBaseUrl,
        temperature,
      };
      localStorage.setItem('tradesphere_whole_market_config', JSON.stringify(configToSave));

      // Also persist API key in the shared tradesphere_api_keys
      if (llmApiKey) {
        const savedKeys = JSON.parse(localStorage.getItem('tradesphere_api_keys') || '{}');
        savedKeys[llmProvider] = llmApiKey;
        localStorage.setItem('tradesphere_api_keys', JSON.stringify(savedKeys));
      }

      toast.success('Agent Configuration & LLM Settings Saved!', {
        description: `Active Model: ${llmProvider.toUpperCase()} (${llmModel}). Risk parameters and universe are synchronized.`,
      });
    } catch (e) {
      toast.error('Failed to save configuration');
    }
  };

  // Reset config to defaults
  const handleResetDefaults = () => {
    setActivePresetId('custom');
    setSystemPrompt(initialPrompt);
    setDecisionRules(initialRules);
    setTakeProfitPercent(2.5);
    setStopLossPercent(1.2);
    setRsiBuyThreshold(40);
    setRsiShortThreshold(68);
    setMinConfidence(70);
    setMaxAllocationPerStock(15000);
    setProductType('MIS');
    setAllowShorts(true);
    setIntervalSec(20);
    setCountdown(20);
    setCustomUniverse(WHOLE_MARKET_UNIVERSE);
    localStorage.removeItem('tradesphere_whole_market_config');
    toast.info('Agent Reset to Defaults');
  };

  // Apply a Strategy Preset
  const handleApplyPreset = (preset: StrategyPreset) => {
    setActivePresetId(preset.id);
    const cfg = preset.config;
    if (cfg.systemPrompt) setSystemPrompt(cfg.systemPrompt);
    if (cfg.decisionRules) setDecisionRules(cfg.decisionRules);
    if (typeof cfg.takeProfitPercent === 'number') setTakeProfitPercent(cfg.takeProfitPercent);
    if (typeof cfg.stopLossPercent === 'number') setStopLossPercent(cfg.stopLossPercent);
    if (typeof cfg.rsiBuyThreshold === 'number') setRsiBuyThreshold(cfg.rsiBuyThreshold);
    if (typeof cfg.rsiShortThreshold === 'number') setRsiShortThreshold(cfg.rsiShortThreshold);
    if (typeof cfg.minConfidence === 'number') setMinConfidence(cfg.minConfidence);
    if (typeof cfg.maxAllocationPerStock === 'number') setMaxAllocationPerStock(cfg.maxAllocationPerStock);
    if (cfg.productType) setProductType(cfg.productType);
    if (typeof cfg.allowShorts === 'boolean') setAllowShorts(cfg.allowShorts);
    if (typeof cfg.intervalSec === 'number') {
      setIntervalSec(cfg.intervalSec);
      setCountdown(cfg.intervalSec);
    }
    toast.success(`Preset Applied: ${preset.name}`, {
      description: preset.description,
    });
  };

  // Toggle scrip in custom universe
  const handleToggleTicker = (sym: string) => {
    if (customUniverse.includes(sym)) {
      if (customUniverse.length <= 1) {
        toast.error('At least 1 stock must remain in the universe.');
        return;
      }
      setCustomUniverse((prev) => prev.filter((s) => s !== sym));
    } else {
      setCustomUniverse((prev) => [...prev, sym]);
    }
  };

  // Add custom ticker
  const handleAddCustomTicker = () => {
    const sym = newTickerInput.trim().toUpperCase();
    if (!sym) return;
    if (customUniverse.includes(sym)) {
      toast.info(`${sym} is already in the universe.`);
      setNewTickerInput('');
      return;
    }
    setCustomUniverse((prev) => [...prev, sym]);
    setNewTickerInput('');
    toast.success(`Added ${sym} to Agent Universe`);
  };

  const executeMarketCycle = async () => {
    setIsScanning(true);
    try {
      const res = await fetch('/api/agents/whole-market', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemPrompt,
          decisionRules,
          takeProfitPercent,
          stopLossPercent,
          rsiBuyThreshold,
          rsiShortThreshold,
          minConfidence,
          maxAllocationPerStock,
          productType,
          allowShorts,
          universe: customUniverse,
          llmConfig: {
            enabled: enableLLM,
            provider: llmProvider,
            model: llmModel,
            apiKey: llmApiKey,
            ollamaBaseUrl,
            temperature,
          },
        }),
      });

      const data: WholeMarketScanResult = await res.json();
      if (res.ok && data) {
        setScanResult(data);
        setActiveSignals(data.signals || []);

        if (data.executions && data.executions.length > 0) {
          soundManager.playOrderSuccess();
          confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
          setExecutionLogs((prev) => [...data.executions, ...prev].slice(0, 40));
          toast.success(`Autonomous Quant Execution`, {
            description: `Executed ${data.executions.length} orders across the customized universe.`,
          });
          if (onTradeExecuted) onTradeExecuted();
        }
      }
    } catch (err: any) {
      console.error('Whole market cycle error:', err);
    } finally {
      setIsScanning(false);
    }
  };

  const startWholeMarketRunner = () => {
    setIsRunning(true);
    setCycleCount(1);
    setCountdown(intervalSec);
    toast.success('Whole-Market Autonomous Desk Started!', {
      description: `Continuously sweeping ${customUniverse.length} stocks every ${intervalSec}s with your custom parameters.`,
    });

    // Execute first cycle immediately
    executeMarketCycle();

    // Start recurring interval
    if (runnerTimerRef.current) clearInterval(runnerTimerRef.current);
    runnerTimerRef.current = setInterval(() => {
      setCycleCount((prev) => prev + 1);
      setCountdown(intervalSec);
      executeMarketCycle();
    }, intervalSec * 1000);

    // 1-second countdown display
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    countdownTimerRef.current = setInterval(() => {
      setCountdown((prev) => (prev > 1 ? prev - 1 : intervalSec));
    }, 1000);
  };

  const stopWholeMarketRunner = () => {
    setIsRunning(false);
    if (runnerTimerRef.current) clearInterval(runnerTimerRef.current);
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    toast.info('Whole-Market Desk Paused', {
      description: 'Continuous trading loop stopped. Active positions remain in your portfolio ledger.',
    });
  };

  return (
    <div className="rounded-3xl bg-gradient-to-b from-[#0b111e] via-[#080d18] to-[#060a13] border border-blue-500/30 p-6 sm:p-8 shadow-2xl relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/10 blur-[120px] pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-800 relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-emerald-500/20 to-blue-500/20 border border-emerald-500/40 text-emerald-400">
              <Globe2 className="w-5 h-5" />
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              Autonomous Whole-Market Quant Desk
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                CUSTOMIZABLE AUTOPILOT
              </span>
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
            Operates across the entire equity universe simultaneously. Tailor the System Prompt, technical indicator bounds,
            stop-loss/take-profit targets, leverage, and monitored tickers to your exact quantitative trading strategy.
          </p>
        </div>

        {/* Start / Stop & Sweep Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          {isRunning ? (
            <button
              onClick={stopWholeMarketRunner}
              className="py-3.5 px-6 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black font-mono text-xs uppercase tracking-wider shadow-xl shadow-rose-600/30 active:scale-95 transition-all flex items-center gap-2.5"
            >
              <Square className="w-4 h-4 fill-white" />
              <span>Stop Quant Desk</span>
            </button>
          ) : (
            <button
              onClick={startWholeMarketRunner}
              className="py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black font-mono text-xs uppercase tracking-wider shadow-xl shadow-emerald-500/30 active:scale-95 transition-all flex items-center gap-2.5"
            >
              <Play className="w-5 h-5 fill-slate-950" />
              <span>Start Agent (Full Day)</span>
            </button>
          )}

          <button
            onClick={executeMarketCycle}
            disabled={isScanning}
            className="py-3.5 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold font-mono text-xs transition-all flex items-center gap-2 disabled:opacity-50"
            title="Perform a single sweep across all stocks right now"
          >
            <Zap className="w-4 h-4 text-yellow-400" />
            <span>{isScanning ? 'Sweeping...' : 'Sweep Once'}</span>
          </button>

          <button
            onClick={() => setIsCustomizing((prev) => !prev)}
            className={`py-3.5 px-4 rounded-2xl border font-bold font-mono text-xs transition-all flex items-center gap-2 ${
              isCustomizing
                ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-600/20'
                : 'bg-slate-900/80 hover:bg-slate-800 border-slate-700 text-blue-400 hover:text-blue-300'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Customize Strategy</span>
            {isCustomizing ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Active Strategy Telemetry Pill */}
      <div className="py-3.5 px-4 my-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs font-mono relative z-10">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] text-slate-500 uppercase font-bold">Active Configuration:</span>
          <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold">
            TP: +{takeProfitPercent}%
          </span>
          <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold">
            SL: -{stopLossPercent}%
          </span>
          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            RSI Buy: &le;{rsiBuyThreshold}
          </span>
          <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
            RSI Short: &ge;{rsiShortThreshold}
          </span>
          <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
            Min Conviction: {minConfidence}%
          </span>
          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">
            Max/Scrip: ₹{maxAllocationPerStock.toLocaleString('en-IN')}
          </span>
          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">
            {productType} {productType === 'MIS' ? '(5x Margin)' : '(1x Cash)'}
          </span>
          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">
            {customUniverse.length} Scrips
          </span>
          <span className={`px-2 py-0.5 rounded font-bold border ${
            enableLLM
              ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
              : 'bg-slate-800 text-slate-500 border-slate-700'
          }`}>
            🧠 LLM: {enableLLM ? `${llmProvider.toUpperCase()}` : 'DISABLED'}
          </span>
        </div>

        <button
          onClick={() => setIsCustomizing((prev) => !prev)}
          className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold underline underline-offset-4"
        >
          <span>{isCustomizing ? 'Hide Customizer' : 'Edit Strategy & LLMs'}</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* EXPANDABLE CUSTOMIZATION SUITE                                  */}
      {/* ============================================================== */}
      {isCustomizing && (
        <div className="mb-6 p-6 rounded-3xl bg-slate-900/90 border border-blue-500/40 shadow-2xl relative z-20 space-y-6 animate-in fade-in slide-in-from-top-4 duration-200">
          {/* Multi-LLM Quant Engine & Model Architecture Section */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-purple-500/30">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                    Multi-LLM Autonomous Quant Intelligence Engine
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Powers market synthesis, CIO liquidity sweeps, and trade conviction with your chosen LLM.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-slate-400">LLM Synthesis:</span>
                <button
                  onClick={() => setEnableLLM((prev) => !prev)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold font-mono transition-all ${
                    enableLLM
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {enableLLM ? 'ENABLED (ACTIVE CIO)' : 'DISABLED'}
                </button>
              </div>
            </div>

            {enableLLM && (
              <div className="space-y-4">
                {/* Provider Selector Tabs */}
                <div>
                  <div className="text-[11px] font-mono text-slate-400 mb-2 uppercase font-semibold">
                    Select AI Provider
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                    {LLM_PROVIDERS.map((prov) => {
                      const isSelected = llmProvider === prov.id;
                      return (
                        <button
                          key={prov.id}
                          onClick={() => handleSelectProvider(prov.id)}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            isSelected
                              ? 'bg-purple-600/20 border-purple-500 text-white shadow-md shadow-purple-500/10'
                              : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-base">{prov.icon}</span>
                            <span className="text-xs font-bold">{prov.name.split(' ')[0]}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">
                            {prov.models[0]?.name.split(' ')[0]}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Model & Connection Settings */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                  {/* Model Selector */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-mono text-slate-400 uppercase font-semibold">
                        Model Selection
                      </label>
                      {dynamicModels.length > 0 && (
                        <span className="text-[10px] font-mono text-emerald-400">
                          {dynamicModels.length} dynamic models
                        </span>
                      )}
                    </div>
                    <select
                      value={llmModel}
                      onChange={(e) => setLlmModel(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-purple-500"
                    >
                      {dynamicModels.length > 0 ? (
                        <>
                          <optgroup label={`Retrieved from Account (${dynamicModels.length})`}>
                            {dynamicModels.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.label || m.id}
                              </option>
                            ))}
                          </optgroup>
                          <optgroup label="Default Recommendations">
                            {LLM_PROVIDERS.find((p) => p.id === llmProvider)?.models.map((m) => (
                              <option key={`def_${m.id}`} value={m.id}>
                                {m.name}
                              </option>
                            ))}
                          </optgroup>
                        </>
                      ) : (
                        LLM_PROVIDERS.find((p) => p.id === llmProvider)?.models.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name}
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  {/* API Key or Ollama URL */}
                  {llmProvider === 'ollama' ? (
                    <div>
                      <label className="text-[11px] font-mono text-slate-400 mb-1 block uppercase font-semibold">
                        Ollama Base URL
                      </label>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          value={ollamaBaseUrl}
                          onChange={(e) => setOllamaBaseUrl(e.target.value)}
                          placeholder="http://localhost:11434"
                          className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-purple-500"
                        />
                        <button
                          type="button"
                          onClick={() => fetchModelsForProvider('ollama', undefined, ollamaBaseUrl)}
                          disabled={fetchingModels}
                          className="px-3 py-2 bg-purple-600/30 hover:bg-purple-600 text-purple-300 hover:text-white rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50 whitespace-nowrap"
                          title="Query local Ollama instance for installed models"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${fetchingModels ? 'animate-spin' : ''}`} />
                          <span>{fetchingModels ? 'Querying...' : 'Fetch Models'}</span>
                        </button>
                      </div>
                      {modelFetchStatus && (
                        <div className={`text-[10px] font-mono mt-1 ${modelFetchStatus.success ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {modelFetchStatus.message}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-mono text-slate-400 uppercase font-semibold">
                          API Key ({llmProvider.toUpperCase()})
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowApiKey((prev) => !prev)}
                          className="text-purple-400 hover:text-purple-300 text-[10px]"
                        >
                          {showApiKey ? 'Hide' : 'Show'}
                        </button>
                      </div>
                      <div className="flex gap-1.5">
                        <div className="relative flex-1">
                          <Key className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type={showApiKey ? 'text' : 'password'}
                            value={llmApiKey}
                            onChange={(e) => setLlmApiKey(e.target.value)}
                            onBlur={() => {
                              if (llmApiKey.trim()) {
                                fetchModelsForProvider(llmProvider, llmApiKey);
                              }
                            }}
                            placeholder={`Enter ${llmProvider.toUpperCase()} API key...`}
                            className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-purple-500"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => fetchModelsForProvider(llmProvider, llmApiKey)}
                          disabled={fetchingModels || !llmApiKey.trim()}
                          className="px-3 py-2 bg-purple-600/30 hover:bg-purple-600 text-purple-300 hover:text-white rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50 whitespace-nowrap"
                          title="Retrieve model list from this API key"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${fetchingModels ? 'animate-spin' : ''}`} />
                          <span>{fetchingModels ? 'Fetching...' : 'Fetch Models'}</span>
                        </button>
                      </div>
                      {modelFetchStatus && (
                        <div className={`text-[10px] font-mono mt-1 ${modelFetchStatus.success ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {modelFetchStatus.message}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Temperature */}
                  <div>
                    <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-1 uppercase font-semibold">
                      <span>Reasoning Temperature</span>
                      <span className="text-purple-400 font-bold">{temperature.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="0.0"
                      max="1.0"
                      step="0.05"
                      value={temperature}
                      onChange={(e) => setTemperature(parseFloat(e.target.value))}
                      className="w-full accent-purple-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer mt-2"
                    />
                    <div className="flex justify-between text-[9px] text-slate-600 font-mono mt-1">
                      <span>0.0 (Deterministic)</span>
                      <span>1.0 (Creative)</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          {/* Preset Strategy Cards */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Quantitative Strategy Presets (1-Click Setup)
                </h4>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">Select a pre-tuned strategy or customize below</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {STRATEGY_PRESETS.map((preset) => {
                const isActive = activePresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => handleApplyPreset(preset)}
                    className={`p-3.5 rounded-2xl text-left transition-all border ${
                      isActive
                        ? 'bg-blue-600/20 border-blue-500 text-white shadow-lg shadow-blue-500/10'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-xs text-white">{preset.name}</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300">
                        {preset.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-snug line-clamp-2">
                      {preset.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Prompts & Natural Language Strategy Rules */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Custom System Prompt (AI Quantitative Thesis)</span>
                <span className="text-[10px] text-slate-500 font-mono">{systemPrompt.length} chars</span>
              </label>
              <textarea
                value={systemPrompt}
                onChange={(e) => {
                  setSystemPrompt(e.target.value);
                  setActivePresetId('custom');
                }}
                rows={4}
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 font-mono focus:outline-none focus:border-blue-500 transition-colors resize-none leading-relaxed"
                placeholder="Enter system prompt instructions for the autonomous market scanner..."
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Quantitative Decision Rules &amp; Execution Matrix</span>
                <span className="text-[10px] text-slate-500 font-mono">Confluence Logic</span>
              </label>
              <textarea
                value={decisionRules}
                onChange={(e) => {
                  setDecisionRules(e.target.value);
                  setActivePresetId('custom');
                }}
                rows={4}
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 font-mono focus:outline-none focus:border-blue-500 transition-colors resize-none leading-relaxed"
                placeholder="1. Buy on oversold RSI dip...\n2. Short on exhaustion...\n3. Take profit..."
              />
            </div>
          </div>

          {/* Numerical Threshold Sliders & Risk Guardrails */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>Risk Guardrails &amp; Indicator Threshold Controls</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-950/70 p-4 rounded-2xl border border-slate-800/80">
              {/* Take Profit */}
              <div>
                <div className="flex justify-between text-xs font-mono text-slate-400 mb-1">
                  <span>Take Profit Target</span>
                  <span className="text-emerald-400 font-bold">+{takeProfitPercent}%</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="8.0"
                  step="0.1"
                  value={takeProfitPercent}
                  onChange={(e) => {
                    setTakeProfitPercent(parseFloat(e.target.value));
                    setActivePresetId('custom');
                  }}
                  className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-slate-600 font-mono mt-1">
                  <span>0.5% (Scalp)</span>
                  <span>8.0% (Swing)</span>
                </div>
              </div>

              {/* Stop Loss */}
              <div>
                <div className="flex justify-between text-xs font-mono text-slate-400 mb-1">
                  <span>Stop Loss Threshold</span>
                  <span className="text-rose-400 font-bold">-{stopLossPercent}%</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="4.0"
                  step="0.1"
                  value={stopLossPercent}
                  onChange={(e) => {
                    setStopLossPercent(parseFloat(e.target.value));
                    setActivePresetId('custom');
                  }}
                  className="w-full accent-rose-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-slate-600 font-mono mt-1">
                  <span>-0.5% (Tight)</span>
                  <span>-4.0% (Wide)</span>
                </div>
              </div>

              {/* RSI Oversold Buy Level */}
              <div>
                <div className="flex justify-between text-xs font-mono text-slate-400 mb-1">
                  <span>RSI Buy Threshold (Dip)</span>
                  <span className="text-blue-400 font-bold">&le; {rsiBuyThreshold}</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="50"
                  step="1"
                  value={rsiBuyThreshold}
                  onChange={(e) => {
                    setRsiBuyThreshold(parseInt(e.target.value));
                    setActivePresetId('custom');
                  }}
                  className="w-full accent-blue-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-slate-600 font-mono mt-1">
                  <span>20 (Panic Dip)</span>
                  <span>50 (Mild Pullback)</span>
                </div>
              </div>

              {/* RSI Overbought Short Level */}
              <div>
                <div className="flex justify-between text-xs font-mono text-slate-400 mb-1">
                  <span>RSI Short Threshold (Peak)</span>
                  <span className="text-amber-400 font-bold">&ge; {rsiShortThreshold}</span>
                </div>
                <input
                  type="range"
                  min="55"
                  max="85"
                  step="1"
                  value={rsiShortThreshold}
                  onChange={(e) => {
                    setRsiShortThreshold(parseInt(e.target.value));
                    setActivePresetId('custom');
                  }}
                  className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-slate-600 font-mono mt-1">
                  <span>55 (Early Peak)</span>
                  <span>85 (Extreme Mania)</span>
                </div>
              </div>

              {/* Max Allocation Per Stock */}
              <div>
                <div className="flex justify-between text-xs font-mono text-slate-400 mb-1">
                  <span>Max Allocation / Stock</span>
                  <span className="text-white font-bold">₹{maxAllocationPerStock.toLocaleString('en-IN')}</span>
                </div>
                <input
                  type="range"
                  min="2000"
                  max="50000"
                  step="1000"
                  value={maxAllocationPerStock}
                  onChange={(e) => {
                    setMaxAllocationPerStock(parseInt(e.target.value));
                    setActivePresetId('custom');
                  }}
                  className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-slate-600 font-mono mt-1">
                  <span>₹2,000</span>
                  <span>₹50,000</span>
                </div>
              </div>

              {/* Minimum Conviction / Confidence */}
              <div>
                <div className="flex justify-between text-xs font-mono text-slate-400 mb-1">
                  <span>Min Agent Conviction</span>
                  <span className="text-purple-400 font-bold">&ge; {minConfidence}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="95"
                  step="5"
                  value={minConfidence}
                  onChange={(e) => {
                    setMinConfidence(parseInt(e.target.value));
                    setActivePresetId('custom');
                  }}
                  className="w-full accent-purple-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-slate-600 font-mono mt-1">
                  <span>50% (High Action)</span>
                  <span>95% (High Conviction)</span>
                </div>
              </div>

              {/* Product Type (MIS vs CNC) */}
              <div>
                <div className="text-xs font-mono text-slate-400 mb-1.5">Execution Product Type</div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setProductType('MIS');
                      setActivePresetId('custom');
                    }}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${
                      productType === 'MIS'
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                        : 'bg-slate-900 text-slate-400 border border-slate-800'
                    }`}
                  >
                    MIS (5x Margin)
                  </button>
                  <button
                    onClick={() => {
                      setProductType('CNC');
                      setActivePresetId('custom');
                    }}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${
                      productType === 'CNC'
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                        : 'bg-slate-900 text-slate-400 border border-slate-800'
                    }`}
                  >
                    CNC (1x Delivery)
                  </button>
                </div>
              </div>

              {/* Sweep Interval */}
              <div>
                <div className="text-xs font-mono text-slate-400 mb-1.5">Sweep Loop Cadence</div>
                <select
                  value={intervalSec}
                  onChange={(e) => {
                    const sec = Number(e.target.value);
                    setIntervalSec(sec);
                    setCountdown(sec);
                    setActivePresetId('custom');
                  }}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-blue-500 font-mono"
                >
                  <option value={10}>10 Seconds (Ultra-Fast Scalper)</option>
                  <option value={15}>15 Seconds (High Frequency)</option>
                  <option value={20}>20 Seconds (Standard Balance)</option>
                  <option value={30}>30 Seconds (Conservative)</option>
                  <option value={60}>60 Seconds (Full-Day Swing)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Universe Scrip Multi-Select & Custom Ticker Input */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Globe2 className="w-4 h-4 text-blue-400" />
                  <span>Monitored Ticker Universe ({customUniverse.length} Active Scrips)</span>
                </h4>
                <p className="text-[11px] text-slate-400">Click any stock to toggle inclusion. Add custom ticker symbols below.</p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setCustomUniverse(WHOLE_MARKET_UNIVERSE)}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Select All 20
                </button>
                <button
                  onClick={() => setCustomUniverse(WHOLE_MARKET_UNIVERSE.filter((s) => s.endsWith('.NS')))}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  NSE India Only (16)
                </button>
                <button
                  onClick={() => setCustomUniverse(WHOLE_MARKET_UNIVERSE.filter((s) => !s.endsWith('.NS')))}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  NASDAQ Only (4)
                </button>
              </div>
            </div>

            {/* Ticker pills */}
            <div className="flex flex-wrap gap-2 p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800 max-h-36 overflow-y-auto scrollbar-none">
              {WHOLE_MARKET_UNIVERSE.map((sym) => {
                const isSelected = customUniverse.includes(sym);
                return (
                  <button
                    key={sym}
                    onClick={() => handleToggleTicker(sym)}
                    className={`px-2.5 py-1 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all ${
                      isSelected
                        ? 'bg-blue-600/30 text-blue-300 border border-blue-500/50 shadow-sm'
                        : 'bg-slate-900 text-slate-500 border border-slate-800 hover:text-slate-300'
                    }`}
                  >
                    <span>{sym}</span>
                    {isSelected ? <Check className="w-3 h-3 text-blue-400" /> : <Plus className="w-3 h-3 text-slate-600" />}
                  </button>
                );
              })}

              {/* Any additional custom tickers added by user */}
              {customUniverse
                .filter((s) => !WHOLE_MARKET_UNIVERSE.includes(s))
                .map((sym) => (
                  <button
                    key={sym}
                    onClick={() => handleToggleTicker(sym)}
                    className="px-2.5 py-1 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 bg-emerald-600/30 text-emerald-300 border border-emerald-500/50 shadow-sm"
                  >
                    <span>{sym} (Custom)</span>
                    <X className="w-3 h-3 text-emerald-400" />
                  </button>
                ))}
            </div>

            {/* Add Custom Ticker Input */}
            <div className="flex items-center gap-2 mt-3 max-w-md">
              <input
                type="text"
                placeholder="Add custom scrip (e.g. WIPRO.NS or GOOGL)..."
                value={newTickerInput}
                onChange={(e) => setNewTickerInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCustomTicker()}
                className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 font-mono focus:outline-none focus:border-blue-500 uppercase placeholder:normal-case"
              />
              <button
                onClick={handleAddCustomTicker}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>
          </div>

          {/* Action Footer: Save & Reset */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800/80">
            <button
              onClick={handleResetDefaults}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-mono font-bold transition-all flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to Defaults</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsCustomizing(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-bold transition-all"
              >
                Close Drawer
              </button>
              <button
                onClick={handleSaveConfig}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-black uppercase tracking-wider transition-all shadow-lg shadow-emerald-600/20 flex items-center gap-2"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Strategy</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Configuration & Status Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 py-5 border-b border-slate-800 text-xs font-mono relative z-10">
        {/* Runner Status */}
        <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Desk Status</div>
            <div className="text-sm font-bold text-white flex items-center gap-2 mt-0.5">
              {isRunning ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-emerald-400">ACTIVE</span>
                </>
              ) : (
                <span className="text-slate-400">STANDBY</span>
              )}
            </div>
          </div>
          {isRunning && (
            <div className="text-right">
              <span className="text-[10px] text-slate-500">Next</span>
              <div className="text-xs font-bold text-emerald-400">{countdown}s</div>
            </div>
          )}
        </div>

        {/* AI LLM Engine Status */}
        <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold mb-0.5 flex items-center gap-1">
              <Bot className="w-3 h-3 text-purple-400" />
              <span>LLM Engine</span>
            </div>
            <div className="text-xs font-bold text-slate-200 truncate max-w-[100px]">
              {enableLLM ? `${llmProvider.toUpperCase()}` : 'HEURISTIC'}
            </div>
          </div>
          <button
            onClick={() => setIsCustomizing(true)}
            className="text-[10px] font-bold text-purple-400 hover:underline"
          >
            {enableLLM ? llmModel.split('-')[0] : 'Enable'}
          </button>
        </div>

        {/* Universe Scope */}
        <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold mb-0.5">Universe</div>
            <div className="text-xs font-bold text-slate-200">
              {customUniverse.length} Scrips
            </div>
          </div>
          <button
            onClick={() => setIsCustomizing(true)}
            className="text-[10px] font-bold text-blue-400 hover:underline"
          >
            Edit
          </button>
        </div>

        {/* Firebase Realtime Database Status */}
        <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold mb-0.5 flex items-center gap-1">
              <Flame className="w-3 h-3 text-orange-400" />
              <span>Firebase RTDB</span>
            </div>
            <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${rtdbConnected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
              <span className={rtdbConnected ? 'text-emerald-400' : 'text-slate-400'}>
                {rtdbConnected ? 'LIVE SYNC' : 'SYNCING'}
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-500 font-mono">0ms Latency</span>
          </div>
        </div>

        {/* Short Selling Toggle */}
        <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Shorting</div>
            <div className="text-xs font-bold text-slate-200 mt-0.5">
              {allowShorts ? `ON (${productType})` : 'LONG-ONLY'}
            </div>
          </div>
          <button
            onClick={() => setAllowShorts((prev) => !prev)}
            className={`w-9 h-5 rounded-full transition-colors relative p-0.5 ${
              allowShorts ? 'bg-emerald-500' : 'bg-slate-700'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white transition-transform ${
                allowShorts ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Sweep Interval */}
        <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase font-semibold mb-1">Cadence</div>
          <select
            value={intervalSec}
            onChange={(e) => {
              const sec = Number(e.target.value);
              setIntervalSec(sec);
              setCountdown(sec);
            }}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-1.5 py-1 text-slate-200 text-xs focus:outline-none focus:border-blue-500 font-mono"
          >
            <option value={10}>10s (Fast)</option>
            <option value={15}>15s</option>
            <option value={20}>20s</option>
            <option value={30}>30s</option>
            <option value={60}>60s</option>
          </select>
        </div>
      </div>

      {/* Real-time LLM Quantitative CIO Thesis & Market Synthesis Card */}
      {scanResult?.llmThesis && (
        <div className="mt-6 p-5 rounded-3xl bg-gradient-to-r from-purple-950/40 via-slate-950 to-blue-950/40 border border-purple-500/30 relative overflow-hidden shadow-2xl relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-3 border-b border-slate-800/80">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-extrabold text-sm text-white tracking-tight">AI Quantitative CIO Thesis</h4>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase font-bold">
                    {scanResult.llmThesis.provider} · {scanResult.llmThesis.model}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-mono">
                  Autonomous Multi-LLM Market Synthesis &amp; Trade Endorsement
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 font-mono">
              <span
                className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                  scanResult.llmThesis.sentiment === 'BULLISH'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : scanResult.llmThesis.sentiment === 'BEARISH'
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}
              >
                {scanResult.llmThesis.sentiment} OUTLOOK
              </span>
              {scanResult.llmThesis.latencyMs && (
                <span className="text-[10px] text-slate-500 font-bold">
                  {scanResult.llmThesis.latencyMs}ms
                </span>
              )}
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans mb-3 italic">
            &ldquo;{scanResult.llmThesis.commentary}&rdquo;
          </p>

          {scanResult.llmThesis.highConvictionPicks?.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap text-xs font-mono pt-2 border-t border-slate-900">
              <span className="text-[10px] text-purple-300 font-bold uppercase">High-Conviction Scrips:</span>
              {scanResult.llmThesis.highConvictionPicks.map((pick) => (
                <span
                  key={pick}
                  className="px-2.5 py-0.5 rounded-lg bg-purple-600/30 text-purple-200 border border-purple-500/40 text-xs font-bold"
                >
                  {pick}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Main Two-Column View: Left (Signals Matrix) | Right (Execution Feed) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-6 relative z-10">
        {/* Left Column (7 cols): Real-Time Universe Signals Matrix */}
        <div className="lg:col-span-7 bg-slate-950/60 border border-slate-800/80 rounded-2xl p-5">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Universe Signals Matrix ({activeSignals.length > 0 ? activeSignals.length : customUniverse.length} Stocks)
              </h4>
            </div>
            {scanResult && (
              <span className="text-[11px] text-slate-400 font-mono">
                Sweep Latency: <span className="text-emerald-400 font-bold">{scanResult.latencyMs}ms</span>
              </span>
            )}
          </div>

          {activeSignals.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-400 font-mono">
              <Radio className="w-8 h-8 text-blue-400 mx-auto mb-2 animate-pulse" />
              <div>Desk Standing By. Click &quot;Start Agent&quot; or &quot;Sweep Once&quot; to scan the universe.</div>
            </div>
          ) : (
            <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1 scrollbar-none font-mono text-xs">
              {activeSignals.map((sig) => {
                const isBuy = sig.signal === 'BUY';
                const isShort = sig.signal === 'SHORT';
                const isExit = sig.signal === 'SELL' || sig.signal === 'COVER';
                const currency = sig.symbol.endsWith('.NS') ? '₹' : '$';

                return (
                  <div
                    key={sig.symbol}
                    className="p-3 rounded-xl bg-slate-900/70 border border-slate-800/80 hover:border-slate-700 transition-colors flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-xs">{sig.symbol}</span>
                        <span className="text-[10px] text-slate-400 truncate max-w-[120px]">
                          {sig.name}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <span className="text-white font-bold">{currency}{sig.price.toFixed(2)}</span>
                        <span className={sig.changePercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                          {sig.changePercent >= 0 ? '+' : ''}{sig.changePercent.toFixed(2)}%
                        </span>
                        <span>•</span>
                        <span>RSI: {sig.rsi}</span>
                        <span>•</span>
                        <span className="text-slate-500">Conv: {sig.confidence}%</span>
                      </div>
                    </div>

                    <div className="text-right flex items-center gap-2.5">
                      {sig.activePosition !== 'NONE' && (
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                            sig.activePosition === 'LONG'
                              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          POS: {sig.activePosition} ({sig.holdingQuantity})
                        </span>
                      )}

                      <span
                        className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider ${
                          isBuy
                            ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                            : isShort
                            ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30'
                            : isExit
                            ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {sig.signal}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column (5 cols): Live Action Logs & RTDB Stream */}
        <div className="lg:col-span-5 bg-slate-950/60 border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            {/* Tab Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
              <div className="flex items-center gap-1.5 p-0.5 bg-slate-900 border border-slate-800 rounded-lg">
                <button
                  type="button"
                  onClick={() => setFeedTab('AGENT_LOGS')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                    feedTab === 'AGENT_LOGS'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5" />
                  Agent Feed ({executionLogs.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFeedTab('FIREBASE_RTDB')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                    feedTab === 'FIREBASE_RTDB'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-amber-400/90 hover:text-amber-300'
                  }`}
                >
                  <Flame className="w-3.5 h-3.5" />
                  Firestore Live
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block ml-0.5" />
                </button>
              </div>

              <div className="flex items-center gap-1.5 text-[10px] font-mono">
                {feedTab === 'FIREBASE_RTDB' ? (
                  <span className="text-amber-400 flex items-center gap-1">
                    <Database className="w-3 h-3" />
                    Firestore onSnapshot: 0ms sync
                  </span>
                ) : (
                  <span className="text-emerald-400">Atomic Settlement</span>
                )}
              </div>
            </div>

            {feedTab === 'AGENT_LOGS' ? (
              // Tab 1: Agent Execution Tickets
              executionLogs.length === 0 ? (
                <div className="py-20 text-center text-xs text-slate-500 font-mono">
                  <Clock className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <div>No trades triggered yet in this session.</div>
                  <div className="text-[10px] text-slate-600 mt-1">
                    The agent will record every executed Buy, Short, and Sell ticket here.
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1 scrollbar-none font-mono text-xs">
                  {executionLogs.map((item) => {
                    const isBuy = item.action === 'BUY';
                    const isShort = item.action === 'SHORT';
                    const currency = item.symbol.endsWith('.NS') ? '₹' : '$';

                    return (
                      <div
                        key={item.id}
                        className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              isBuy
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                : isShort
                                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                                : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                            }`}
                          >
                            {item.action} ({productType})
                          </span>
                          <span className="text-[10px] text-slate-500">{item.timestamp}</span>
                        </div>

                        <div className="font-bold text-white mb-1">
                          {item.quantity}x {item.symbol} @ {currency}{item.price.toFixed(2)}
                        </div>

                        <div className="text-[11px] text-slate-400 mb-1">
                          Value: {currency}{item.totalValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                          {item.marginUsed > 0 && ` • Margin: ${currency}${item.marginUsed.toFixed(2)}`}
                        </div>

                        {item.realizedPnL !== undefined && (
                          <div
                            className={`text-[11px] font-bold ${
                              item.realizedPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            Realized P&L: {item.realizedPnL >= 0 ? '+' : ''}{currency}{item.realizedPnL.toFixed(2)}
                          </div>
                        )}

                        <div className="text-[10px] text-slate-400 mt-1 italic leading-tight">
                          &quot;{item.reason}&quot;
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            ) : (
              // Tab 2: Firestore Live Database Stream
              <div className="space-y-3 font-mono text-xs">
                {/* Realtime Balance Widget */}
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
                      Live Firestore Cash
                    </div>
                    <div className="text-base font-extrabold text-white mt-0.5">
                      ₹{(rtdbBalance ?? 100000).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Live Stream
                    </span>
                    <div className="text-[10px] text-slate-400 mt-1">
                      {rtdbPositions.length} pos • {rtdbOrders.length} orders
                    </div>
                  </div>
                </div>

                {/* RTDB Positions */}
                <div>
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 mb-1.5">
                    <span>Active Positions (Firestore)</span>
                    <span className="text-slate-500">{rtdbPositions.length} active</span>
                  </div>

                  {rtdbPositions.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-500 bg-slate-900/40 rounded-xl border border-slate-800">
                      No open positions in Firebase Realtime Database.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[190px] overflow-y-auto pr-1 scrollbar-none">
                      {rtdbPositions.map((pos) => {
                        const isShort = pos.positionType === 'SHORT';
                        const currency = pos.symbol.endsWith('.NS') ? '₹' : '$';
                        const current = pos.currentPrice || pos.avgPrice;
                        const pnl = isShort
                          ? (pos.avgPrice - current) * pos.quantity
                          : (current - pos.avgPrice) * pos.quantity;

                        return (
                          <div
                            key={pos.symbol}
                            className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs flex items-center justify-between"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-white">{pos.symbol}</span>
                                <span
                                  className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                                    isShort
                                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  }`}
                                >
                                  {pos.positionType || 'LONG'}
                                </span>
                                {pos.productType && (
                                  <span className="text-[9px] text-slate-500 bg-slate-800 px-1 rounded">
                                    {pos.productType}
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                {pos.quantity} shares @ {currency}{pos.avgPrice.toFixed(2)}
                              </div>
                            </div>
                            <div className="text-right">
                              <div
                                className={`font-bold ${
                                  pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
                                }`}
                              >
                                {pnl >= 0 ? '+' : ''}{currency}{pnl.toFixed(2)}
                              </div>
                              <div className="text-[10px] text-slate-500">
                                LTP: {currency}{current.toFixed(2)}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* RTDB Live Order Events */}
                <div>
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 mb-1.5">
                    <span>Recent Realtime Orders</span>
                    <span className="text-slate-500">{rtdbOrders.length} events</span>
                  </div>

                  {rtdbOrders.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-500 bg-slate-900/40 rounded-xl border border-slate-800">
                      No order notifications published to Firebase RTDB yet.
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-[170px] overflow-y-auto pr-1 scrollbar-none text-[11px]">
                      {rtdbOrders.slice(0, 10).map((ord) => {
                        const isBuy = ord.side === 'BUY';
                        const isShort = ord.side === 'SHORT';
                        const currency = ord.symbol.endsWith('.NS') ? '₹' : '$';

                        return (
                          <div
                            key={ord.orderId}
                            className="p-2 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                                  isBuy
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : isShort
                                    ? 'bg-rose-500/20 text-rose-400'
                                    : 'bg-amber-500/20 text-amber-400'
                                }`}
                              >
                                {ord.side}
                              </span>
                              <span className="font-semibold text-white">{ord.symbol}</span>
                              <span className="text-slate-400 text-[10px]">
                                {ord.quantity}x @ {currency}{ord.price.toFixed(2)}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {ord.timestamp ? new Date(ord.timestamp).toLocaleTimeString() : 'Just now'}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-800 text-right">
            <Link href="/portfolio" className="text-xs font-mono text-blue-400 hover:text-blue-300">
              View All Positions in Portfolio Ledger →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
