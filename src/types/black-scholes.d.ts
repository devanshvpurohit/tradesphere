declare module 'black-scholes' {
  export function blackScholes(
    s: number,
    k: number,
    t: number,
    v: number,
    r: number,
    callPut: 'call' | 'put'
  ): number;

  export function stdNormCDF(x: number): number;
  export function getW(s: number, k: number, t: number, v: number, r: number): number;
}
