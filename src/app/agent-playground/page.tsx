'use client';

import { useState, useEffect, useRef } from 'react';
import Sidebar from '@/components/Sidebar';
import TopNav from '@/components/TopNav';
import { toast } from 'sonner';
import { soundManager } from '@/lib/sound';
import confetti from 'canvas-confetti';
import {
  Cpu,
  Play,
  Square,
  RotateCcw,
  Sparkles,
  Bot,
  Terminal,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  AlertCircle,
  Code2,
  Activity,
  Copy,
  Check,
  Plus,
  Settings2,
  Key,
  Trash2,
  Eye,
  EyeOff,
  Zap,
  ShieldAlert,
  Sliders,
  Server,
  Layers,
  ChevronDown,
  ChevronUp,
  Radio,
  Clock,
  ArrowRight,
  Mail,
  Send,
  FileText,
  ShieldCheck,
  CheckCircle,
} from 'lucide-react';
import { AGENT_TEMPLATES, BacktestResult } from '@/lib/agents/engine';
import {
  AIProvider,
  CustomAgentConfig,
  AgentTradeDecision,
  PROVIDER_METADATA,
  PRESET_AGENTS,
} from '@/lib/agents/customAgent';

export default function AgentPlayground() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [playgroundMode, setPlaygroundMode] = useState<'LLM_AGENTS' | 'QUANT_CODE' | 'API_DOCS'>('LLM_AGENTS');

  // ==========================================
  // LLM AGENT STUDIO STATE
  // ==========================================
  const [agents, setAgents] = useState<CustomAgentConfig[]>(PRESET_AGENTS);
  const [activeAgentId, setActiveAgentId] = useState<string>(PRESET_AGENTS[0].id);
  const [evalSymbol, setEvalSymbol] = useState<string>('RELIANCE.NS');
  const [evaluating, setEvaluating] = useState<boolean>(false);
  const [decision, setDecision] = useState<AgentTradeDecision | null>(null);
  const [decisionQuote, setDecisionQuote] = useState<any>(null);
  const [decisionIndicators, setDecisionIndicators] = useState<any>(null);
  const [executingOrder, setExecutingOrder] = useState<boolean>(false);
  const [showRawOutput, setShowRawOutput] = useState<boolean>(false);

  // Ollama local connectivity state
  const [ollamaStatus, setOllamaStatus] = useState<{
    connected: boolean;
    models: { name: string; sizeMb?: string; parameterSize?: string }[];
    error?: string;
  }>({ connected: false, models: [] });

  // Custom Agent Creation/Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<CustomAgentConfig | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);

  // Dynamic model discovery state
  const [fetchingModels, setFetchingModels] = useState<boolean>(false);
  const [dynamicModels, setDynamicModels] = useState<
    { id: string; label: string; description?: string }[]
  >([]);
  const [modelFetchStatus, setModelFetchStatus] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // Form State for modal
  const [formName, setFormName] = useState('');
  const [formRole, setFormRole] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formAvatar, setFormAvatar] = useState('🤖');
  const [formProvider, setFormProvider] = useState<AIProvider>('ollama');
  const [formModel, setFormModel] = useState('gemma3:1b');
  const [formOllamaUrl, setFormOllamaUrl] = useState('http://localhost:11434');
  const [formApiKey, setFormApiKey] = useState('');
  const [formPrompt, setFormPrompt] = useState('');
  const [formTemperature, setFormTemperature] = useState(0.1);
  const [formMaxRisk, setFormMaxRisk] = useState(5);

  // User portfolio cash
  const [portfolioBalance, setPortfolioBalance] = useState<number>(1000000);

  // Autonomous Broker Mode & Email State
  const [autoPilotBroker, setAutoPilotBroker] = useState<boolean>(true);
  const [sendGmailAlert, setSendGmailAlert] = useState<boolean>(false);
  const [brokerNote, setBrokerNote] = useState<string>('');
  const [brokerAuditLogs, setBrokerAuditLogs] = useState<
    Array<{ id: string; time: string; text: string; side: string }>
  >([]);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailRecipient, setEmailRecipient] = useState('dev7anshvpurohit@gmail.com');
  const [emailSending, setEmailSending] = useState(false);
  const [emailPreviewHtml, setEmailPreviewHtml] = useState<string | null>(null);

  // Autonomous Continuous Agent Runner State
  const [isRunnerActive, setIsRunnerActive] = useState(false);
  const [runnerCycle, setRunnerCycle] = useState(0);
  const [countdown, setCountdown] = useState(20);
  const runnerTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (runnerTimerRef.current) clearInterval(runnerTimerRef.current);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, []);

  // Dynamic fetch models for API key / provider
  const fetchModelsForKey = async (provider: AIProvider, key: string, ollamaUrl?: string) => {
    if (provider !== 'ollama' && (!key || key.trim().length < 4)) {
      setModelFetchStatus(null);
      setDynamicModels([]);
      return;
    }

    setFetchingModels(true);
    setModelFetchStatus(null);

    try {
      const res = await fetch('/api/agents/provider-models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          apiKey: key.trim(),
          ollamaBaseUrl: ollamaUrl || 'http://localhost:11434',
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.models) && data.models.length > 0) {
        setDynamicModels(data.models);
        setModelFetchStatus({
          success: true,
          message: `Verified: ${data.models.length} models retrieved from your ${PROVIDER_METADATA[provider].name} account`,
        });
        const exists = data.models.some((m: any) => m.id === formModel);
        if (!exists && data.models[0]?.id) {
          setFormModel(data.models[0].id);
        }
      } else {
        setDynamicModels([]);
        setModelFetchStatus({
          success: false,
          message: data.error || 'Failed to retrieve models with this key.',
        });
      }
    } catch (err: any) {
      setDynamicModels([]);
      setModelFetchStatus({
        success: false,
        message: err.message || 'Connection error',
      });
    } finally {
      setFetchingModels(false);
    }
  };

  // ==========================================
  // QUANT CODE BACKTESTER STATE
  // ==========================================
  const [selectedTemplate, setSelectedTemplate] = useState<string>('rsi_momentum');
  const [code, setCode] = useState<string>(AGENT_TEMPLATES[0].code);
  const [quantSymbol, setQuantSymbol] = useState<string>('RELIANCE.NS');
  const [quantPeriod, setQuantPeriod] = useState<string>('1mo');
  const [initialCapital, setInitialCapital] = useState<number>(100000);
  const [quantLoading, setQuantLoading] = useState<boolean>(false);
  const [quantResult, setQuantResult] = useState<BacktestResult | null>(null);
  const [quantTab, setQuantTab] = useState<'CONSOLE' | 'TRADES' | 'API'>('CONSOLE');
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Load custom agents and keys from localStorage + probe Ollama
  useEffect(() => {
    // 1. Fetch user portfolio balance
    fetch('/api/portfolio')
      .then((res) => res.json())
      .then((data) => {
        if (data?.portfolio?.balance) {
          setPortfolioBalance(data.portfolio.balance);
        }
      })
      .catch(() => {});

    // 2. Check Ollama local status
    fetch('/api/agents/ollama-models')
      .then((res) => res.json())
      .then((data) => {
        if (data.connected) {
          setOllamaStatus({
            connected: true,
            models: data.models || [],
          });
        } else {
          setOllamaStatus({
            connected: false,
            models: [],
            error: data.error,
          });
        }
      })
      .catch((err) => {
        setOllamaStatus({ connected: false, models: [], error: err.message });
      });

    // 3. Load saved custom agents & API keys from localStorage
    try {
      const savedAgents = localStorage.getItem('tradesphere_custom_agents');
      const savedKeys = JSON.parse(localStorage.getItem('tradesphere_api_keys') || '{}');

      // Hydrate presets with any stored keys
      const hydratedPresets = PRESET_AGENTS.map((preset) => {
        if (savedKeys[preset.provider]) {
          return { ...preset, apiKey: savedKeys[preset.provider] };
        }
        return preset;
      });

      if (savedAgents) {
        const parsed = JSON.parse(savedAgents);
        const hydratedCustom = parsed.map((agent: CustomAgentConfig) => {
          if (savedKeys[agent.provider] && !agent.apiKey) {
            return { ...agent, apiKey: savedKeys[agent.provider] };
          }
          return agent;
        });
        setAgents([...hydratedPresets, ...hydratedCustom]);
      } else {
        setAgents(hydratedPresets);
      }
    } catch (e) {
      console.warn('Failed loading agents from localStorage:', e);
    }
  }, []);

  const activeAgent = agents.find((a) => a.id === activeAgentId) || agents[0];

  // ==========================================
  // AGENT MODAL HANDLERS
  // ==========================================
  const handleOpenCreateModal = () => {
    setEditingAgent(null);
    setFormName('');
    setFormRole('Algorithmic Scalper');
    setFormDescription('Custom AI trading agent tailored for technical momentum and breakout setups.');
    setFormAvatar('🤖');
    const defaultProv = ollamaStatus.connected ? 'ollama' : 'openai';
    setFormProvider(defaultProv);
    const initialModel =
      ollamaStatus.connected && ollamaStatus.models.length > 0
        ? ollamaStatus.models[0].name
        : 'gpt-4o-mini';
    setFormModel(initialModel);
    setFormOllamaUrl('http://localhost:11434');

    const savedKeys = JSON.parse(localStorage.getItem('tradesphere_api_keys') || '{}');
    const activeKey = savedKeys[defaultProv] || '';
    setFormApiKey(activeKey);

    setFormPrompt(
      `You are an expert quantitative trading bot.
Analyze current RSI, MACD, Bollinger Bands, and Moving Averages.
Look for high-probability setups with minimum 1:2 Risk-Reward ratio.
Strictly return your final decision as a JSON object.`
    );
    setFormTemperature(0.1);
    setFormMaxRisk(5);
    setIsModalOpen(true);

    fetchModelsForKey(defaultProv, activeKey, 'http://localhost:11434');
  };

  const handleOpenEditModal = (agent: CustomAgentConfig) => {
    setEditingAgent(agent);
    setFormName(agent.name);
    setFormRole(agent.role);
    setFormDescription(agent.description);
    setFormAvatar(agent.avatar);
    setFormProvider(agent.provider);
    setFormModel(agent.model);
    setFormOllamaUrl(agent.ollamaBaseUrl || 'http://localhost:11434');
    setFormApiKey(agent.apiKey || '');
    setFormPrompt(agent.systemPrompt);
    setFormTemperature(agent.temperature);
    setFormMaxRisk(agent.maxRiskPerTradePercent);
    setIsModalOpen(true);

    fetchModelsForKey(agent.provider, agent.apiKey || '', agent.ollamaBaseUrl);
  };

  const handleSaveAgent = () => {
    if (!formName.trim()) {
      toast.error('Please enter an Agent Name');
      return;
    }

    if (PROVIDER_METADATA[formProvider].requiresApiKey && !formApiKey.trim()) {
      toast.error(`${PROVIDER_METADATA[formProvider].name} requires an API Key.`);
      return;
    }

    // Save key in localStorage for convenience
    if (formApiKey.trim()) {
      try {
        const savedKeys = JSON.parse(localStorage.getItem('tradesphere_api_keys') || '{}');
        savedKeys[formProvider] = formApiKey.trim();
        localStorage.setItem('tradesphere_api_keys', JSON.stringify(savedKeys));
      } catch (e) {
        console.warn(e);
      }
    }

    const agentPayload: CustomAgentConfig = {
      id: editingAgent ? editingAgent.id : `custom-${Date.now()}`,
      name: formName.trim(),
      role: formRole.trim() || 'Custom Trader',
      description: formDescription.trim() || 'Custom configured agent',
      avatar: formAvatar,
      provider: formProvider,
      model: formModel.trim(),
      ollamaBaseUrl: formOllamaUrl.trim(),
      apiKey: formApiKey.trim(),
      systemPrompt: formPrompt.trim(),
      temperature: Number(formTemperature),
      maxRiskPerTradePercent: Number(formMaxRisk),
      isCustom: true,
    };

    let updatedAgents: CustomAgentConfig[];
    if (editingAgent) {
      updatedAgents = agents.map((a) => (a.id === editingAgent.id ? agentPayload : a));
      toast.success(`Updated Agent: ${agentPayload.name}`);
    } else {
      updatedAgents = [...agents, agentPayload];
      toast.success(`Created New Agent: ${agentPayload.name}!`);
      setActiveAgentId(agentPayload.id);
    }

    setAgents(updatedAgents);

    // Save custom ones to localStorage
    const customOnly = updatedAgents.filter((a) => a.isCustom);
    localStorage.setItem('tradesphere_custom_agents', JSON.stringify(customOnly));

    setIsModalOpen(false);
  };

  const handleDeleteAgent = (agentId: string) => {
    const updated = agents.filter((a) => a.id !== agentId);
    setAgents(updated);
    const customOnly = updated.filter((a) => a.isCustom);
    localStorage.setItem('tradesphere_custom_agents', JSON.stringify(customOnly));
    if (activeAgentId === agentId) {
      setActiveAgentId(updated[0]?.id || PRESET_AGENTS[0].id);
    }
    toast.info('Agent deleted.');
  };

  // ==========================================
  // RUN AGENT EVALUATION (LLM)
  // ==========================================
  const handleRunAgentEvaluation = async () => {
    if (!activeAgent) return;

    if (PROVIDER_METADATA[activeAgent.provider].requiresApiKey && !activeAgent.apiKey) {
      toast.error(`API Key Missing for ${PROVIDER_METADATA[activeAgent.provider].name}`, {
        description: 'Click the Settings icon on your agent to configure your personal API key.',
      });
      handleOpenEditModal(activeAgent);
      return;
    }

    setEvaluating(true);
    setDecision(null);

    toast.loading(`Consulting ${activeAgent.name} (${activeAgent.model})...`, {
      id: 'agent-eval',
    });

    try {
      const endpoint = autoPilotBroker ? '/api/agents/broker-execute' : '/api/agents/llm-decision';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent: activeAgent,
          symbol: evalSymbol,
          autoExecute: autoPilotBroker,
          sendGmailAlert,
          portfolio: {
            availableCash: portfolioBalance,
            currentHoldingQuantity: 0,
          },
        }),
      });

      const data = await res.json();
      toast.dismiss('agent-eval');

      if (res.ok && data.success) {
        setDecision(data.decision);
        setDecisionQuote(data.quote);
        setDecisionIndicators(data.indicators);
        if (data.brokerNote) setBrokerNote(data.brokerNote);

        soundManager.playOrderSuccess();

        if (autoPilotBroker && data.executed) {
          confetti({
            particleCount: 60,
            spread: 75,
            origin: { y: 0.6 },
          });
          toast.success(`⚡ [Autonomous Broker Executed]: ${data.decision.action} ${evalSymbol}`, {
            description: data.brokerNote,
          });

          // Append to broker audit log
          setBrokerAuditLogs((prev) => [
            {
              id: `log_${Date.now()}`,
              time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
              text: data.brokerNote,
              side: data.decision.action,
            },
            ...prev,
          ]);

          // Refresh balance
          fetch('/api/portfolio')
            .then((r) => r.json())
            .then((d) => {
              if (d?.portfolio?.balance) setPortfolioBalance(d.portfolio.balance);
            });
        } else if (data.decision.action === 'BUY') {
          confetti({
            particleCount: 40,
            spread: 60,
            origin: { y: 0.6 },
          });
          toast.success(`🚀 ${activeAgent.name} signals BUY for ${evalSymbol}!`, {
            description: `Confidence: ${data.decision.confidence}% | Target: ₹${data.decision.targetPrice}`,
          });
        } else if (data.decision.action === 'SELL') {
          toast.warning(`⚠️ ${activeAgent.name} signals SELL for ${evalSymbol}`, {
            description: `Stop Loss: ₹${data.decision.stopLoss} | ${data.decision.reasoning.slice(0, 80)}...`,
          });
        } else {
          toast.info(`⏸️ ${activeAgent.name} recommends HOLD for ${evalSymbol}`, {
            description: data.decision.reasoning.slice(0, 100),
          });
        }
      } else {
        soundManager.playOrderCancel();
        toast.error('Agent Evaluation Failed', {
          description: data.error || 'Check provider endpoint or API key',
        });
      }
    } catch (err: any) {
      toast.dismiss('agent-eval');
      soundManager.playOrderCancel();
      toast.error('Evaluation Error', { description: err.message || 'Network request failed' });
    } finally {
      setEvaluating(false);
    }
  };

  const startAgentRunner = () => {
    setIsRunnerActive(true);
    setRunnerCycle(1);
    setCountdown(20);
    toast.success('AI Agent Started!', {
      description: `Autonomous loop monitoring ${evalSymbol} every 20 seconds.`,
    });

    // Execute first evaluation immediately
    handleRunAgentEvaluation();

    // Start 20s interval
    runnerTimerRef.current = setInterval(() => {
      setRunnerCycle((prev) => prev + 1);
      setCountdown(20);
      handleRunAgentEvaluation();
    }, 20000);

    // 1-second countdown display
    countdownTimerRef.current = setInterval(() => {
      setCountdown((prev) => (prev > 1 ? prev - 1 : 20));
    }, 1000);
  };

  const stopAgentRunner = () => {
    setIsRunnerActive(false);
    if (runnerTimerRef.current) clearInterval(runnerTimerRef.current);
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    toast.info('AI Agent Stopped', {
      description: 'Autonomous trading loop has been paused.',
    });
  };

  const handleSendEmailReport = async () => {
    if (!emailRecipient || !emailRecipient.includes('@')) {
      toast.error('Please enter a valid recipient email address');
      return;
    }

    setEmailSending(true);
    toast.loading(`Generating & dispatching contract note to ${emailRecipient}...`, { id: 'email-report' });

    try {
      const res = await fetch('/api/user/email-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailRecipient,
          brokerNotes: decision ? [
            {
              symbol: evalSymbol,
              agentName: activeAgent.name,
              action: decision.action,
              rule: activeAgent.systemPrompt.slice(0, 120),
              confidence: decision.confidence,
              reasoning: decision.reasoning,
            }
          ] : undefined,
        }),
      });

      const data = await res.json();
      toast.dismiss('email-report');

      if (res.ok && data.success) {
        setEmailPreviewHtml(data.previewHtml || null);
        soundManager.playOrderSuccess();
        toast.success(`Contract note dispatched!`, {
          description: data.message,
        });
      } else {
        toast.error('Failed to send report', { description: data.error || data.message });
      }
    } catch (err: any) {
      toast.dismiss('email-report');
      toast.error('Error dispatching email', { description: err.message });
    } finally {
      setEmailSending(false);
    }
  };

  // ==========================================
  // EXECUTE AGENT TRADE IN FIRESTORE
  // ==========================================
  const handleExecuteAgentOrder = async () => {
    if (!decision || decision.action === 'HOLD') return;

    setExecutingOrder(true);
    try {
      const res = await fetch('/api/trade/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: evalSymbol,
          quantity: decision.recommendedQuantity || 1,
          orderSide: decision.action,
          orderType: 'MARKET',
          productType: 'MIS',
          targetPrice: decision.targetPrice,
          stopLoss: decision.stopLoss,
        }),
      });

      const data = await res.json();
      if (res.ok && (data.success || data.order)) {
        soundManager.playOrderSuccess();
        confetti({
          particleCount: 75,
          spread: 80,
          origin: { y: 0.5 },
        });
        toast.success(`Order Filled: ${decision.action} ${decision.recommendedQuantity} ${evalSymbol}!`, {
          description: `Executed by AI Agent ${activeAgent.name} at Market LTP.`,
        });

        // Refresh balance
        fetch('/api/portfolio')
          .then((r) => r.json())
          .then((d) => {
            if (d?.portfolio?.balance) setPortfolioBalance(d.portfolio.balance);
          });
      } else {
        soundManager.playOrderCancel();
        toast.error('Order Execution Failed', { description: data.error || 'Trade rejected' });
      }
    } catch (err: any) {
      soundManager.playOrderCancel();
      toast.error('Trade Execution Error', { description: err.message });
    } finally {
      setExecutingOrder(false);
    }
  };

  // ==========================================
  // QUANT CODE SIMULATOR HANDLER
  // ==========================================
  const handleSelectTemplate = (id: string) => {
    setSelectedTemplate(id);
    const tmpl = AGENT_TEMPLATES.find((t) => t.id === id);
    if (tmpl) {
      setCode(tmpl.code);
      toast.info(`Loaded template: ${tmpl.name}`);
    }
  };

  const handleRunSimulation = async () => {
    setQuantLoading(true);
    try {
      const res = await fetch('/api/agents/backtest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          symbol: quantSymbol,
          period: quantPeriod,
          initialBalance: initialCapital,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setQuantResult(data.result);
        soundManager.playOrderSuccess();

        if (data.result.netProfit > 0) {
          confetti({
            particleCount: 50,
            spread: 70,
            origin: { y: 0.6 },
          });
          toast.success(`Simulation Complete! Net Profit: +₹${data.result.netProfit.toLocaleString('en-IN')}`, {
            description: `Win Rate: ${data.result.winRate}% across ${data.result.totalTrades} trades.`,
          });
        } else {
          toast.info(`Simulation Complete. Net Return: ₹${data.result.netProfit.toLocaleString('en-IN')}`);
        }
      } else {
        soundManager.playOrderCancel();
        toast.error('Simulation Failed', { description: data.error || 'Check your strategy script syntax' });
      }
    } catch {
      soundManager.playOrderCancel();
      toast.error('Agent execution error. Please retry.');
    } finally {
      setQuantLoading(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setIsCopied(true);
    toast.success('Strategy code copied to clipboard!');
    setTimeout(() => setIsCopied(false), 2000);
  };

  const isProfitable = (quantResult?.netProfit ?? 0) >= 0;

  return (
    <div className="min-h-screen bg-[#0a0e17] text-slate-100">
      <Sidebar isOpen={mobileSidebarOpen} onClose={() => setMobileSidebarOpen(false)} />
      <TopNav onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)} />

      <main className="md:ml-64 pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Header Ribbon */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-blue-950/70 via-slate-900 to-indigo-950/50 p-6 rounded-2xl border border-blue-500/30 shadow-2xl">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-yellow-400" />
                AUTONOMOUS AI TRADING LAB
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-xs text-slate-400">Autonomous Agent Playground</span>
              <span className="text-slate-500">•</span>
              {ollamaStatus.connected ? (
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Ollama Local Active ({ollamaStatus.models.length} Models)
                </span>
              ) : (
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-1">
                  Multi-LLM Enabled
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
              <span>AI Agent Studio &amp; Quant Sandbox</span>
              <Bot className="w-7 h-7 text-blue-400" />
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
              Build your own autonomous trading agents using <strong className="text-white">Ollama (100% Free &amp; Local)</strong>, OpenAI, Claude, Gemini, Groq, or OpenRouter with full technical indicator context.
            </p>
          </div>

          {/* Action CTAs: Gmail Report & Mode Switcher */}
          <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
            <button
              onClick={() => setIsEmailModalOpen(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 hover:border-slate-600 transition-all flex items-center gap-1.5 shadow-md"
            >
              <Mail className="w-3.5 h-3.5 text-blue-400" />
              <span>Gmail Report</span>
            </button>

            {/* Mode Switcher Tabs */}
            <div className="flex items-center p-1 bg-slate-950/90 border border-slate-800 rounded-xl shadow-inner">
              <button
                onClick={() => setPlaygroundMode('LLM_AGENTS')}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  playgroundMode === 'LLM_AGENTS'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Bot className="w-3.5 h-3.5" />
                <span>Custom AI Agents</span>
              </button>
              <button
                onClick={() => setPlaygroundMode('QUANT_CODE')}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  playgroundMode === 'QUANT_CODE'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>Quant Script Sandbox</span>
              </button>
              <button
                onClick={() => setPlaygroundMode('API_DOCS')}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  playgroundMode === 'API_DOCS'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>Python Bot API</span>
              </button>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* MODE 1: CUSTOM AI AGENT STUDIO (Ollama + Multi-Provider LLMs)  */}
        {/* ============================================================== */}
        {playgroundMode === 'LLM_AGENTS' && (
          <div className="space-y-6">
            {/* Ollama Local Detection Banner */}
            {ollamaStatus.connected ? (
              <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 text-xl">
                    🦙
                  </div>
                  <div>
                    <div className="font-bold text-emerald-400 flex items-center gap-2">
                      <span>Local Ollama Server Running on port 11434</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    </div>
                    <div className="text-slate-400 mt-0.5">
                      Discovered local models:{' '}
                      <span className="font-mono text-slate-200">
                        {ollamaStatus.models.map((m) => m.name).join(', ') || 'gemma3:1b'}
                      </span>
                      . Zero API keys required, completely offline &amp; private!
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleOpenCreateModal}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center gap-1.5 whitespace-nowrap self-start sm:self-auto shadow-md shadow-emerald-600/30 transition-all text-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Ollama Agent</span>
                </button>
              </div>
            ) : (
              <div className="bg-blue-950/20 border border-blue-500/20 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-300">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 text-xl">
                    ⚡
                  </div>
                  <div>
                    <div className="font-bold text-white">
                      Connect any AI: Ollama, OpenAI, Claude, Gemini, Groq, or OpenRouter
                    </div>
                    <div className="text-slate-400 mt-0.5">
                      Run locally with <code className="text-blue-300">ollama run llama3.2</code> or enter your provider API key. Keys remain securely in your browser&apos;s localStorage.
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleOpenCreateModal}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center gap-1.5 whitespace-nowrap self-start sm:self-auto shadow-md shadow-blue-600/30 transition-all text-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Custom Agent</span>
                </button>
              </div>
            )}

            {/* Agent Selector Carousel / Cards */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Bot className="w-4 h-4 text-blue-400" />
                  <span>Choose Active Trading Agent ({agents.length})</span>
                </h3>
                <button
                  onClick={handleOpenCreateModal}
                  className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Agent</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {agents.map((agent) => {
                  const isActive = agent.id === activeAgentId;
                  const providerMeta = PROVIDER_METADATA[agent.provider];
                  const hasKey = agent.provider === 'ollama' || Boolean(agent.apiKey);

                  return (
                    <div
                      key={agent.id}
                      onClick={() => setActiveAgentId(agent.id)}
                      className={`relative cursor-pointer p-4 rounded-2xl border transition-all text-left flex flex-col justify-between ${
                        isActive
                          ? 'bg-blue-950/40 border-blue-500 shadow-xl shadow-blue-500/10 ring-1 ring-blue-500'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/90'
                      }`}
                    >
                      <div>
                        {/* Top line: Avatar + Provider badge + Actions */}
                        <div className="flex items-center justify-between gap-2 mb-2.5">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{agent.avatar || '🤖'}</span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700/80 flex items-center gap-1">
                              <span>{providerMeta.icon}</span>
                              <span className="uppercase font-bold">{agent.provider}</span>
                            </span>
                          </div>

                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => handleOpenEditModal(agent)}
                              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                              title="Edit Agent / API Key"
                            >
                              <Settings2 className="w-3.5 h-3.5" />
                            </button>
                            {agent.isCustom && (
                              <button
                                onClick={() => handleDeleteAgent(agent.id)}
                                className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                                title="Delete Agent"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Agent Title & Role */}
                        <h4 className="font-bold text-white text-sm line-clamp-1">{agent.name}</h4>
                        <div className="text-[11px] text-blue-400 font-mono mb-1.5 line-clamp-1">{agent.role}</div>
                        <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed mb-3">
                          {agent.description}
                        </p>
                      </div>

                      {/* Footer Info */}
                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
                        <span className="text-slate-300 truncate max-w-[120px]">{agent.model}</span>
                        {hasKey ? (
                          <span className="text-emerald-400 flex items-center gap-1 font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            Ready
                          </span>
                        ) : (
                          <span className="text-amber-400 flex items-center gap-1 font-bold">
                            <Key className="w-3 h-3" />
                            Key Needed
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Active Agent Control & Evaluation Deck */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column (5 cols): Active Agent Profile & Target Instrument */}
              <div className="lg:col-span-5 bg-[#0d1424] border border-slate-800/90 rounded-2xl p-5 shadow-2xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800/80">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">{activeAgent.avatar}</span>
                      <div>
                        <h3 className="text-sm font-bold text-white">{activeAgent.name}</h3>
                        <span className="text-[11px] text-blue-400 font-mono">{activeAgent.role}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleOpenEditModal(activeAgent)}
                      className="px-2.5 py-1 text-[11px] font-mono text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-lg border border-slate-700 transition-colors flex items-center gap-1"
                    >
                      <Settings2 className="w-3 h-3" />
                      <span>Config</span>
                    </button>
                  </div>

                  {/* Instrument Selector */}
                  <div className="mb-4">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                      Target Market Instrument
                    </label>
                    <select
                      value={evalSymbol}
                      onChange={(e) => setEvalSymbol(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 text-white text-xs font-mono rounded-xl px-3.5 py-2.5 outline-none font-bold"
                    >
                      <option value="RELIANCE.NS">RELIANCE.NS — Reliance Industries Ltd.</option>
                      <option value="TCS.NS">TCS.NS — Tata Consultancy Services</option>
                      <option value="HDFCBANK.NS">HDFCBANK.NS — HDFC Bank Ltd.</option>
                      <option value="INFY.NS">INFY.NS — Infosys Ltd.</option>
                      <option value="SBIN.NS">SBIN.NS — State Bank of India</option>
                      <option value="ITC.NS">ITC.NS — ITC Ltd.</option>
                      <option value="TATAMOTORS.NS">TATAMOTORS.NS — Tata Motors Ltd.</option>
                      <option value="NVDA">NVDA — NVIDIA Corporation</option>
                      <option value="AAPL">AAPL — Apple Inc.</option>
                    </select>
                  </div>

                  {/* Agent Parameters Grid */}
                  <div className="grid grid-cols-2 gap-2.5 mb-4 text-xs font-mono">
                    <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800/80">
                      <span className="text-[10px] text-slate-400 block mb-0.5">AI Engine</span>
                      <span className="font-bold text-white flex items-center gap-1 truncate">
                        <span>{PROVIDER_METADATA[activeAgent.provider].icon}</span>
                        <span>{activeAgent.provider}</span>
                      </span>
                    </div>

                    <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800/80">
                      <span className="text-[10px] text-slate-400 block mb-0.5">Model</span>
                      <span className="font-bold text-blue-400 truncate block">{activeAgent.model}</span>
                    </div>

                    <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800/80">
                      <span className="text-[10px] text-slate-400 block mb-0.5">Max Trade Risk</span>
                      <span className="font-bold text-amber-400">{activeAgent.maxRiskPerTradePercent}% Capital</span>
                    </div>

                    <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800/80">
                      <span className="text-[10px] text-slate-400 block mb-0.5">Paper Capital</span>
                      <span className="font-bold text-emerald-400">
                        ₹{portfolioBalance.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                  </div>

                  {/* System Persona Snippet */}
                  <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800/60 text-[11px] text-slate-400 font-mono mb-3">
                    <span className="text-slate-300 font-bold block mb-1">System Prompt &amp; Decision Rules:</span>
                    <p className="line-clamp-3 leading-relaxed text-slate-400">
                      {activeAgent.systemPrompt}
                    </p>
                  </div>

                  {/* Autonomous Broker Mandate Switch */}
                  <div className="p-3 bg-gradient-to-r from-blue-950/40 via-slate-900 to-indigo-950/30 rounded-xl border border-blue-500/30 mb-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-bold text-white">Autonomous Broker Mode</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={autoPilotBroker}
                          onChange={(e) => setAutoPilotBroker(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                      </label>
                    </div>

                    <p className="text-[10px] text-slate-400 leading-relaxed mb-2">
                      {autoPilotBroker
                        ? '⚡ Auto-Pilot Active: The agent acts as an authorized broker. It applies its Decision Rules and automatically executes BUY/SELL market orders directly into your virtual portfolio.'
                        : 'Advisory Mode: The agent will output trading signals and suggested parameters for manual trade confirmation.'}
                    </p>

                    <label className="flex items-center gap-2 cursor-pointer text-[10px] text-slate-300">
                      <input
                        type="checkbox"
                        checked={sendGmailAlert}
                        onChange={(e) => setSendGmailAlert(e.target.checked)}
                        className="rounded border-slate-700 bg-slate-900 text-blue-500 focus:ring-0"
                      />
                      <span>📧 Auto-send Gmail Contract Note on trade execution</span>
                    </label>
                  </div>
                </div>

                {/* Active Runner Status Ribbon */}
                {isRunnerActive && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-between text-xs animate-in fade-in">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                      </span>
                      <span className="font-bold text-emerald-400 uppercase tracking-wide">
                        Runner Active (Cycle #{runnerCycle})
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-300">
                      Next check in <span className="text-emerald-400 font-bold">{countdown}s</span>
                    </div>
                  </div>
                )}

                {/* Big Action Buttons: START AI AGENT (RUN NOW) & START CONTINUOUS RUNNER */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    onClick={handleRunAgentEvaluation}
                    disabled={evaluating}
                    className="w-full py-4 text-slate-950 font-black font-mono text-xs uppercase tracking-wider rounded-xl shadow-xl shadow-emerald-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500 hover:from-emerald-300 hover:to-teal-300 disabled:opacity-60"
                  >
                    {evaluating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                        <span>Evaluating...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-slate-950" />
                        <span>Start AI Agent ({evalSymbol})</span>
                      </>
                    )}
                  </button>

                  {isRunnerActive ? (
                    <button
                      onClick={stopAgentRunner}
                      className="w-full py-4 text-white font-black font-mono text-xs uppercase tracking-wider rounded-xl shadow-xl shadow-rose-600/30 active:scale-95 transition-all flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-500"
                    >
                      <Square className="w-4 h-4 fill-white" />
                      <span>Stop Agent Runner</span>
                    </button>
                  ) : (
                    <button
                      onClick={startAgentRunner}
                      className="w-full py-4 text-white font-black font-mono text-xs uppercase tracking-wider rounded-xl shadow-xl shadow-blue-600/30 active:scale-95 transition-all flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500"
                    >
                      <Zap className="w-4 h-4 fill-white" />
                      <span>Start Continuous Loop</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Right Column (7 cols): Live Evaluation Signal & Trade Execution Desk */}
              <div className="lg:col-span-7 bg-slate-900/70 border border-slate-800/90 rounded-2xl p-5 shadow-2xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800/80">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-blue-400" />
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        AI Quantitative Signal &amp; Decision Card
                      </span>
                    </div>
                    {decision?.executionTimeMs && (
                      <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span>Latency: {decision.executionTimeMs}ms</span>
                      </span>
                    )}
                  </div>

                  {decision ? (
                    <div className="space-y-4">
                      {/* Autonomous Broker Ticket Banner */}
                      {brokerNote && (
                        <div className="p-3.5 bg-gradient-to-r from-emerald-950/40 via-slate-950 to-emerald-950/20 border border-emerald-500/40 rounded-xl text-xs font-mono text-emerald-300 flex items-start gap-2.5 shadow-lg shadow-emerald-950/30">
                          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-white block mb-0.5">Autonomous Broker Ticket:</span>
                            <span className="text-slate-200">{brokerNote}</span>
                          </div>
                        </div>
                      )}

                      {/* Big Action Badge & Confidence Header */}
                      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span
                            className={`px-4 py-2 rounded-xl text-base font-black font-mono tracking-wider flex items-center gap-2 shadow-lg ${
                              decision.action === 'BUY'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-emerald-500/10'
                                : decision.action === 'SELL'
                                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-rose-500/10'
                                : 'bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-amber-500/10'
                            }`}
                          >
                            <span className="w-2.5 h-2.5 rounded-full bg-current animate-pulse" />
                            {decision.action} SIGNAL
                          </span>
                          <div>
                            <div className="text-white font-bold text-sm">
                              {evalSymbol} @ ₹{(decisionQuote?.price || 0).toFixed(2)}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              Horizon: {decision.timeframe || 'Intraday'}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-[10px] text-slate-400 font-mono uppercase font-bold">Model Confidence</div>
                          <div className="text-xl font-black font-mono text-blue-400">
                            {decision.confidence}%
                          </div>
                        </div>
                      </div>

                      {/* Trade Parameters Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
                        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                          <span className="text-[10px] text-slate-400 block mb-0.5">Target Price</span>
                          <span className="text-base font-bold text-emerald-400">
                            ₹{Number(decision.targetPrice).toFixed(2)}
                          </span>
                        </div>

                        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                          <span className="text-[10px] text-slate-400 block mb-0.5">Stop Loss</span>
                          <span className="text-base font-bold text-rose-400">
                            ₹{Number(decision.stopLoss).toFixed(2)}
                          </span>
                        </div>

                        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                          <span className="text-[10px] text-slate-400 block mb-0.5">Suggested Qty</span>
                          <span className="text-base font-bold text-white">
                            {decision.recommendedQuantity} shares
                          </span>
                        </div>

                        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                          <span className="text-[10px] text-slate-400 block mb-0.5">Risk / Reward</span>
                          <span className="text-base font-bold text-blue-400">
                            {decision.riskRewardRatio || '1:2.0'}
                          </span>
                        </div>
                      </div>

                      {/* Agent Reasoning & Technical Thesis */}
                      <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800/80 space-y-2">
                        <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                          <Bot className="w-3.5 h-3.5 text-blue-400" />
                          <span>Agent Thesis &amp; Technical Reasoning:</span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed font-sans">
                          {decision.reasoning}
                        </p>

                        {decision.keySignals && decision.keySignals.length > 0 && (
                          <div className="pt-2 flex items-center gap-1.5 flex-wrap">
                            {decision.keySignals.map((sig, idx) => (
                              <span
                                key={idx}
                                className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20"
                              >
                                ✓ {sig}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Raw LLM Output Toggle */}
                      <div>
                        <button
                          onClick={() => setShowRawOutput(!showRawOutput)}
                          className="text-[11px] font-mono text-slate-400 hover:text-white flex items-center gap-1"
                        >
                          {showRawOutput ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          <span>{showRawOutput ? 'Hide' : 'Inspect'} Raw LLM Output</span>
                        </button>
                        {showRawOutput && (
                          <pre className="mt-2 p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[10px] text-slate-400 overflow-x-auto max-h-40">
                            {decision.rawOutput}
                          </pre>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="py-16 text-center text-xs text-slate-400 border border-dashed border-slate-800/80 rounded-xl">
                      <Cpu className="w-10 h-10 text-slate-600 mx-auto mb-2 animate-pulse" />
                      <div className="font-bold text-slate-300 mb-1">Agent Standing By</div>
                      <span>
                        Select a stock instrument and click &quot;Evaluate Market with {activeAgent.name}&quot; to generate real-time AI trading signals.
                      </span>
                    </div>
                  )}
                </div>

                {/* Bottom Action: Execute in Firestore Portfolio */}
                {decision && decision.action !== 'HOLD' && (
                  <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="text-xs text-slate-400">
                      Execute this recommendation directly into your live TradeSphere paper portfolio.
                    </div>
                    <button
                      onClick={handleExecuteAgentOrder}
                      disabled={executingOrder}
                      className={`px-6 py-3 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg transition-all active:scale-95 whitespace-nowrap ${
                        decision.action === 'BUY'
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                          : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
                      } ${executingOrder ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                      {executingOrder ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Routing Order...</span>
                        </>
                      ) : (
                        <>
                          <ArrowRight className="w-4 h-4" />
                          <span>Execute {decision.action} ({decision.recommendedQuantity} Shares)</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* MODE 2: QUANT CODE SANDBOX (JavaScript Backtester Engine)      */}
        {/* ============================================================== */}
        {playgroundMode === 'QUANT_CODE' && (
          <div className="space-y-6">
            {/* Template Selector & Config Bar */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-900/70 border border-slate-800/80 p-4 rounded-2xl shadow-lg">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Strategy Template
                </label>
                <select
                  value={selectedTemplate}
                  onChange={(e) => handleSelectTemplate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 text-white text-xs rounded-xl px-3 py-2 outline-none"
                >
                  {AGENT_TEMPLATES.map((tmpl) => (
                    <option key={tmpl.id} value={tmpl.id}>
                      {tmpl.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Target Instrument
                </label>
                <select
                  value={quantSymbol}
                  onChange={(e) => setQuantSymbol(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 text-white text-xs font-mono rounded-xl px-3 py-2 outline-none"
                >
                  <option value="RELIANCE.NS">RELIANCE.NS (Reliance)</option>
                  <option value="TCS.NS">TCS.NS (Tata Consultancy)</option>
                  <option value="HDFCBANK.NS">HDFCBANK.NS (HDFC Bank)</option>
                  <option value="INFY.NS">INFY.NS (Infosys)</option>
                  <option value="NVDA">NVDA (NVIDIA)</option>
                  <option value="AAPL">AAPL (Apple)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Backtest Timeframe
                </label>
                <select
                  value={quantPeriod}
                  onChange={(e) => setQuantPeriod(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 text-white text-xs font-mono rounded-xl px-3 py-2 outline-none"
                >
                  <option value="1w">1 Week (High Frequency)</option>
                  <option value="1mo">1 Month (Swing Trading)</option>
                  <option value="3mo">3 Months (Medium Term)</option>
                  <option value="1y">1 Year (Long Term Trend)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Initial Paper Capital (₹)
                </label>
                <input
                  type="number"
                  step="10000"
                  value={initialCapital}
                  onChange={(e) => setInitialCapital(parseInt(e.target.value) || 100000)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 text-white text-xs font-mono rounded-xl px-3 py-2 outline-none"
                />
              </div>
            </div>

            {/* 2-Column Code Editor & Performance Scorecard */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Code Editor */}
              <div className="lg:col-span-7 bg-[#0d1424] border border-slate-800/90 rounded-2xl p-5 shadow-2xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80">
                    <div className="flex items-center gap-2">
                      <Code2 className="w-4 h-4 text-blue-400" />
                      <span className="text-xs font-bold text-white font-mono">strategy.ts (JavaScript/TypeScript)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleCopyCode}
                        className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors text-xs flex items-center gap-1 font-mono"
                        title="Copy code"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{isCopied ? 'Copied' : 'Copy'}</span>
                      </button>
                      <button
                        onClick={() => handleSelectTemplate(selectedTemplate)}
                        className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors text-xs flex items-center gap-1 font-mono"
                        title="Reset to template default"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reset</span>
                      </button>
                    </div>
                  </div>

                  <div className="relative font-mono text-xs">
                    <textarea
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      rows={18}
                      className="w-full bg-slate-950/90 border border-slate-800 focus:border-blue-500/80 rounded-xl p-4 text-emerald-300 font-mono text-xs outline-none leading-relaxed resize-y selection:bg-blue-600"
                      spellCheck={false}
                    />
                  </div>

                  <div className="mt-3 p-3 bg-slate-950/50 rounded-xl border border-slate-800/60 text-[11px] text-slate-400 font-mono">
                    <span className="text-blue-400 font-bold block mb-1">Available Context Variables:</span>
                    <span className="text-slate-300">
                      `candle` (open, high, low, close, volume) • `indicators` (rsi, macd, ema20, bollinger) • `balance` • `holding` • `buy(qty, reason)` • `sell(qty, reason)`
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-800/80">
                  <button
                    onClick={handleRunSimulation}
                    disabled={quantLoading}
                    className={`w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/30 active:scale-95 transition-all flex items-center justify-center gap-2 ${
                      quantLoading ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                  >
                    {quantLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Simulating Strategy...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-white" />
                        <span>Run Quant Backtest</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Right Column: Scorecard & Tabs */}
              <div className="lg:col-span-5 flex flex-col gap-6">
                <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 shadow-xl">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-400" />
                    Backtest Performance Scorecard
                  </h3>

                  {quantResult ? (
                    <div className="space-y-4">
                      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                        <div>
                          <span className="text-[11px] text-slate-400 uppercase font-bold">Net P&L Return</span>
                          <div className={`text-2xl font-black font-mono ${isProfitable ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {isProfitable ? '+' : ''}₹{quantResult.netProfit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </div>
                        </div>
                        <span
                          className={`px-2.5 py-1 rounded-xl text-xs font-mono font-bold ${
                            isProfitable ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {isProfitable ? '+' : ''}{quantResult.netProfitPercent}%
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                          <span className="text-slate-400 text-[10px] block mb-1">Win Rate</span>
                          <span className="text-lg font-bold text-white">{quantResult.winRate}%</span>
                          <span className="text-[10px] text-slate-500 block">
                            ({quantResult.winningTrades}W / {quantResult.losingTrades}L)
                          </span>
                        </div>

                        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                          <span className="text-slate-400 text-[10px] block mb-1">Total Trades</span>
                          <span className="text-lg font-bold text-white">{quantResult.totalTrades}</span>
                          <span className="text-[10px] text-slate-500 block">Roundtrips</span>
                        </div>

                        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                          <span className="text-slate-400 text-[10px] block mb-1">Max Drawdown</span>
                          <span className="text-lg font-bold text-rose-400">-{quantResult.maxDrawdown}%</span>
                          <span className="text-[10px] text-slate-500 block">Peak to Trough</span>
                        </div>

                        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                          <span className="text-slate-400 text-[10px] block mb-1">Sharpe Ratio</span>
                          <span className="text-lg font-bold text-blue-400">{quantResult.sharpeRatio}</span>
                          <span className="text-[10px] text-slate-500 block">Risk-adjusted</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="py-12 text-center text-xs text-slate-400 border border-dashed border-slate-800 rounded-xl">
                      <Cpu className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                      <span>Click &quot;Run Quant Backtest&quot; to test your algorithm.</span>
                    </div>
                  )}
                </div>

                {/* Output Tabs: Console vs Trades */}
                <div className="flex-1 bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-3">
                      <button
                        onClick={() => setQuantTab('CONSOLE')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all ${
                          quantTab === 'CONSOLE' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Console Output
                      </button>
                      <button
                        onClick={() => setQuantTab('TRADES')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all ${
                          quantTab === 'TRADES' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Trade Ledger ({quantResult?.trades.length || 0})
                      </button>
                    </div>

                    {quantTab === 'CONSOLE' && (
                      <div className="h-48 overflow-y-auto bg-slate-950 rounded-xl p-3 font-mono text-[11px] text-slate-300 space-y-1 border border-slate-800/80">
                        {quantResult?.logs && quantResult.logs.length > 0 ? (
                          quantResult.logs.map((logLine, idx) => (
                            <div
                              key={idx}
                              className={
                                logLine.includes('BUY')
                                  ? 'text-emerald-400 font-semibold'
                                  : logLine.includes('SELL')
                                  ? 'text-rose-400 font-semibold'
                                  : 'text-slate-400'
                              }
                            >
                              {logLine}
                            </div>
                          ))
                        ) : (
                          <div className="text-slate-500 py-12 text-center">
                            Console logs will stream here during execution.
                          </div>
                        )}
                      </div>
                    )}

                    {quantTab === 'TRADES' && (
                      <div className="h-48 overflow-y-auto divide-y divide-slate-800/60 font-mono text-xs">
                        {quantResult?.trades && quantResult.trades.length > 0 ? (
                          quantResult.trades.map((tr, idx) => (
                            <div key={idx} className="py-2 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                    tr.type === 'BUY'
                                      ? 'bg-emerald-500/20 text-emerald-400'
                                      : 'bg-rose-500/20 text-rose-400'
                                  }`}
                                >
                                  {tr.type}
                                </span>
                                <div>
                                  <div className="text-white font-bold">
                                    {tr.quantity} @ ₹{tr.price.toFixed(2)}
                                  </div>
                                  <div className="text-[10px] text-slate-500">{tr.reason}</div>
                                </div>
                              </div>
                              <div className="text-right">
                                {tr.pnl !== undefined && (
                                  <div className={`font-bold ${tr.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {tr.pnl >= 0 ? '+' : ''}₹{tr.pnl.toFixed(2)}
                                  </div>
                                )}
                                <div className="text-[10px] text-slate-500">{tr.time}</div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-slate-500 py-12 text-center">No trades executed yet.</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* MODE 3: PYTHON / LANGCHAIN / CREWAI AGENT API DOCS             */}
        {/* ============================================================== */}
        {playgroundMode === 'API_DOCS' && (
          <div className="bg-[#0d1424] border border-slate-800/90 rounded-2xl p-6 shadow-2xl space-y-6">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2 mb-1">
                <Terminal className="w-5 h-5 text-blue-400" />
                <span>Programmatic AI Agent API &amp; Webhooks</span>
              </h3>
              <p className="text-xs text-slate-400">
                Run external Python bots, AutoGen agents, LangChain pipelines, or CrewAI swarms that consume TradeSphere market intelligence and execute paper orders.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Box 1: Python Example */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-blue-400 font-bold">agent_runner.py (Python)</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`import requests

# 1. Fetch live technical indicator dossier
res = requests.get("http://localhost:3000/api/ai/analyze?symbol=RELIANCE.NS")
data = res.json()
print("Verdict:", data["aiAnalysis"]["verdict"])

# 2. Place programmatic trade order
order = requests.post(
    "http://localhost:3000/api/agents/trade",
    json={
        "symbol": "RELIANCE.NS",
        "quantity": 10,
        "side": "BUY",
        "agentName": "LangChainAutonomousBot",
        "reason": "RSI Oversold + Support Rebound"
    }
)
print("Order Response:", order.json())`);
                      toast.success('Python snippet copied!');
                    }}
                    className="text-[10px] font-mono text-slate-400 hover:text-white flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </button>
                </div>
                <pre className="text-slate-300 font-mono text-[11px] overflow-x-auto leading-relaxed">
{`import requests

# 1. Fetch live technical indicator dossier
res = requests.get("http://localhost:3000/api/ai/analyze?symbol=RELIANCE.NS")
data = res.json()
print("Verdict:", data["aiAnalysis"]["verdict"])

# 2. Place programmatic trade order
order = requests.post(
    "http://localhost:3000/api/agents/trade",
    json={
        "symbol": "RELIANCE.NS",
        "quantity": 10,
        "side": "BUY",
        "agentName": "LangChainAutonomousBot",
        "reason": "RSI Oversold + Support Rebound"
    }
)
print("Order Response:", order.json())`}
                </pre>
              </div>

              {/* Box 2: Local Ollama Python Integration */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-emerald-400 font-bold">ollama_trading_agent.py</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`import ollama
import requests

# Fetch market data from TradeSphere
market = requests.get("http://localhost:3000/api/ai/analyze?symbol=TCS.NS").json()

# Query local Ollama model
response = ollama.chat(
    model='gemma3:1b',
    messages=[{
        'role': 'user',
        'content': f"Analyze TCS. RSI is {market['indicators']['rsi']}. Decide BUY, SELL, or HOLD in 1 sentence."
    }]
)
print("Ollama Says:", response['message']['content'])`);
                      toast.success('Ollama snippet copied!');
                    }}
                    className="text-[10px] font-mono text-slate-400 hover:text-white flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </button>
                </div>
                <pre className="text-slate-300 font-mono text-[11px] overflow-x-auto leading-relaxed">
{`import ollama
import requests

# Fetch market data from TradeSphere
market = requests.get("http://localhost:3000/api/ai/analyze?symbol=TCS.NS").json()

# Query local Ollama model
response = ollama.chat(
    model='gemma3:1b',
    messages=[{
        'role': 'user',
        'content': f"Analyze TCS. RSI is {market['indicators']['rsi']}. Decide BUY, SELL, or HOLD in 1 sentence."
    }]
)
print("Ollama Decision:", response['message']['content'])`}
                </pre>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ============================================================== */}
      {/* MODAL: CREATE / EDIT CUSTOM AI AGENT                           */}
      {/* ============================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0e1626] border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl text-slate-100 space-y-5">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="text-3xl">{formAvatar}</span>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingAgent ? `Edit Agent: ${editingAgent.name}` : 'Create Custom AI Trading Agent'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Configure your agent with Ollama or any AI provider API key.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Form Body */}
            <div className="space-y-4 text-xs">
              {/* Agent Name, Role & Avatar */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-400 block mb-1">Avatar</label>
                  <select
                    value={formAvatar}
                    onChange={(e) => setFormAvatar(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-xl rounded-xl p-2 text-center outline-none"
                  >
                    <option value="🤖">🤖</option>
                    <option value="🦙">🦙</option>
                    <option value="⚡">⚡</option>
                    <option value="🛡️">🛡️</option>
                    <option value="🏄‍♂️">🏄‍♂️</option>
                    <option value="🧠">🧠</option>
                    <option value="🎯">🎯</option>
                    <option value="💎">💎</option>
                    <option value="🦅">🦅</option>
                  </select>
                </div>

                <div className="sm:col-span-5">
                  <label className="font-bold text-slate-400 block mb-1">Agent Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Alpha Momentum Bot"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-2 text-white outline-none"
                  />
                </div>

                <div className="sm:col-span-5">
                  <label className="font-bold text-slate-400 block mb-1">Trading Role / Persona</label>
                  <input
                    type="text"
                    placeholder="e.g. Mean Reversion Scalper"
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-2 text-white outline-none"
                  />
                </div>
              </div>

              {/* Provider Selection */}
              <div>
                <label className="font-bold text-slate-400 block mb-1.5">AI Provider</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(Object.keys(PROVIDER_METADATA) as AIProvider[]).map((prov) => {
                    const meta = PROVIDER_METADATA[prov];
                    const isSelected = formProvider === prov;

                    return (
                      <button
                        type="button"
                        key={prov}
                        onClick={() => {
                          setFormProvider(prov);
                          const savedKeys = JSON.parse(localStorage.getItem('tradesphere_api_keys') || '{}');
                          const existingKey = savedKeys[prov] || '';
                          setFormApiKey(existingKey);
                          setFormModel(meta.defaultModel);
                          fetchModelsForKey(prov, existingKey, formOllamaUrl);
                        }}
                        className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all ${
                          isSelected
                            ? 'bg-blue-600/20 border-blue-500 text-white shadow-md shadow-blue-500/10'
                            : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:bg-slate-900'
                        }`}
                      >
                        <span className="text-lg">{meta.icon}</span>
                        <div>
                          <div className="font-bold text-[11px] leading-tight text-white">{meta.name}</div>
                          <div className="text-[9px] text-slate-400">
                            {meta.requiresApiKey ? 'API Key' : 'Local / Free'}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Provider Settings (Ollama URL or API Key) */}
              {formProvider === 'ollama' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-950/90 rounded-xl border border-emerald-500/30">
                  <div>
                    <label className="font-bold text-emerald-400 block mb-1 flex items-center gap-1">
                      <span>🦙 Ollama Base URL</span>
                    </label>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={formOllamaUrl}
                        onChange={(e) => setFormOllamaUrl(e.target.value)}
                        placeholder="http://localhost:11434"
                        className="w-full bg-slate-900 border border-slate-700 text-white font-mono text-xs rounded-xl px-3 py-2 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => fetchModelsForKey('ollama', '', formOllamaUrl)}
                        disabled={fetchingModels}
                        className="px-2.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-mono"
                        title="Scan Ollama models"
                      >
                        {fetchingModels ? (
                          <div className="w-3 h-3 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <RotateCcw className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                    {modelFetchStatus && (
                      <div className={`mt-2 p-1.5 rounded-lg text-[10px] font-mono flex items-center gap-1.5 border ${
                        modelFetchStatus.success
                          ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400'
                          : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
                      }`}>
                        <span>{modelFetchStatus.success ? '✓' : '⚠️'}</span>
                        <span className="line-clamp-2">{modelFetchStatus.message}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-slate-300 block">Local Models ({dynamicModels.length || ollamaStatus.models.length})</label>
                      <span className="text-[10px] text-emerald-400 font-mono font-bold">100% Free / Private</span>
                    </div>
                    <select
                      value={formModel}
                      onChange={(e) => setFormModel(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 text-white font-mono text-xs rounded-xl px-3 py-2 outline-none mb-1.5"
                    >
                      {dynamicModels.length > 0 ? (
                        dynamicModels.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.label} {m.description ? `— ${m.description}` : ''}
                          </option>
                        ))
                      ) : ollamaStatus.models.length > 0 ? (
                        ollamaStatus.models.map((m) => (
                          <option key={m.name} value={m.name}>
                            {m.name} {m.sizeMb ? `(${m.sizeMb}MB)` : ''}
                          </option>
                        ))
                      ) : (
                        PROVIDER_METADATA['ollama'].suggestedModels.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.label}
                          </option>
                        ))
                      )}
                    </select>
                    <input
                      type="text"
                      value={formModel}
                      onChange={(e) => setFormModel(e.target.value)}
                      placeholder="Or type custom model name..."
                      className="w-full bg-slate-900 border border-slate-700 text-slate-400 font-mono text-[10px] rounded-lg px-2.5 py-1 outline-none"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-950/90 rounded-xl border border-blue-500/30">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-blue-400 flex items-center gap-1">
                        <Key className="w-3 h-3" />
                        <span>{PROVIDER_METADATA[formProvider].name} API Key</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1"
                      >
                        {showApiKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        <span>{showApiKey ? 'Hide' : 'Show'}</span>
                      </button>
                    </div>
                    <div className="flex gap-1.5">
                      <input
                        type={showApiKey ? 'text' : 'password'}
                        value={formApiKey}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormApiKey(val);
                          if (val.trim().length > 6) {
                            fetchModelsForKey(formProvider, val.trim(), formOllamaUrl);
                          }
                        }}
                        onBlur={() => {
                          if (formApiKey.trim().length > 6) {
                            fetchModelsForKey(formProvider, formApiKey.trim(), formOllamaUrl);
                          }
                        }}
                        placeholder={`Enter your ${PROVIDER_METADATA[formProvider].name} key...`}
                        className="w-full bg-slate-900 border border-slate-700 text-white font-mono text-xs rounded-xl px-3 py-2 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => fetchModelsForKey(formProvider, formApiKey.trim(), formOllamaUrl)}
                        disabled={fetchingModels || !formApiKey.trim()}
                        className="px-2.5 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 text-xs font-mono disabled:opacity-40"
                        title="Fetch models with this key"
                      >
                        {fetchingModels ? (
                          <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <RotateCcw className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    {modelFetchStatus && (
                      <div className={`mt-2 p-1.5 rounded-lg text-[10px] font-mono flex items-center gap-1.5 border ${
                        modelFetchStatus.success
                          ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400'
                          : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
                      }`}>
                        <span>{modelFetchStatus.success ? '✓' : '⚠️'}</span>
                        <span className="line-clamp-2">{modelFetchStatus.message}</span>
                      </div>
                    )}

                    <span className="text-[10px] text-slate-500 mt-1 block">
                      🔒 Saved locally in your browser. Never committed or sent to external servers.
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-slate-300 block">
                        Available Models {dynamicModels.length > 0 ? `(${dynamicModels.length} Loaded)` : ''}
                      </label>
                      {dynamicModels.length > 0 && (
                        <span className="text-[10px] text-emerald-400 font-mono font-bold">
                          ✓ Key Authorized
                        </span>
                      )}
                    </div>
                    <select
                      value={formModel}
                      onChange={(e) => setFormModel(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 text-white font-mono text-xs rounded-xl px-3 py-2 outline-none mb-1.5"
                    >
                      {dynamicModels.length > 0 ? (
                        dynamicModels.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.label} {m.description ? `— ${m.description}` : ''}
                          </option>
                        ))
                      ) : (
                        PROVIDER_METADATA[formProvider].suggestedModels.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.label}
                          </option>
                        ))
                      )}
                    </select>
                    <input
                      type="text"
                      value={formModel}
                      onChange={(e) => setFormModel(e.target.value)}
                      placeholder="Or type custom model name..."
                      className="w-full bg-slate-900 border border-slate-700 text-slate-400 font-mono text-[10px] rounded-lg px-2.5 py-1 outline-none"
                    />
                  </div>
                </div>
              )}

              {/* System Prompt */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-400">System Prompt &amp; Decision Rules</label>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-slate-500">Preset Templates:</span>
                    <button
                      type="button"
                      onClick={() =>
                        setFormPrompt(
                          `You are an aggressive RSI and Bollinger Bands momentum scalper.\nLook for oversold bounces (<35 RSI) touching lower bands to BUY.\nLook for overbought (>65 RSI) near upper bands to SELL or take profit.\nMaintain strict 1:2.5 Risk-Reward ratios.`
                        )
                      }
                      className="text-[10px] text-blue-400 hover:underline px-1"
                    >
                      Momentum
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setFormPrompt(
                          `You are an institutional Risk Guardian.\nPrioritize capital preservation above all else.\nNever enter unless price is above both 20 EMA and 50 SMA with positive MACD histogram.\nIf market is choppy, recommend HOLD.`
                        )
                      }
                      className="text-[10px] text-blue-400 hover:underline px-1"
                    >
                      Risk Officer
                    </button>
                  </div>
                </div>
                <textarea
                  rows={4}
                  value={formPrompt}
                  onChange={(e) => setFormPrompt(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 font-mono text-[11px] outline-none leading-relaxed"
                />
              </div>

              {/* Risk Sliders */}
              <div className="grid grid-cols-2 gap-4 pt-1">
                <div>
                  <div className="flex items-center justify-between mb-1 font-mono text-[11px]">
                    <span className="text-slate-400 font-bold">Max Capital Risk / Trade</span>
                    <span className="text-blue-400 font-bold">{formMaxRisk}%</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={formMaxRisk}
                    onChange={(e) => setFormMaxRisk(Number(e.target.value))}
                    className="w-full accent-blue-500 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1 font-mono text-[11px]">
                    <span className="text-slate-400 font-bold">Temperature</span>
                    <span className="text-blue-400 font-bold">{formTemperature}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={formTemperature}
                    onChange={(e) => setFormTemperature(Number(e.target.value))}
                    className="w-full accent-blue-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveAgent}
                className="px-6 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 transition-all active:scale-95 flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Save Agent</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ============================================================== */}
      {/* MODAL: DISPATCH GMAIL CONTRACT NOTE & REPORT                   */}
      {/* ============================================================== */}
      {isEmailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0e1626] border border-slate-700/80 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl text-slate-100 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Send Contract Note &amp; Report to Gmail
                  </h3>
                  <p className="text-xs text-slate-400">
                    Dispatches an institutional P&amp;L summary, holdings table &amp; broker executions.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEmailModalOpen(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-300 block mb-1">Recipient Gmail Address</label>
                <input
                  type="email"
                  value={emailRecipient}
                  onChange={(e) => setEmailRecipient(e.target.value)}
                  placeholder="your.email@gmail.com"
                  className="w-full bg-slate-950 border border-slate-700 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-white font-mono outline-none"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Report includes: Available Virtual Cash, Total Portfolio Value, Open Positions, and Broker Trade Log.
                </span>
              </div>

              {emailPreviewHtml && (
                <div>
                  <label className="font-bold text-emerald-400 block mb-1.5 flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5" />
                    <span>Contract Note HTML Preview</span>
                  </label>
                  <div
                    className="p-3 bg-slate-950 rounded-xl border border-slate-800 max-h-48 overflow-y-auto font-mono text-[10px] text-slate-300"
                    dangerouslySetInnerHTML={{ __html: emailPreviewHtml }}
                  />
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsEmailModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleSendEmailReport}
                disabled={emailSending}
                className="px-6 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 transition-all active:scale-95 flex items-center gap-1.5 disabled:opacity-60"
              >
                {emailSending ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Dispatching to Gmail...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Contract Note</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
