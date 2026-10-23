'use client';

import { useState, useEffect } from 'react';
import { useSession } from '@/components/AuthContext';
import { useRealtimeTrading } from '@/hooks/useRealtimeTrading';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { soundManager } from '@/lib/sound';
import {
  X,
  TrendingUp,
  TrendingDown,
  Info,
  CheckCircle2,
  AlertTriangle,
  Calculator,
  ShieldAlert,
  Target,
} from 'lucide-react';

interface TradingModalProps {
  isOpen: boolean;
  onClose: () => void;
  stockSymbol: string;
  stockName: string;
  currentPrice: number;
  availableQuantity?: number;
  initialSide?: 'BUY' | 'SELL';
  onOrderSuccess?: () => void;
}

type OrderSide = 'BUY' | 'SELL';
type OrderType = 'MARKET' | 'LIMIT' | 'SL' | 'SL-M';
type ProductType = 'MIS' | 'NRML';

export default function TradingModal({
  isOpen,
  onClose,
  stockSymbol,
  stockName,
  currentPrice,
  availableQuantity = 0,
  initialSide = 'BUY',
  onOrderSuccess,
}: TradingModalProps) {
  const { data: session } = useSession();
  const { executeClientTrade } = useRealtimeTrading();

  const [orderSide, setOrderSide] = useState<OrderSide>(initialSide);
  const [productType, setProductType] = useState<ProductType>('MIS');
  const [orderType, setOrderType] = useState<OrderType>('MARKET');

  const [quantity, setQuantity] = useState<number>(1);
  const [limitPrice, setLimitPrice] = useState<number>(currentPrice || 100);
  const [triggerPrice, setTriggerPrice] = useState<number>(Number(((currentPrice || 100) * 0.98).toFixed(2)));

  const [enableTarget, setEnableTarget] = useState(false);
  const [targetPrice, setTargetPrice] = useState<number>(Number(((currentPrice || 100) * 1.05).toFixed(2)));

  const [enableStopLoss, setEnableStopLoss] = useState(false);
  const [stopLossPrice, setStopLossPrice] = useState<number>(Number(((currentPrice || 100) * 0.95).toFixed(2)));

  const [balance, setBalance] = useState<number>(100000);
  const [userHoldings, setUserHoldings] = useState<number>(availableQuantity);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  useEffect(() => {
    setOrderSide(initialSide);
  }, [initialSide]);

  useEffect(() => {
    if (currentPrice > 0) {
      setLimitPrice(currentPrice);
      setTriggerPrice(Number((currentPrice * 0.98).toFixed(2)));
      setTargetPrice(Number((currentPrice * 1.05).toFixed(2)));
      setStopLossPrice(Number((currentPrice * 0.95).toFixed(2)));
    }
  }, [currentPrice]);

  useEffect(() => {
    if (session && isOpen) {
      fetchPortfolioData();
    }
  }, [session, isOpen, stockSymbol]);

  const fetchPortfolioData = async () => {
    try {
      const res = await fetch('/api/portfolio');
      if (res.ok) {
        const data = await res.json();
        setBalance(data.balance ?? 100000);
        const item = data.portfolio?.find((p: any) => p.stockSymbol === stockSymbol);
        setUserHoldings(item ? item.quantity : 0);
      }
    } catch {
      // Fallback
    }
  };

  if (!isOpen) return null;

  const executionPrice = orderType === 'LIMIT' ? limitPrice : currentPrice;
  const totalAmount = quantity * executionPrice;
  const isBuy = orderSide === 'BUY';

  // Preset quantity handlers
  const handleAddQty = (add: number) => {
    setQuantity((prev) => Math.max(1, prev + add));
  };

  const handleMaxQty = () => {
    if (isBuy) {
      const maxShares = Math.floor(balance / executionPrice);
      setQuantity(Math.max(1, maxShares));
    } else {
      setQuantity(Math.max(1, userHoldings));
    }
  };

  // Projected profit and loss for bracket
  const projectedProfit = enableTarget && targetPrice > executionPrice
    ? (targetPrice - executionPrice) * quantity
    : 0;

  const projectedLoss = enableStopLoss && stopLossPrice < executionPrice
    ? (executionPrice - stopLossPrice) * quantity
    : 0;

  const riskRewardRatio = projectedLoss > 0 && projectedProfit > 0
    ? (projectedProfit / projectedLoss).toFixed(2)
    : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (quantity <= 0) {
      setError('Please specify a valid quantity greater than 0.');
      return;
    }

    if (isBuy && totalAmount > balance) {
      setError(`Insufficient balance. Required ₹${totalAmount.toLocaleString('en-IN')}, available ₹${balance.toLocaleString('en-IN')}`);
      return;
    }

    if (!isBuy && quantity > userHoldings) {
      setError(`Insufficient holdings. You only hold ${userHoldings} shares of ${stockSymbol}.`);
      return;
    }

    setLoading(true);

    try {
      const orderPayload = {
        symbol: stockSymbol,
        quantity,
        orderSide,
        orderType,
        productType,
        limitPrice: orderType === 'LIMIT' ? limitPrice : undefined,
        triggerPrice: (orderType === 'SL' || orderType === 'SL-M') ? triggerPrice : undefined,
        targetPrice: enableTarget ? targetPrice : undefined,
        stopLoss: enableStopLoss ? stopLossPrice : undefined,
      };

      const response = await fetch('/api/trade/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(data.message || 'Order placed successfully!');
        soundManager.playOrderSuccess();
        toast.success(data.message || 'Order successfully executed!', {
          description: `${orderSide} ${quantity} shares of ${stockSymbol} at ₹${(data.order?.executedPrice || executionPrice).toFixed(2)}`,
        });

        // Trigger victory confetti burst
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
        });

        if (data.balance !== undefined) setBalance(data.balance);

        // Mirror trade directly to Cloud Firestore so onSnapshot reflects immediately
        executeClientTrade({
          symbol: stockSymbol,
          side: orderSide,
          quantity,
          price: data.order?.executedPrice || executionPrice,
          productType,
          orderType,
        }).catch(console.warn);

        if (onOrderSuccess) onOrderSuccess();
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        const errMsg = data.error || 'Failed to place order.';
        setError(errMsg);
        soundManager.playOrderCancel();
        toast.error('Order Rejected', { description: errMsg });
      }
    } catch {
      const errMsg = 'Network communication failed. Please retry.';
      setError(errMsg);
      soundManager.playOrderCancel();
      toast.error('Order Error', { description: errMsg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`w-full max-w-lg bg-[#0e1524] border rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 ${
          isBuy ? 'border-blue-500/40 shadow-blue-500/10' : 'border-rose-500/40 shadow-rose-500/10'
        }`}
      >
        {/* Terminal Header */}
        <div
          className={`px-6 py-4 flex items-center justify-between border-b ${
            isBuy
              ? 'bg-gradient-to-r from-blue-950/80 to-slate-900 border-blue-500/30'
              : 'bg-gradient-to-r from-rose-950/80 to-slate-900 border-rose-500/30'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-xl ${
                isBuy ? 'bg-blue-600/20 text-blue-400' : 'bg-rose-600/20 text-rose-400'
              }`}
            >
              {isBuy ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">{stockSymbol}</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                  {stockSymbol.endsWith('.NS') ? 'NSE' : 'NASDAQ'}
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate max-w-[240px]">{stockName}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-xs font-mono font-bold text-white">
                ₹{currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[10px] text-slate-400">Live LTP</div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Order Side Selector Tabs (BUY / SELL) */}
        <div className="grid grid-cols-2 p-1.5 bg-slate-950/80 border-b border-slate-800">
          <button
            type="button"
            onClick={() => setOrderSide('BUY')}
            className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
              isBuy
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>BUY / LONG</span>
          </button>
          <button
            type="button"
            onClick={() => setOrderSide('SELL')}
            className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
              !isBuy
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>SELL / SHORT</span>
          </button>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Product Type (MIS vs NRML) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-300">Product Mode</label>
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Info className="w-3 h-3 text-blue-400" />
                {productType === 'MIS' ? 'Intraday (Auto square-off)' : 'Delivery / Overnight'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setProductType('MIS')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                  productType === 'MIS'
                    ? 'bg-blue-950/50 border-blue-500 text-blue-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                MIS (Intraday 5x)
              </button>
              <button
                type="button"
                onClick={() => setProductType('NRML')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                  productType === 'NRML'
                    ? 'bg-blue-950/50 border-blue-500 text-blue-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                NRML (CNC Longterm)
              </button>
            </div>
          </div>

          {/* Order Type (MARKET, LIMIT, SL) */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-2">Order Execution Type</label>
            <div className="grid grid-cols-4 gap-1.5">
              {(['MARKET', 'LIMIT', 'SL', 'SL-M'] as OrderType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setOrderType(type)}
                  className={`py-2 px-1 text-center rounded-xl text-xs font-semibold border transition-all ${
                    orderType === type
                      ? 'bg-slate-800 border-blue-400 text-white'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity & Preset Chips */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-300">Quantity (Shares)</label>
              <div className="text-[11px] text-slate-400">
                {isBuy ? (
                  <span>Avail Cash: <strong className="text-emerald-400 font-mono">₹{balance.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</strong></span>
                ) : (
                  <span>Holdings: <strong className="text-blue-400 font-mono">{userHoldings} shares</strong></span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                step="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-slate-900 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white text-base font-mono rounded-xl px-4 py-2.5 outline-none transition-all"
                required
              />
              <button
                type="button"
                onClick={handleMaxQty}
                className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-colors whitespace-nowrap"
              >
                MAX
              </button>
            </div>

            {/* Quick Multiplier Stepper Chips */}
            <div className="flex items-center gap-1.5 mt-2">
              {[1, 5, 25, 50, 100].map((step) => (
                <button
                  key={step}
                  type="button"
                  onClick={() => handleAddQty(step)}
                  className="flex-1 py-1 text-[11px] font-mono font-semibold bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 rounded-lg transition-colors"
                >
                  +{step}
                </button>
              ))}
            </div>
          </div>

          {/* Limit Price Input (if LIMIT or SL) */}
          {(orderType === 'LIMIT' || orderType === 'SL') && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-300">Limit Price (₹)</label>
                <span className="text-[11px] text-slate-400 font-mono">
                  Diff: {(((limitPrice - currentPrice) / currentPrice) * 100).toFixed(2)}%
                </span>
              </div>
              <input
                type="number"
                step="0.05"
                value={limitPrice}
                onChange={(e) => setLimitPrice(parseFloat(e.target.value) || currentPrice)}
                className="w-full bg-slate-900 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white text-base font-mono rounded-xl px-4 py-2.5 outline-none transition-all"
                required
              />
            </div>
          )}

          {/* Trigger Price Input (if SL or SL-M) */}
          {(orderType === 'SL' || orderType === 'SL-M') && (
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-2">Trigger Price (₹)</label>
              <input
                type="number"
                step="0.05"
                value={triggerPrice}
                onChange={(e) => setTriggerPrice(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white text-base font-mono rounded-xl px-4 py-2.5 outline-none transition-all"
                required
              />
            </div>
          )}

          {/* Advanced Risk Controls (Bracket Target & Stop Loss) */}
          <div className="p-3.5 bg-slate-900/40 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
              <span className="flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-blue-400" />
                Risk / Reward Controls
              </span>
              {riskRewardRatio && (
                <span className="text-[11px] text-emerald-400 font-mono font-bold">
                  R:R = 1 : {riskRewardRatio}
                </span>
              )}
            </div>

            {/* Target checkbox */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableTarget}
                  onChange={(e) => setEnableTarget(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-0"
                />
                <span>Set Target Profit</span>
              </label>
              {enableTarget && (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-emerald-400 font-mono">
                    +₹{projectedProfit.toFixed(0)}
                  </span>
                  <input
                    type="number"
                    step="0.05"
                    value={targetPrice}
                    onChange={(e) => setTargetPrice(parseFloat(e.target.value) || 0)}
                    className="w-24 bg-slate-900 border border-slate-800 text-white text-xs font-mono rounded-lg px-2 py-1 outline-none"
                  />
                </div>
              )}
            </div>

            {/* Stop Loss checkbox */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableStopLoss}
                  onChange={(e) => setEnableStopLoss(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-800 text-rose-600 focus:ring-0"
                />
                <span>Set Stop Loss</span>
              </label>
              {enableStopLoss && (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-rose-400 font-mono">
                    -₹{projectedLoss.toFixed(0)}
                  </span>
                  <input
                    type="number"
                    step="0.05"
                    value={stopLossPrice}
                    onChange={(e) => setStopLossPrice(parseFloat(e.target.value) || 0)}
                    className="w-24 bg-slate-900 border border-slate-800 text-white text-xs font-mono rounded-lg px-2 py-1 outline-none"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Feedback Alerts */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{success}</span>
            </div>
          )}

          {/* Bottom Execution Bar with Margin Breakdown */}
          <div className="pt-2 border-t border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Total Margin Required:</span>
              <span className="font-bold text-white text-sm">
                ₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 px-4 rounded-xl text-white font-bold text-sm tracking-wide shadow-lg active:scale-[0.99] transition-all flex items-center justify-center gap-2 ${
                isBuy
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-600/30'
                  : 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 shadow-rose-600/30'
              } ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Routing Order to Exchange...</span>
                </>
              ) : (
                <>
                  <span>
                    {isBuy ? 'EXECUTE BUY ORDER' : 'EXECUTE SELL ORDER'} ({stockSymbol})
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
