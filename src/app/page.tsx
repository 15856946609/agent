"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StockChart } from '@/components/StockChart';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  RefreshCcw, 
  Search, 
  Globe, 
  Star,
  User,
  PieChart,
  PlusCircle,
  LayoutGrid,
  Zap,
  Flame,
  BarChart3,
  ChevronRight,
  Clock
} from 'lucide-react';

// --- Types ---
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
type Resolution = '1' | '5' | '15' | '30' | '60' | 'D' | 'W' | 'M';
type MarketTab = 'US' | 'CN';

// --- Static Data ---
const STOCK_METADATA: Record<string, { name: string; sector: string }> = {
  "AAPL": { name: "Apple Inc.", sector: "Technology" },
  "NVDA": { name: "NVIDIA Corp.", sector: "Semiconductors" },
  "TSLA": { name: "Tesla, Inc.", sector: "Automotive" },
  "MSFT": { name: "Microsoft Corp.", sector: "Software" },
  "GOOGL": { name: "Alphabet Inc.", sector: "Internet" },
  "AMZN": { name: "Amazon.com", sector: "E-commerce" },
  "META": { name: "Meta Platforms", sector: "Social Media" },
  "NFLX": { name: "Netflix, Inc.", sector: "Entertainment" },
  "600519": { name: "贵州茅台", sector: "Consumer" },
  "000001": { name: "平安银行", sector: "Finance" },
  "300750": { name: "宁德时代", sector: "Energy" },
  "601318": { name: "中国平安", sector: "Insurance" },
  "000725": { name: "京东方A", sector: "Display" }
};

const RECOMMENDATIONS = {
  hot: ["NVDA", "TSLA", "AAPL", "META"],
  gainers: ["GOOGL", "NFLX", "AMZN"],
  ashares: ["600519", "300750", "000725"]
};

// --- Translations ---
const TRANSLATIONS = {
  en: {
    title: "MarketPulse Pro",
    tabs: { us: "US Market", cn: "A-Shares" },
    user: { profile: "LeiLei" },
    portfolio: { title: "Portfolio", profit: "Profit/Loss", estValue: "Total Value" },
    watchlist: { title: "Favorites" },
    stats: { open: "Open", high: "High", low: "Low", prevClose: "Prev Close" },
    resolutions: { '1': '1m', '5': '5m', '15': '15m', '30': '30m', '60': '1h', 'D': '1D', 'W': '1W', 'M': '1M' },
    syncing: "Syncing...",
    explorer: "Market Explorer",
    hot: "Trending",
    topGainers: "Top Gainers",
    chinaHot: "CN Hot Picks",
    currency: { US: "$", CN: "¥" },
    placeholder: "Search Symbol or Name..."
  },
  zh: {
    title: "行情脉搏 Pro",
    tabs: { us: "美股市场", cn: "A股市场" },
    user: { profile: "磊磊" },
    portfolio: { title: "持仓管理", profit: "当日盈亏", estValue: "资产总值" },
    watchlist: { title: "自选关注" },
    stats: { open: "今开", high: "最高", low: "最低", prevClose: "昨收" },
    resolutions: { '1': '1分', '5': '5分', '15': '15分', '30': '30分', '60': '1时', 'D': '日线', 'W': '周线', 'M': '月线' },
    syncing: "实时数据同步中...",
    explorer: "发现市场",
    hot: "热门飙升",
    topGainers: "今日领涨",
    chinaHot: "A股精选",
    currency: { US: "$", CN: "¥" },
    placeholder: "搜索代码或公司名称..."
  }
};

