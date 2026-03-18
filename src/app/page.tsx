"use client";

import React, { useState, useEffect } from 'react';
import { StockChart } from '@/components/StockChart';
import { TrendingUp, TrendingDown, Activity, RefreshCcw, Search } from 'lucide-react';

interface StockQuote {
  c: number; // Current price
  d: number; // Change
  dp: number; // Percent change
  h: number; // High
  l: number; // Low
  o: number; // Open
  pc: number; // Previous close
}

interface CandleData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

export default function Home() {
  const [symbol, setSymbol] = useState("AAPL");
  const [searchInput, setSearchInput] = useState("");
  const [quote, setQuote] = useState<StockQuote | null>(null);
  const [candles, setCandles] = useState<CandleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Note: In a production app, use an environment variable for the API key
  // For this demo, we'll use a public sandbox key if available or prompt for one
  const FINNHUB_API_KEY = "sandbox_c8r4v1iad3if4n8m9j1g"; // Replace with your real key if needed

  const fetchData = async (targetSymbol: string) => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch Quote (Real-time price)
      const quoteRes = await fetch(`https://finnhub.io/api/v1/quote?symbol=${targetSymbol}&token=${FINNHUB_API_KEY}`);
      const quoteData = await quoteRes.json();
      
      if (quoteData.c === 0) {
        throw new Error("Symbol not found or invalid API key");
      }
      setQuote(quoteData);

      // 2. Fetch Candle Data (Daily - last 30 days)
      const to = Math.floor(Date.now() / 1000);
      const from = sobriety(to - 30 * 24 * 60 * 60); // 30 days ago
      
      const candleRes = await fetch(`https://finnhub.io/api/v1/stock/candle?symbol=${targetSymbol}&resolution=D&from=${from}&to=${to}&token=${FINNHUB_API_KEY}`);
      const candleData = await candleRes.json();

      if (candleData.s === "ok") {
        const formattedCandles = candleData.t.map((t: number, i: number) => ({
          time: new Date(t * 1000).toISOString().split('T')[0],
          open: candleData.o[i],
          high: candleData.h[i],
          low: candleData.l[i],
          close: candleData.c[i],
        }));
        setCandles(formattedCandles);
      } else {
        // Fallback mock data if API limit reached or error
        setCandles(generateMockCandles());
      }
    } catch (err: any) {
      setError(err.message);
      setCandles(generateMockCandles());
    } finally {
      setLoading(false);
    }
  };

  const sobriety = (val: number) => Math.floor(val);

  const generateMockCandles = () => {
    const data = [];
    let price = 150;
    const now = new Date();
    for (let i = 30; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const open = price + (Math.random() - 0.5) * 5;
      const close = open + (Math.random() - 0.5) * 5;
      const high = Math.max(open, close) + Math.random() * 2;
      const low = Math.min(open, close) - Math.random() * 2;
      data.push({
        time: d.toISOString().split('T')[0],
        open, high, low, close
      });
      price = close;
    }
    return data;
  };

  useEffect(() => {
    fetchData(symbol);
    const interval = setInterval(() => fetchData(symbol), 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [symbol]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setSymbol(searchInput.toUpperCase());
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Navigation */}
      <nav className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Activity className="text-white" size={20} />
            </div>
            <h1 className="text-xl font-extrabold tracking-tight">MarketPulse</h1>
          </div>
          
          <form onSubmit={handleSearch} className="flex-1 max-w-md mx-8 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search US Stock (e.g. NVDA, TSLA, MSFT)" 
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full bg-slate-100 border-none rounded-full pl-10 pr-4 py-2 focus:ring-2 focus:ring-blue-500 transition-all outline-none text-sm"
            />
          </form>

          <div className="flex items-center gap-4">
             <button 
              onClick={() => fetchData(symbol)}
              className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors"
              title="Refresh Data"
             >
               <RefreshCcw size={20} className={loading ? "animate-spin" : ""} />
             </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-4 lg:p-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-medium">
            Warning: {error}. Showing fallback data.
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Chart Section */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">NASDAQ</span>
                    <h2 className="text-4xl font-black tracking-tighter">{symbol}</h2>
                  </div>
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl font-bold tracking-tight">
                      ${quote?.c?.toFixed(2) || "---"}
                    </span>
                    <span className={`flex items-center text-sm font-bold ${quote && quote.d >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {quote && (quote.d >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />)}
                      {quote?.d?.toFixed(2)} ({quote?.dp?.toFixed(2)}%)
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-medium uppercase tracking-wider text-slate-400">
                   <div className="bg-slate-50 px-3 py-2 rounded-lg">
                      <p>Open</p>
                      <p className="text-slate-900 text-sm font-bold">${quote?.o?.toFixed(2) || "---"}</p>
                   </div>
                   <div className="bg-slate-50 px-3 py-2 rounded-lg">
                      <p>High</p>
                      <p className="text-slate-900 text-sm font-bold">${quote?.h?.toFixed(2) || "---"}</p>
                   </div>
                   <div className="bg-slate-50 px-3 py-2 rounded-lg">
                      <p>Low</p>
                      <p className="text-slate-900 text-sm font-bold">${quote?.l?.toFixed(2) || "---"}</p>
                   </div>
                   <div className="bg-slate-50 px-3 py-2 rounded-lg">
                      <p>Prev Close</p>
                      <p className="text-slate-900 text-sm font-bold">${quote?.pc?.toFixed(2) || "---"}</p>
                   </div>
                </div>
              </div>

              <div className="relative h-[450px] w-full rounded-xl overflow-hidden border border-slate-100">
                {loading && (
                  <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm font-bold text-slate-500">Syncing Market Data...</span>
                    </div>
                  </div>
                )}
                <StockChart data={candles} />
              </div>
            </div>
          </div>

          {/* Watchlist & Info */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h3 className="font-bold mb-4 text-slate-800 flex items-center gap-2">
                <Activity size={18} className="text-blue-600" />
                Popular Assets
              </h3>
              <div className="space-y-3">
                {["AAPL", "NVDA", "TSLA", "MSFT", "GOOGL"].map(s => (
                  <button 
                    key={s} 
                    onClick={() => setSymbol(s)}
                    className={`w-full flex justify-between items-center p-3 rounded-xl transition-all ${s === symbol ? 'bg-blue-600 text-white shadow-blue-200 shadow-lg' : 'hover:bg-slate-50 border border-transparent hover:border-slate-100'}`}
                  >
                    <span className="font-bold tracking-tight">{s}</span>
                    <span className={`text-xs font-medium ${s === symbol ? 'text-blue-100' : 'text-slate-400'}`}>NASDAQ</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-2xl shadow-lg text-white">
              <h4 className="font-bold mb-2 flex items-center gap-2">
                🚀 Market Insights
              </h4>
              <p className="text-sm text-blue-100 leading-relaxed">
                Real-time analysis powered by Finnhub. Keep track of price movements and market sentiment.
              </p>
              <button className="mt-4 w-full py-2 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-lg text-xs font-bold transition-all">
                Learn Trading Strategies
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
