'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Zap,
  CheckCircle2,
  AlertCircle,
  Key,
  ExternalLink,
  X,
  Server,
  Activity,
  ArrowRight,
  Database,
} from 'lucide-react';

export interface BrokerConfig {
  provider: 'auto' | 'kite' | 'dhan' | 'upstox' | 'angelone' | 'bhavcopy';
  apiKey?: string;
  apiSecret?: string;
  accessToken?: string;
  clientId?: string;
  jwtToken?: string;
}

interface BrokerConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProviderChange?: (config: BrokerConfig) => void;
}

export function BrokerConnectModal({ isOpen, onClose, onProviderChange }: BrokerConnectModalProps) {
  const [selectedProvider, setSelectedProvider] = useState<BrokerConfig['provider']>('auto');
  const [apiKey, setApiKey] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [clientId, setClientId] = useState('');
  const [jwtToken, setJwtToken] = useState('');

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; latencyMs?: number } | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('tradesphere_broker_config');
      if (saved) {
        const parsed: BrokerConfig = JSON.parse(saved);
        setSelectedProvider(parsed.provider || 'auto');
        if (parsed.apiKey) setApiKey(parsed.apiKey);
        if (parsed.accessToken) setAccessToken(parsed.accessToken);
        if (parsed.clientId) setClientId(parsed.clientId);
        if (parsed.jwtToken) setJwtToken(parsed.jwtToken);
      }
    } catch {
      // Ignore
    }
  }, []);

  if (!isOpen) return null;

  const handleTestAndSave = async () => {
    setTesting(true);
    setTestResult(null);

    const payload: BrokerConfig = {
      provider: selectedProvider,
      apiKey: apiKey.trim(),
      accessToken: accessToken.trim(),
      clientId: clientId.trim(),
      jwtToken: jwtToken.trim(),
    };

    try {
      const res = await fetch('/api/broker-connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      setTestResult({
        success: data.success,
        message: data.message || (data.success ? 'Connected successfully!' : 'Connection failed'),
        latencyMs: data.latencyMs,
      });

      if (data.success) {
        localStorage.setItem('tradesphere_broker_config', JSON.stringify(payload));
        if (onProviderChange) onProviderChange(payload);
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err?.message || 'Network error testing broker connection',
      });
    } finally {
      setTesting(false);
    }
  };

  const providers = [
    {
      id: 'auto' as const,
      name: 'TradeSphere Auto-Router',
      tag: 'Default Live',
      desc: 'Official live quotes for Indian (NSE) & US equities with Bhavcopy fallback.',
      badge: 'Active & Reliable',
      badgeColor: 'text-emerald-400 bg-emerald-950/40 border-emerald-500/30',
    },
    {
      id: 'kite' as const,
      name: 'Zerodha Kite Connect',
      tag: 'Direct Broker',
      desc: 'Connect your personal Zerodha Kite account for real orders & WebSocket tick stream.',
      badge: 'Institutional API',
      badgeColor: 'text-blue-400 bg-blue-950/40 border-blue-500/30',
    },
    {
      id: 'dhan' as const,
      name: 'DhanHQ v2 API',
      tag: 'Zero Commission API',
      desc: 'Ultra-fast sub-millisecond execution for F&O and NSE equities via DhanHQ.',
      badge: 'Free Developer API',
      badgeColor: 'text-purple-400 bg-purple-950/40 border-purple-500/30',
    },
    {
      id: 'upstox' as const,
      name: 'Upstox Pro API',
      tag: 'Direct Broker',
      desc: 'Upstox v2 developer API for live order placement and portfolio streaming.',
      badge: 'Direct Broker',
      badgeColor: 'text-amber-400 bg-amber-950/40 border-amber-500/30',
    },
    {
      id: 'angelone' as const,
      name: 'Angel One SmartAPI',
      tag: 'Direct Broker',
      desc: 'SmartAPI integration with algorithmic order triggers and margin management.',
      badge: 'SmartAPI',
      badgeColor: 'text-cyan-400 bg-cyan-950/40 border-cyan-500/30',
    },
    {
      id: 'bhavcopy' as const,
      name: 'NSE Official Bhavcopy',
      tag: 'EOD Regulatory',
      desc: 'End-of-day official regulatory reports from NSE India archives for backtesting.',
      badge: '100% Official EOD',
      badgeColor: 'text-gray-400 bg-gray-900 border-gray-700',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-[#0b101b] border border-blue-500/20 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800/80 bg-[#0f172a]/60">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Market Data & Broker Direct Gateway
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono">
                  LIVE
                </span>
              </h2>
              <p className="text-xs text-gray-400">
                Choose between TradeSphere Auto-Router or connect direct institutional broker credentials.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Provider Selection Cards */}
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 block">
              Select Market Data Engine
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {providers.map((p) => {
                const isSelected = selectedProvider === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      setSelectedProvider(p.id);
                      setTestResult(null);
                    }}
                    className={`cursor-pointer p-4 rounded-xl border transition-all text-left flex flex-col justify-between ${
                      isSelected
                        ? 'bg-blue-950/20 border-blue-500/60 ring-1 ring-blue-500/40 shadow-lg shadow-blue-500/5'
                        : 'bg-[#0e1626]/70 border-gray-800/80 hover:border-gray-700/80 hover:bg-[#111a2e]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-semibold text-sm text-white">{p.name}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-md border font-mono ${p.badgeColor}`}>
                          {p.badge}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 leading-relaxed mb-2">{p.desc}</p>
                    </div>
                    <div className="flex items-center text-[11px] font-mono text-gray-500 pt-2 border-t border-gray-800/50">
                      {isSelected ? (
                        <span className="text-blue-400 flex items-center gap-1 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Selected
                        </span>
                      ) : (
                        <span className="hover:text-gray-300 flex items-center gap-1">
                          Click to select <ArrowRight className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Configuration Form if Broker Selected */}
          {selectedProvider !== 'auto' && selectedProvider !== 'bhavcopy' && (
            <div className="p-4 rounded-xl bg-[#0e1626] border border-gray-800/80 space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-2 border-b border-gray-800">
                <span className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                  <Key className="w-4 h-4 text-blue-400" />
                  {providers.find((p) => p.id === selectedProvider)?.name} Credentials
                </span>
                <span className="text-[11px] text-gray-500">Stored locally in your browser</span>
              </div>

              {selectedProvider === 'kite' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">API Key</label>
                    <input
                      type="text"
                      placeholder="e.g. abcd1234efgh"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className="w-full bg-[#070b12] border border-gray-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Access Token</label>
                    <input
                      type="password"
                      placeholder="Daily access token"
                      value={accessToken}
                      onChange={(e) => setAccessToken(e.target.value)}
                      className="w-full bg-[#070b12] border border-gray-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                </div>
              )}

              {selectedProvider === 'dhan' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Client ID</label>
                    <input
                      type="text"
                      placeholder="e.g. 1000000001"
                      value={clientId}
                      onChange={(e) => setClientId(e.target.value)}
                      className="w-full bg-[#070b12] border border-gray-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">DhanHQ Access Token</label>
                    <input
                      type="password"
                      placeholder="Generated from Dhan web"
                      value={accessToken}
                      onChange={(e) => setAccessToken(e.target.value)}
                      className="w-full bg-[#070b12] border border-gray-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                </div>
              )}

              {selectedProvider === 'upstox' && (
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Upstox Access Token (OAuth2)</label>
                  <input
                    type="password"
                    placeholder="Bearer token"
                    value={accessToken}
                    onChange={(e) => setAccessToken(e.target.value)}
                    className="w-full bg-[#070b12] border border-gray-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              )}

              {selectedProvider === 'angelone' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">API Key</label>
                    <input
                      type="text"
                      placeholder="SmartAPI Key"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className="w-full bg-[#070b12] border border-gray-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Client Code</label>
                    <input
                      type="text"
                      placeholder="e.g. A12345"
                      value={clientId}
                      onChange={(e) => setClientId(e.target.value)}
                      className="w-full bg-[#070b12] border border-gray-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">JWT Token</label>
                    <input
                      type="password"
                      placeholder="Session JWT"
                      value={jwtToken}
                      onChange={(e) => setJwtToken(e.target.value)}
                      className="w-full bg-[#070b12] border border-gray-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Test Feedback */}
          {testResult && (
            <div
              className={`p-4 rounded-xl border flex items-start gap-3 text-xs ${
                testResult.success
                  ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                  : 'bg-red-950/20 border-red-500/30 text-red-300'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-semibold">{testResult.message}</p>
                {testResult.latencyMs !== undefined && (
                  <p className="text-[11px] text-gray-400 mt-1 font-mono">
                    Round-trip latency: {testResult.latencyMs}ms
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 px-6 border-t border-gray-800/80 bg-[#0f172a]/60 flex items-center justify-between">
          <div className="flex items-center text-xs text-gray-400 gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Zero-Risk Sandboxed Simulation Available</span>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleTestAndSave}
              disabled={testing}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50"
            >
              {testing ? (
                <>
                  <Activity className="w-4 h-4 animate-spin" />
                  <span>Verifying Gateway...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  <span>Save & Connect</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
