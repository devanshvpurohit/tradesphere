import { blackScholes, stdNormCDF } from 'black-scholes';

export interface OptionContract {
  strike: number;
  call: {
    symbol: string;
    ltp: number;
    change: number;
    delta: number;
    theta: number;
    gamma: number;
    vega: number;
    oi: number;
    volume: number;
    iv: number;
  };
  put: {
    symbol: string;
    ltp: number;
    change: number;
    delta: number;
    theta: number;
    gamma: number;
    vega: number;
    oi: number;
    volume: number;
    iv: number;
  };
}

export interface OptionChainData {
  underlying: string;
  underlyingPrice: number;
  expiryDate: string;
  daysToExpiry: number;
  strikes: OptionContract[];
  pcrRatio: number;
  maxPainStrike: number;
}

// Probability density function of standard normal distribution
function stdNormPDF(x: number): number {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

export function calculateGreeks(
  spot: number,
  strike: number,
  timeToExpiryYears: number,
  volatility: number = 0.15,
  riskFreeRate: number = 0.065
) {
  const t = Math.max(0.001, timeToExpiryYears);
  const v = Math.max(0.01, volatility);
  const r = riskFreeRate;

  const d1 = (Math.log(spot / strike) + (r + 0.5 * v * v) * t) / (v * Math.sqrt(t));
  const d2 = d1 - v * Math.sqrt(t);

  const callPrice = blackScholes(spot, strike, t, v, r, 'call');
  const putPrice = blackScholes(spot, strike, t, v, r, 'put');

  const callDelta = stdNormCDF(d1);
  const putDelta = callDelta - 1;

  const gamma = stdNormPDF(d1) / (spot * v * Math.sqrt(t));
  const vega = (spot * Math.sqrt(t) * stdNormPDF(d1)) / 100; // per 1% change

  const callTheta =
    (- (spot * stdNormPDF(d1) * v) / (2 * Math.sqrt(t)) -
      r * strike * Math.exp(-r * t) * stdNormCDF(d2)) /
    365;

  const putTheta =
    (- (spot * stdNormPDF(d1) * v) / (2 * Math.sqrt(t)) +
      r * strike * Math.exp(-r * t) * stdNormCDF(-d2)) /
    365;

  return {
    callPrice: Number(Math.max(0.5, callPrice).toFixed(2)),
    putPrice: Number(Math.max(0.5, putPrice).toFixed(2)),
    callDelta: Number(callDelta.toFixed(3)),
    putDelta: Number(putDelta.toFixed(3)),
    gamma: Number(gamma.toFixed(5)),
    vega: Number(vega.toFixed(2)),
    callTheta: Number(callTheta.toFixed(2)),
    putTheta: Number(putTheta.toFixed(2)),
  };
}

export function generateOptionChain(
  underlying: 'NIFTY' | 'BANKNIFTY',
  spotPrice?: number
): OptionChainData {
  const spot = spotPrice || (underlying === 'NIFTY' ? 24850 : 51200);
  const step = underlying === 'NIFTY' ? 50 : 100;
  const atm = Math.round(spot / step) * step;

  const strikes: OptionContract[] = [];
  const daysToExpiry = 4; // Near weekly Thursday expiry
  const tYears = daysToExpiry / 365;

  let totalCallOi = 0;
  let totalPutOi = 0;

  for (let offset = -7; offset <= 7; offset++) {
    const strike = atm + offset * step;
    const greeks = calculateGreeks(spot, strike, tYears, 0.14, 0.065);

    const callOi = Math.floor(45000 + Math.abs(Math.sin(strike)) * 120000);
    const putOi = Math.floor(42000 + Math.abs(Math.cos(strike)) * 115000);
    totalCallOi += callOi;
    totalPutOi += putOi;

    strikes.push({
      strike,
      call: {
        symbol: `${underlying} ${strike} CE`,
        ltp: greeks.callPrice,
        change: Number(((Math.random() - 0.45) * 8).toFixed(2)),
        delta: greeks.callDelta,
        theta: greeks.callTheta,
        gamma: greeks.gamma,
        vega: greeks.vega,
        oi: callOi,
        volume: Math.floor(callOi * 1.8),
        iv: 13.8,
      },
      put: {
        symbol: `${underlying} ${strike} PE`,
        ltp: greeks.putPrice,
        change: Number(((Math.random() - 0.52) * 8).toFixed(2)),
        delta: greeks.putDelta,
        theta: greeks.putTheta,
        gamma: greeks.gamma,
        vega: greeks.vega,
        oi: putOi,
        volume: Math.floor(putOi * 1.6),
        iv: 14.5,
      },
    });
  }

  const pcrRatio = totalCallOi > 0 ? Number((totalPutOi / totalCallOi).toFixed(2)) : 1.0;

  return {
    underlying,
    underlyingPrice: spot,
    expiryDate: 'Current Weekly Expiry',
    daysToExpiry,
    strikes,
    pcrRatio,
    maxPainStrike: atm,
  };
}
