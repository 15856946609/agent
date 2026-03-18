"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { StockChart } from '@/components/StockChart';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  RefreshCcw, 
  Search, 
  Globe, 
  Clock,
  LayoutDashboard
} from 'lucide-react';

// --- Types & Constants ---
interface StockQuote {
  c: number; d: number; dp: number; h: number; l: number; o: number; pc: number;
}

interface CandleData {
  time: string | number;
  open: number;
  high: number;
  low: number;
  close: number;
}

type Language = 'en' | 'zh';
type Resolution = '1' | '5' | '15' | 'D' | 'W' | 'M';

const TRANSLATIONS = {
  en: {
    title: "MarketPulse",
    subtitle: "Real-time US Market Intelligence",
    searchPlaceholder: "Search US Stock (e.g. NVDA, TSLA)",
    marketStatus: "MARKET STATUS",
    open: "OPEN",
    closed: "CLOSED",
    stats: {
      open: "Open",
      high: "High",
      low: "Low",
      prevClose: "Prev Close"
    },
    popular: "Popular Assets",
    insights: "Market Insights",
    insightsDesc: "Real-time analysis powered by Finnhub. Track movements and sentiment.",
    resolutions: {
      '1': '1m',
      '5': '5m',
      '15': '15m',
      'D': '1D',
      'W': '1W',
      'M': '1M'
    },
    syncing: "Syncing Market Data...",
    warning: "Warning: Showing fallback data due to API limits."
  },
  zh: {
    title: "行情脉搏",
    subtitle: "美股实时行情情报系统",
    searchPlaceholder: "搜索美股代码 (如 NVDA, TSLA)",
    marketStatus: "市场状态",
    open: "交易中",
    closed: "已休市",
    stats: {
      open: "开盘价",
      high: "最高价",
      low: "最低价",
      prevClose: "昨收盘"
    },
    popular: "热门资产",
    insights: "市场洞察",
    insightsDesc: "由 Finnhub 提供实时分析。追踪价格波动与市场情绪。",
    resolutions: {
      '1': '1分',
      '5': '5分',
      '15': '15分',
      'D': '日线',
      'W': '周线',
      'M': '月线'
    },
    syncing: "正在同步行情数据...",
    warning: "提示：由于 API 限制，目前显示的是模拟数据。"
  }
};

