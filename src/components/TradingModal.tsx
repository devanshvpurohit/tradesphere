'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface TradingModalProps {
  isOpen: boolean;
  onClose: () => void;
  stockSymbol: string;
  stockName: string;
  currentPrice: number;
  availableQuantity?: number;
}

type OrderSide = 'BUY' | 'SELL';
type OrderType = 'MARKET' | 'LIMIT' | 'SL' | 'SL-M';
type ProductType = 'MIS' | 'NRML';
type QuantityMode = 'FIXED' | 'AUTO';

export default function TradingModal({
  isOpen,
  onClose,
  stockSymbol,
  stockName,
  currentPrice,
  availableQuantity = 0,
}: TradingModalProps) {
  const { data: session } = useSession();
  
  // Order state
  const [orderSide, setOrderSide] = useState<OrderSide>('BUY');
  const [productType, setProductType] = useState<ProductType>('MIS');
  const [orderType, setOrderType] = useState<OrderType>('MARKET');
  const [quantityMode, setQuantityMode] = useState<QuantityMode>('FIXED');
  
  // Quantity & Price
  const [quantity, setQuantity] = useState(1);
  const [amount, setAmount] = useState(currentPrice);
  const [limitPrice, setLimitPrice] = useState(currentPrice);
  const [triggerPrice, setTriggerPrice] = useState(currentPrice * 0.98);
  
  // Advanced options
  const [enableTarget, setEnableTarget] = useState(false);
  const [enableStopLoss, setEnableStopLoss] = useState(false);
  const [targetPrice, setTargetPrice] = useState(currentPrice * 1.05);
  const [stopLossPrice, setStopLossPrice] = useState(currentPrice * 0.95);
  
  // UI state
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch user balance
  useEffect(() => {
    if (session) {
      fetchBalance();
    }
  }, [session]);

  // Auto calculate quantity when amount changes
  useEffect(() => {
    if (quantityMode === 'AUTO' && amount > 0) {
      const price = orderType === 'LIMIT' ? limitPrice : currentPrice;
      const calculatedQty = Math.floor(amount / price);
      setQuantity(calculatedQty > 0 ? calculatedQty : 1);
    }
  }, [amount, quantityMode, orderType, limitPrice, currentPrice]);

  // Update prices when current price changes
  useEffect(() => {
    if (orderType === 'MARKET') {
      setLimitPrice(currentPrice);
    }
    setTriggerPrice(currentPrice * 0.98);
    setTargetPrice(currentPrice * 1.05);
    setStopLossPrice(currentPrice * 0.95);
  }, [currentPrice]);

  const fetchBalance = async () => {
    try {
      const response = await fetch('/api/portfolio');
      const data = await response.json();
      setBalance(data.balance || 0);
    } catch (err) {
      console.error('Error fetching balance:', err);
    }
  };

  const calculateTotal = () => {
    const price = orderType === 'LIMIT' ? limitPrice : currentPrice;
    return quantity * price;
  };

  const validateOrder = (): string | null => {
    if (quantity <= 0) return 'Quantity must be greater than 0';
    
    if (orderSide === 'BUY') {
      const total = calculateTotal();
      if (total > balance) return 'Insufficient balance';
    } else {
      if (quantity > availableQuantity) return `Only ${availableQuantity} shares available`;
    }
    
    if (orderType === 'LIMIT' && limitPrice <= 0) return 'Invalid limit price';
    if ((orderType === 'SL' || orderType === 'SL-M') && triggerPrice <= 0) return 'Invalid trigger price';
    
    return null;
  };

  const handleSubmit = async () => {
    setError('');
    setSuccess('');
    
    const validationError = validateOrder();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const orderData = {
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
        body: JSON.stringify(orderData),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(data.message || 'Order placed successfully!');
        setTimeout(() => {
          onClose();
          window.location.reload();
        }, 1500);
      } else {
        setError(data.error || 'Failed to place order');
      }
    } catch (err) {
      setError('An error occurred while placing order');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const total = calculateTotal();
  const remainingBalance = balance - (orderSide === 'BUY' ? total : 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{stockSymbol}</h2>
            <p className="text-sm text-gray-600">{stockName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Current Price */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Current Market Price</div>
            <div className="text-2xl font-bold text-gray-900">₹{currentPrice.toFixed(2)}</div>
          </div>

          {/* Buy/Sell Toggle */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setOrderSide('BUY')}
              className={`py-3 rounded-lg font-bold text-sm uppercase tracking-wider transition-all ${
                orderSide === 'BUY'
                  ? 'bg-green-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Buy
            </button>
            <button
              onClick={() => setOrderSide('SELL')}
              className={`py-3 rounded-lg font-bold text-sm uppercase tracking-wider transition-all ${
                orderSide === 'SELL'
                  ? 'bg-red-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Sell
            </button>
          </div>

          {/* Product Type */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wider">
              Product Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setProductType('MIS')}
                className={`py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                  productType === 'MIS'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Intraday (MIS)
              </button>
              <button
                onClick={() => setProductType('NRML')}
                className={`py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                  productType === 'NRML'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Overnight (NRML)
              </button>
            </div>
          </div>

          {/* Order Type */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wider">
              Order Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setOrderType('MARKET')}
                className={`py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                  orderType === 'MARKET'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Market
              </button>
              <button
                onClick={() => setOrderType('LIMIT')}
                className={`py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                  orderType === 'LIMIT'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Limit
              </button>
              <button
                onClick={() => setOrderType('SL')}
                className={`py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                  orderType === 'SL'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Stop Loss
              </button>
              <button
                onClick={() => setOrderType('SL-M')}
                className={`py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                  orderType === 'SL-M'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                SL-Market
              </button>
            </div>
          </div>

          {/* Limit Price (for LIMIT orders) */}
          {orderType === 'LIMIT' && (
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wider">
                Limit Price
              </label>
              <input
                type="number"
                value={limitPrice}
                onChange={(e) => setLimitPrice(parseFloat(e.target.value) || 0)}
                step="0.05"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              />
            </div>
          )}

          {/* Trigger Price (for SL orders) */}
          {(orderType === 'SL' || orderType === 'SL-M') && (
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wider">
                Trigger Price
              </label>
              <input
                type="number"
                value={triggerPrice}
                onChange={(e) => setTriggerPrice(parseFloat(e.target.value) || 0)}
                step="0.05"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              />
            </div>
          )}

          {/* Quantity Mode Toggle */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wider">
              Quantity
            </label>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <button
                onClick={() => setQuantityMode('FIXED')}
                className={`py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                  quantityMode === 'FIXED'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Fixed
              </button>
              <button
                onClick={() => setQuantityMode('AUTO')}
                className={`py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                  quantityMode === 'AUTO'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Auto Calculate
              </button>
            </div>

            {quantityMode === 'FIXED' ? (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-12 h-12 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center font-bold text-xl"
                >
                  −
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-center font-bold text-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                />
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-12 h-12 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center font-bold text-xl"
                >
                  +
                </button>
              </div>
            ) : (
              <div>
                <label className="block text-xs text-gray-600 mb-2">Enter Amount (₹)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  step="100"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                />
                <div className="mt-2 text-sm text-gray-600">
                  Calculated Quantity: <span className="font-bold">{quantity}</span>
                </div>
              </div>
            )}
          </div>

          {/* Advanced Options */}
          <div className="border-t border-gray-200 pt-4">
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableTarget}
                  onChange={(e) => setEnableTarget(e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-600"
                />
                <span className="text-sm font-medium text-gray-700">Set Target Price</span>
              </label>
              {enableTarget && (
                <input
                  type="number"
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(parseFloat(e.target.value) || 0)}
                  step="0.05"
                  placeholder="Target Price"
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent"
                />
              )}

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableStopLoss}
                  onChange={(e) => setEnableStopLoss(e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-600"
                />
                <span className="text-sm font-medium text-gray-700">Set Stop Loss</span>
              </label>
              {enableStopLoss && (
                <input
                  type="number"
                  value={stopLossPrice}
                  onChange={(e) => setStopLossPrice(parseFloat(e.target.value) || 0)}
                  step="0.05"
                  placeholder="Stop Loss Price"
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
                />
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Quantity</span>
              <span className="font-bold text-gray-900">{quantity}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Price</span>
              <span className="font-bold text-gray-900">
                ₹{(orderType === 'LIMIT' ? limitPrice : currentPrice).toFixed(2)}
              </span>
            </div>
            <div className="border-t border-gray-300 pt-2 flex justify-between">
              <span className="font-bold text-gray-900">Total</span>
              <span className="font-bold text-gray-900 text-lg">₹{total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Available Balance</span>
              <span className="font-medium text-gray-900">₹{balance.toFixed(2)}</span>
            </div>
            {orderSide === 'BUY' && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Remaining Balance</span>
                <span className={`font-medium ${remainingBalance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  ₹{remainingBalance.toFixed(2)}
                </span>
              </div>
            )}
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
              {success}
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={loading || !!validateOrder()}
            className={`w-full py-4 rounded-lg font-bold text-white text-sm uppercase tracking-wider transition-all ${
              orderSide === 'BUY'
                ? 'bg-green-600 hover:bg-green-700 disabled:bg-gray-300'
                : 'bg-red-600 hover:bg-red-700 disabled:bg-gray-300'
            } disabled:cursor-not-allowed`}
          >
            {loading ? (
              'Processing...'
            ) : (
              `${orderType} ${orderSide} ${quantity} ${quantity === 1 ? 'Share' : 'Shares'}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