export default function Home() {
  const [lang, setLang] = useState<Language>('zh');
  const [marketTab, setMarketTab] = useState<MarketTab>('US');
  const [symbol, setSymbol] = useState("NVDA");
  const [resolution, setResolution] = useState<Resolution>('D');
  const [searchInput, setSearchInput] = useState("");
  const [quote, setQuote] = useState<StockQuote | null>(null);
  const [candles, setCandles] = useState<CandleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [priceFlash, setPriceFlash] = useState<'up' | 'down' | null>(null);
  
  const prevPrice = useRef<number>(0);
  const t = TRANSLATIONS[lang];
  const currency = t.currency[marketTab];
  const FINNHUB_API_KEY = "sandbox_c8r4v1iad3if4n8m9j1g";

  const generateMockData = useCallback((res: Resolution, targetSymbol: string) => {
    const d = [];
    let charCodeSum = 0;
    for (let i = 0; i < targetSymbol.length; i++) charCodeSum += targetSymbol.charCodeAt(i);
    let p = (charCodeSum % 200) + 100; 
    if (targetSymbol === '600519') p = 1600;
    if (targetSymbol === 'NVDA') p = 138;
    
    for(let i=100; i>=0; i--) {
      const t = new Date();
      if(['D','W','M'].includes(res)) t.setDate(t.getDate()-i);
      else t.setMinutes(t.getMinutes()-i*15);
      const o = p + (Math.random()-0.5)*5;
      const c = o + (Math.random()-0.5)*5;
      d.push({ time: (['D','W','M'].includes(res)) ? t.toISOString().split('T')[0] : Math.floor(t.getTime()/1000), open: o, high: Math.max(o,c)+2, low: Math.min(o,c)-2, close: c });
      p = c;
    }
    return d;
  }, []);

  const fetchData = useCallback(async (targetSymbol: string, res: Resolution, forceCandle = false) => {
    try {
      if (marketTab === 'US') {
        const qRes = await fetch(`https://finnhub.io/api/v1/quote?symbol=${targetSymbol}&token=${FINNHUB_API_KEY}`);
        const qData = await qRes.json();
        
        if (qData.c) {
          if (prevPrice.current !== 0 && targetSymbol === symbol) {
            if (qData.c > prevPrice.current) setPriceFlash('up');
            else if (qData.c < prevPrice.current) setPriceFlash('down');
            setTimeout(() => setPriceFlash(null), 500);
          }
          setQuote(qData);
          prevPrice.current = qData.c;
        }

        if (forceCandle || loading) {
          const to = Math.floor(Date.now() / 1000);
          let from = to - (['D', 'W', 'M'].includes(res) ? 150 : 500) * 86400;
          const cRes = await fetch(`https://finnhub.io/api/v1/stock/candle?symbol=${targetSymbol}&resolution=${res}&from=${from}&to=${to}&token=${FINNHUB_API_KEY}`);
          const cData = await cRes.json();
          if (cData.s === "ok" && cData.t) {
            setCandles(cData.t.map((ts: number, i: number) => ({
              time: (['D', 'W', 'M'].includes(res)) ? new Date(ts * 1000).toISOString().split('T')[0] : ts,
              open: cData.o[i], high: cData.h[i], low: cData.l[i], close: cData.c[i],
            })));
          } else {
            setCandles(generateMockData(res, targetSymbol));
          }
        }
      } else {
        const base = targetSymbol === '600519' ? 1600 : 3000;
        const newPrice = base + (Math.random() - 0.5) * 50;
        setQuote({ c: newPrice, d: 15.2, dp: 0.45, h: newPrice+10, l: newPrice-10, o: base, pc: base-5 });
        if (forceCandle || loading) setCandles(generateMockData(res, targetSymbol));
      }
    } catch (err) {
      if (forceCandle || loading) setCandles(generateMockData(res, targetSymbol));
    } finally {
      setLoading(false);
    }
  }, [marketTab, loading, symbol, generateMockData]);

  useEffect(() => {
    setLoading(true);
    prevPrice.current = 0;
    fetchData(symbol, resolution, true);
  }, [symbol, resolution]);

  useEffect(() => {
    const interval = setInterval(() => fetchData(symbol, resolution, false), 5000);
    return () => clearInterval(interval);
  }, [symbol, resolution, fetchData]);

  const formatCurrency = (val: number | undefined) => {
    if (val === undefined) return "---";
    return `${currency}${val.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 pb-12">
      <nav className="bg-white/95 border-b sticky top-0 z-50 px-6 h-16 flex items-center justify-between shadow-sm backdrop-blur-md">
        <div className="flex items-center gap-10 flex-1">
          <div className="flex items-center gap-2 shrink-0">
            <div className="bg-indigo-600 p-2 rounded-xl shadow-lg">
              <Activity className="text-white" size={20} />
            </div>
            <h1 className="text-xl font-black tracking-tighter hidden lg:block">{t.title}</h1>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); if(searchInput) { setSymbol(searchInput.toUpperCase()); setSearchInput(""); }}} className="flex-1 max-w-xl relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" placeholder={t.placeholder} value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
              className="w-full bg-slate-100 border-none focus:bg-white focus:ring-2 focus:ring-indigo-500 rounded-2xl pl-12 pr-4 py-2.5 transition-all outline-none font-bold text-sm"
            />
          </form>
        </div>

        <div className="flex items-center gap-4 ml-6">
          <div className="bg-slate-100 p-1 rounded-xl flex border border-slate-200">
            {(['US', 'CN'] as MarketTab[]).map(tab => (
              <button 
                key={tab} onClick={() => { setMarketTab(tab); setSymbol(tab === 'US' ? 'NVDA' : '600519'); }}
                className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${marketTab === tab ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                {t.tabs[tab.toLowerCase() as keyof typeof t.tabs]}
              </button>
            ))}
          </div>
          <button onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')} className="p-2.5 hover:bg-slate-100 rounded-xl border border-slate-200"><Globe size={18}/></button>
          <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
             <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-xs shadow-md">L</div>
             <span className="text-sm font-black hidden md:block">{t.user.profile}</span>
          </div>
        </div>
      </nav>

      <div className="max-w-[1700px] mx-auto p-4 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <aside className="lg:col-span-3 space-y-8">
          <section className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
            <h3 className="font-black text-[10px] text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 mb-6">
              <Zap size={14} className="text-amber-500 fill-amber-500" /> {t.explorer}
            </h3>
            
            <div className="space-y-8">
              <div>
                <p className="text-xs font-black text-slate-800 mb-4 flex items-center justify-between">
                  {t.hot} <ChevronRight size={14} className="text-slate-300"/>
                </p>
                <div className="space-y-2">
                  {RECOMMENDATIONS.hot.map(s => (
                    <button key={s} onClick={() => setSymbol(s)} className={`w-full flex justify-between items-center p-3 rounded-xl transition-all border ${symbol === s ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-slate-50 border-transparent hover:border-slate-200'}`}>
                      <span className="font-black text-sm">{s}</span>
                      <span className={`text-[10px] font-bold ${symbol === s ? 'text-indigo-200' : 'text-emerald-500'}`}>+2.4%</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-black text-slate-800 mb-4 flex items-center justify-between">
                  {t.topGainers} <ChevronRight size={14} className="text-slate-300"/>
                </p>
                <div className="space-y-2">
                  {RECOMMENDATIONS.gainers.map(s => (
                    <button key={s} onClick={() => setSymbol(s)} className={`w-full flex justify-between items-center p-3 rounded-xl transition-all border ${symbol === s ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-slate-50 border-transparent hover:border-slate-200'}`}>
                      <span className="font-black text-sm">{s}</span>
                      <TrendingUp size={14} className={symbol === s ? 'text-indigo-200' : 'text-emerald-500'}/>
                    </button>
                  ))}
                </div>
              </div>
               <div>
                <p className="text-xs font-black text-slate-800 mb-4 flex items-center justify-between">
                  {t.chinaHot} <ChevronRight size={14} className="text-slate-300"/>
                </p>
                <div className="space-y-2">
                  {RECOMMENDATIONS.ashares.map(s => (
                    <button key={s} onClick={() => setSymbol(s)} className={`w-full flex justify-between items-center p-3 rounded-xl transition-all border ${symbol === s ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-slate-50 border-transparent hover:border-slate-200'}`}>
                      <span className="font-black text-sm">{s}</span>
                      <span className={`text-[10px] font-bold ${symbol === s ? 'text-indigo-200' : 'text-rose-500'}`}>-0.8%</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </aside>

        <div className="lg:col-span-9 space-y-8">
          <article className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-10">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded-lg uppercase tracking-widest">{marketTab} MARKET</div>
                  <h2 className="text-7xl font-black tracking-tighter text-slate-900">{symbol}</h2>
                </div>
                <div>
                   <p className="text-2xl font-black text-slate-400 mb-2">{STOCK_METADATA[symbol]?.name || "Asset Details"}</p>
                   <div className="flex items-baseline gap-6">
                      <span className={`text-6xl font-black tracking-tighter transition-all duration-300 ${priceFlash === 'up' ? 'text-emerald-500 scale-105' : priceFlash === 'down' ? 'text-rose-500 scale-105' : 'text-slate-900'}`}>
                        {formatCurrency(quote?.c)}
                      </span>
                      <div className={`flex items-center text-lg font-black px-4 py-2 rounded-2xl ${quote && quote.d >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                        {quote && (quote.d >= 0 ? <TrendingUp size={20} className="mr-2" /> : <TrendingDown size={20} className="mr-2" />)}
                        {quote?.d?.toFixed(2)} ({quote?.dp?.toFixed(2)}%)
                      </div>
                   </div>
                </div>
              </div>
              
              <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
                 {(['1', '5', '15', '30', '60', 'D', 'W', 'M'] as Resolution[]).map(res => (
                   <button 
                      key={res} onClick={() => setResolution(res)}
                      className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${resolution === res ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400 hover:text-slate-800'}`}
                   >
                     {t.resolutions[res]}
                   </button>
                 ))}
              </div>
            </header>

            <div className="relative h-[580px] w-full rounded-3xl overflow-hidden bg-slate-50 border border-slate-100 group">
              {loading && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-md z-20 flex flex-col items-center justify-center gap-4">
                  <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-xs font-black text-slate-400 tracking-widest uppercase">{t.syncing}</span>
                </div>
              )}
              <div className={`absolute top-4 right-4 z-10 w-3 h-3 rounded-full transition-all duration-300 ${priceFlash === 'up' ? 'bg-emerald-500 scale-150 animate-ping' : priceFlash === 'down' ? 'bg-rose-500 scale-150 animate-ping' : 'bg-slate-300'}`}></div>
              <StockChart data={candles} />
            </div>

            <footer className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-12 pt-10 border-t border-slate-50">
                 {[
                   { label: t.stats.open, val: quote?.o, icon: <BarChart3 size={14}/> },
                   { label: t.stats.high, val: quote?.h, icon: <TrendingUp size={14}/> },
                   { label: t.stats.low, val: quote?.l, icon: <TrendingDown size={14}/> },
                   { label: t.stats.prevClose, val: quote?.pc, icon: <Clock size={14}/> }
                 ].map((s, idx) => (
                   <div key={idx} className="space-y-3">
                      <div className="flex items-center gap-2 text-slate-400">
                        {s.icon}
                        <p className="text-[10px] font-black uppercase tracking-[0.2em]">{s.label}</p>
                      </div>
                      <p className="text-3xl font-black text-slate-900 tracking-tight">{formatCurrency(s.val)}</p>
                   </div>
                 ))}
            </footer>
          </article>
        </div>
      </div>
    </main>
  );
}