export default function Home() {
  const [lang, setLang] = useState<Language>('zh');
  const [symbol, setSymbol] = useState("AAPL");
  const [resolution, setResolution] = useState<Resolution>('D');
  const [searchInput, setSearchInput] = useState("");
  const [quote, setQuote] = useState<StockQuote | null>(null);
  const [candles, setCandles] = useState<CandleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const t = TRANSLATIONS[lang];
  const FINNHUB_API_KEY = "sandbox_c8r4v1iad3if4n8m9j1g";

  const generateMockCandles = useCallback((res: Resolution) => {
    const data: CandleData[] = [];
    let price = 150 + Math.random() * 50;
    const count = res === 'D' || res === 'W' || res === 'M' ? 100 : 200;
    
    for (let i = count; i >= 0; i--) {
      const time = new Date();
      if (res === 'D') time.setDate(time.getDate() - i);
      else if (res === 'W') time.setDate(time.getDate() - i * 7);
      else if (res === 'M') time.setMonth(time.getMonth() - i);
      else time.setMinutes(time.getMinutes() - i * parseInt(res));

      const open = price + (Math.random() - 0.5) * 2;
      const close = open + (Math.random() - 0.5) * 2;
      const high = Math.max(open, close) + Math.random();
      const low = Math.min(open, close) - Math.random();
      
      data.push({
        time: (res === 'D' || res === 'W' || res === 'M') 
          ? time.toISOString().split('T')[0] 
          : Math.floor(time.getTime() / 1000) as number,
        open, high, low, close
      });
      price = close;
    }
    return data;
  }, []);

  const fetchData = useCallback(async (targetSymbol: string, res: Resolution) => {
    setLoading(true);
    setError(false);
    try {
      // 1. Fetch Quote
      const quoteRes = await fetch(`https://finnhub.io/api/v1/quote?symbol=${targetSymbol}&token=${FINNHUB_API_KEY}`);
      const quoteData = await quoteRes.json();
      if (quoteData.c) setQuote(quoteData);

      // 2. Fetch Candles
      const to = Math.floor(Date.now() / 1000);
      let from;
      if (res === 'D') from = to - 100 * 24 * 60 * 60;
      else if (res === 'W') from = to - 500 * 24 * 60 * 60;
      else if (res === 'M') from = to - 1000 * 24 * 60 * 60;
      else from = to - 1000 * 60 * parseInt(res);

      const candleRes = await fetch(`https://finnhub.io/api/v1/stock/candle?symbol=${targetSymbol}&resolution=${res}&from=${from}&to=${to}&token=${FINNHUB_API_KEY}`);
      const candleData = await candleRes.json();

      if (candleData.s === "ok" && candleData.t) {
        const formatted = candleData.t.map((timestamp: number, i: number) => ({
          time: (res === 'D' || res === 'W' || res === 'M') 
            ? new Date(timestamp * 1000).toISOString().split('T')[0]
            : timestamp,
          open: candleData.o[i],
          high: candleData.h[i],
          low: candleData.l[i],
          close: candleData.c[i],
        }));
        setCandles(formatted);
      } else {
        throw new Error("API Limit");
      }
    } catch (err) {
      setError(true);
      setCandles(generateMockCandles(res));
    } finally {
      setLoading(false);
    }
  }, [generateMockCandles]);

  useEffect(() => {
    fetchData(symbol, resolution);
    const interval = setInterval(() => fetchData(symbol, resolution), 60000);
    return () => clearInterval(interval);
  }, [symbol, resolution, fetchData]);

  return (
    <main className="min-h-screen bg-[#f8fafc] text-[#1e293b] font-sans selection:bg-blue-100">
      {/* Enhanced Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 shrink-0">
            <div className="bg-blue-600 p-1.5 rounded-lg shadow-blue-200 shadow-lg">
              <Activity className="text-white" size={18} />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-black leading-none">{t.title}</h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t.subtitle}</p>
            </div>
          </div>
          
          <form onSubmit={(e) => { e.preventDefault(); if(searchInput) setSymbol(searchInput.toUpperCase()); }} className="flex-1 max-w-lg relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder={t.searchPlaceholder}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full bg-slate-100/50 border border-transparent focus:bg-white focus:border-blue-500 rounded-xl pl-10 pr-4 py-2 transition-all outline-none text-sm"
            />
          </form>

          <div className="flex items-center gap-2">
             <button 
              onClick={() => setLang(lang === 'en' ? 'zh' : 'en')}
              className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-slate-100 rounded-lg text-sm font-bold transition-colors border border-slate-200"
             >
               <Globe size={14} />
               <span>{lang === 'en' ? '中文' : 'EN'}</span>
             </button>
             <button 
              onClick={() => fetchData(symbol, resolution)}
              className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
             >
               <RefreshCcw size={16} className={loading ? "animate-spin" : ""} />
             </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-4 lg:p-6 space-y-6">
        {error && (
          <div className="p-3 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl text-xs font-bold flex items-center gap-2">
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
            {t.warning}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-black bg-blue-600 text-white px-2 py-0.5 rounded tracking-widest">NASDAQ</span>
                    <h2 className="text-5xl font-black tracking-tighter">{symbol}</h2>
                  </div>
                  <div className="flex items-baseline gap-3">
                    <span className="text-4xl font-black tracking-tight text-slate-900">
                      ${quote?.c?.toFixed(2) || "---"}
                    </span>
                    <span className={`flex items-center text-sm font-black px-2 py-0.5 rounded-full ${quote && quote.d >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                      {quote && (quote.d >= 0 ? <TrendingUp size={14} className="mr-1" /> : <TrendingDown size={14} className="mr-1" />)}
                      {quote?.d?.toFixed(2)} ({quote?.dp?.toFixed(2)}%)
                    </span>
                  </div>
                </div>
                
                {/* Resolution Selector */}
                <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                   {(['1', '5', '15', 'D', 'W', 'M'] as Resolution[]).map(res => (
                     <button 
                        key={res}
                        onClick={() => setResolution(res)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${resolution === res ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                     >
                       {t.resolutions[res]}
                     </button>
                   ))}
                </div>
              </div>

              <div className="relative h-[480px] w-full rounded-2xl overflow-hidden border border-slate-100 bg-white">
                {loading && (
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-10 h-10 border-[3px] border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-xs font-black text-slate-500 tracking-widest uppercase">{t.syncing}</span>
                    </div>
                  </div>
                )}
                <StockChart data={candles} />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-8 border-t border-slate-50">
                   <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.stats.open}</p>
                      <p className="text-base font-black text-slate-800">${quote?.o?.toFixed(2) || "---"}</p>
                   </div>
                   <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.stats.high}</p>
                      <p className="text-base font-black text-slate-800">${quote?.h?.toFixed(2) || "---"}</p>
                   </div>
                   <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.stats.low}</p>
                      <p className="text-base font-black text-slate-800">${quote?.l?.toFixed(2) || "---"}</p>
                   </div>
                   <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.stats.prevClose}</p>
                      <p className="text-base font-black text-slate-800">${quote?.pc?.toFixed(2) || "---"}</p>
                   </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-black text-sm text-slate-800 uppercase tracking-widest flex items-center gap-2">
                  <LayoutDashboard size={16} className="text-blue-600" />
                  {t.popular}
                </h3>
              </div>
              <div className="space-y-2">
                {["AAPL", "NVDA", "TSLA", "MSFT", "GOOGL"].map(s => (
                  <button 
                    key={s} 
                    onClick={() => setSymbol(s)}
                    className={`w-full flex justify-between items-center p-3 rounded-xl transition-all border ${s === symbol ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-white border-slate-100 hover:border-blue-200 group'}`}
                  >
                    <div className="text-left">
                      <div className="font-black leading-none mb-1">{s}</div>
                      <div className={`text-[10px] font-bold ${s === symbol ? 'text-blue-200' : 'text-slate-400 group-hover:text-blue-400'}`}>NASDAQ</div>
                    </div>
                    <Clock size={14} className={s === symbol ? 'text-blue-200' : 'text-slate-200 group-hover:text-blue-200'} />
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-[#1e293b] p-6 rounded-2xl shadow-xl text-white relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-600/20 rounded-full blur-3xl group-hover:bg-blue-600/40 transition-all"></div>
              <h4 className="font-black text-sm mb-3 flex items-center gap-2 relative z-10 uppercase tracking-widest">
                🚀 {t.insights}
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed relative z-10 font-medium">
                {t.insightsDesc}
              </p>
              <div className="mt-6 flex items-center justify-between relative z-10">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t.marketStatus}</span>
                  <span className="text-xs font-black text-emerald-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                    {t.open}
                  </span>
                </div>
                <button className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all border border-white/10">
                  <TrendingUp size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
