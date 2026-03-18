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
  LayoutDashboard,
  Star,
  User,
  PieChart,
  ArrowRightLeft,
  PlusCircle,
  Trash2
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

interface Position {
  symbol: string;
  avgPrice: number;
  quantity: number;
  type: 'US' | 'CN';
}

type Language = 'en' | 'zh';
type Resolution = '1' | '5' | '15' | '30' | '60' | 'D' | 'W' | 'M';
type MarketTab = 'US' | 'CN';

// --- Translations ---
const TRANSLATIONS = {
  en: {
    title: "MarketPulse Pro",
    tabs: { us: "US Stocks", cn: "A-Shares" },
    user: { login: "Login", logout: "Logout", profile: "User Center" },
    portfolio: { title: "Portfolio", profit: "Profit/Loss", estValue: "Est. Value", add: "Add Position" },
    watchlist: { title: "Watchlist", empty: "No favorites yet" },
    stats: { open: "Open", high: "High", low: "Low", prevClose: "Prev Close" },
    resolutions: { '1': '1m', '5': '5m', '15': '15m', '30': '30m', '60': '1h', 'D': '1D', 'W': '1W', 'M': '1M' },
    syncing: "Syncing Data...",
    warning: "Using fallback data due to API limits."
  },
  zh: {
    title: "行情脉搏 Pro",
    tabs: { us: "美股市场", cn: "A股市场" },
    user: { login: "登录", logout: "退出", profile: "个人中心" },
    portfolio: { title: "持仓估算", profit: "当日盈亏", estValue: "持仓市值", add: "添加持仓" },
    watchlist: { title: "自选列表", empty: "暂无自选股" },
    stats: { open: "开盘", high: "最高", low: "最低", prevClose: "昨收" },
    resolutions: { '1': '1分', '5': '5分', '15': '15分', '30': '30分', '60': '1时', 'D': '日线', 'W': '周线', 'M': '月线' },
    syncing: "正在同步数据...",
    warning: "API 限制，正在展示模拟行情。"
  }
};

export default function Home() {
  const [lang, setLang] = useState<Language>('zh');
  const [marketTab, setMarketTab] = useState<MarketTab>('US');
  const [symbol, setSymbol] = useState("AAPL");
  const [resolution, setResolution] = useState<Resolution>('D');
  const [searchInput, setSearchInput] = useState("");
  const [quote, setQuote] = useState<StockQuote | null>(null);
  const [candles, setCandles] = useState<CandleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // User Systems & Data
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);

  const t = TRANSLATIONS[lang];
  const FINNHUB_API_KEY = "sandbox_c8r4v1iad3if4n8m9j1g";

  // --- Logic ---
  useEffect(() => {
    const savedWatchlist = localStorage.getItem('watchlist');
    const savedPositions = localStorage.getItem('positions');
    if (savedWatchlist) setWatchlist(JSON.parse(savedWatchlist));
    if (savedPositions) setPositions(JSON.parse(savedPositions));
  }, []);

  useEffect(() => {
    localStorage.setItem('watchlist', JSON.stringify(watchlist));
    localStorage.setItem('positions', JSON.stringify(positions));
  }, [watchlist, positions]);

  const generateMockCandles = useCallback((res: Resolution) => {
    const data: CandleData[] = [];
    let price = 150 + Math.random() * 50;
    for (let i = 100; i >= 0; i--) {
      const time = new Date();
      if (res === 'D') time.setDate(time.getDate() - i);
      else if (res === 'W') time.setDate(time.getDate() - i * 7);
      else if (res === 'M') time.setMonth(time.getMonth() - i);
      else time.setMinutes(time.getMinutes() - i * (res === '60' ? 60 : parseInt(res)));

      const open = price + (Math.random() - 0.5) * 4;
      const close = open + (Math.random() - 0.5) * 4;
      data.push({
        time: (['D', 'W', 'M'].includes(res)) ? time.toISOString().split('T')[0] : Math.floor(time.getTime() / 1000),
        open, high: Math.max(open, close) + 2, low: Math.min(open, close) - 2, close
      });
      price = close;
    }
    return data;
  }, []);

  const fetchData = useCallback(async (targetSymbol: string, res: Resolution) => {
    setLoading(true);
    setError(false);
    try {
      // Use Finnhub for US, Mock for CN (as most A-share APIs need local proxy/keys)
      if (marketTab === 'US') {
        const quoteRes = await fetch(`https://finnhub.io/api/v1/quote?symbol=${targetSymbol}&token=${FINNHUB_API_KEY}`);
        const quoteData = await quoteRes.json();
        if (quoteData.c) setQuote(quoteData);

        const to = Math.floor(Date.now() / 1000);
        let from = to - (res === 'D' ? 100 : 500) * 86400;
        const candleRes = await fetch(`https://finnhub.io/api/v1/stock/candle?symbol=${targetSymbol}&resolution=${res}&from=${from}&to=${to}&token=${FINNHUB_API_KEY}`);
        const candleData = await candleRes.json();

        if (candleData.s === "ok" && candleData.t) {
          setCandles(candleData.t.map((timestamp: number, i: number) => ({
            time: (['D', 'W', 'M'].includes(res)) ? new Date(timestamp * 1000).toISOString().split('T')[0] : timestamp,
            open: candleData.o[i], high: candleData.h[i], low: candleData.l[i], close: candleData.c[i],
          })));
        } else throw new Error("API Limit");
      } else {
        // Mocking A-Share response
        setQuote({ c: 3200 + Math.random() * 10, d: 5.2, dp: 0.16, h: 3215, l: 3190, o: 3195, pc: 3194.8 });
        setCandles(generateMockCandles(res));
      }
    } catch (err) {
      setError(true);
      setCandles(generateMockCandles(res));
    } finally {
      setLoading(false);
    }
  }, [marketTab, generateMockCandles]);

  useEffect(() => {
    fetchData(symbol, resolution);
  }, [symbol, resolution, fetchData]);

  const toggleWatchlist = (s: string) => {
    setWatchlist(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  const addPosition = () => {
    const qty = prompt("Enter Quantity:", "100");
    const prc = prompt("Enter Avg Price:", quote?.c?.toString());
    if (qty && prc) {
      setPositions([...positions, { symbol, quantity: parseFloat(qty), avgPrice: parseFloat(prc), type: marketTab }]);
    }
  };

  const totalValue = positions.reduce((acc, p) => acc + (p.symbol === symbol ? (quote?.c || p.avgPrice) : p.avgPrice) * p.quantity, 0);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-100 pb-12">
      {/* Top Navbar */}
      <nav className="bg-white border-b sticky top-0 z-50 px-4 h-16 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-1.5 rounded-lg">
              <Activity className="text-white" size={18} />
            </div>
            <h1 className="text-lg font-black tracking-tight">{t.title}</h1>
          </div>
          
          {/* Market Tabs */}
          <div className="hidden md:flex bg-slate-100 p-1 rounded-xl">
            {(['US', 'CN'] as MarketTab[]).map(tab => (
              <button 
                key={tab}
                onClick={() => { setMarketTab(tab); setSymbol(tab === 'US' ? 'AAPL' : '600519'); }}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${marketTab === tab ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {t.tabs[tab.toLowerCase() as keyof typeof t.tabs]}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group">
            <button 
              onClick={() => setIsLoggedIn(!isLoggedIn)}
              className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 rounded-xl border border-slate-200 transition-all"
            >
              <User size={16} className={isLoggedIn ? "text-green-500" : "text-slate-400"} />
              <span className="text-sm font-bold">{isLoggedIn ? "LeiLei" : t.user.login}</span>
            </button>
          </div>
          <button onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')} className="p-2 hover:bg-slate-100 rounded-lg border border-slate-200"><Globe size={16}/></button>
        </div>
      </nav>

      <div className="max-w-[1600px] mx-auto p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Sidebar: Watchlist & Portfolio */}
        <div className="lg:col-span-3 space-y-6">
          {/* Portfolio Section */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-black text-xs text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <PieChart size={14} className="text-indigo-600" /> {t.portfolio.title}
              </h3>
              <button onClick={addPosition} className="text-indigo-600 hover:scale-110 transition-transform"><PlusCircle size={18}/></button>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-slate-50 p-3 rounded-xl">
                <p className="text-[10px] text-slate-400 font-bold uppercase">{t.portfolio.estValue}</p>
                <p className="text-lg font-black">${totalValue.toLocaleString()}</p>
              </div>
              <div className="bg-emerald-50 p-3 rounded-xl">
                <p className="text-[10px] text-emerald-600 font-bold uppercase">{t.portfolio.profit}</p>
                <p className="text-lg font-black text-emerald-600">+$124.0</p>
              </div>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {positions.map((p, i) => (
                <div key={i} className="flex justify-between items-center p-2 text-xs border-b border-slate-50">
                  <div>
                    <span className="font-black">{p.symbol}</span>
                    <span className="text-slate-400 ml-2">{p.quantity} shares</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-600">${p.avgPrice}</span>
                    <button onClick={() => setPositions(positions.filter((_, idx) => idx !== i))} className="text-slate-300 hover:text-rose-500"><Trash2 size={12}/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Watchlist Section */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="font-black text-xs text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-4">
              <Star size={14} className="text-amber-400 fill-amber-400" /> {t.watchlist.title}
            </h3>
            <div className="space-y-2">
              {watchlist.length === 0 && <p className="text-xs text-slate-400 text-center py-4">{t.watchlist.empty}</p>}
              {watchlist.map(s => (
                <button 
                  key={s} onClick={() => setSymbol(s)}
                  className={`w-full flex justify-between items-center p-3 rounded-xl border transition-all ${symbol === s ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white border-slate-100 hover:border-indigo-200'}`}
                >
                  <span className="font-black tracking-tight">{s}</span>
                  <div className="flex items-center gap-2">
                    <TrendingUp size={12} className={symbol === s ? "text-indigo-200" : "text-emerald-500"} />
                    <span className="text-[10px] font-bold opacity-60">LIVE</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Center: Main Analysis Area */}
        <div className="lg:col-span-9 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-5xl font-black tracking-tighter">{symbol}</h2>
                  <button onClick={() => toggleWatchlist(symbol)} className={`p-2 rounded-full transition-all ${watchlist.includes(symbol) ? 'bg-amber-50 text-amber-500' : 'bg-slate-50 text-slate-300 hover:text-amber-400'}`}>
                    <Star size={24} className={watchlist.includes(symbol) ? "fill-amber-500" : ""} />
                  </button>
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-black tracking-tight text-slate-900">${quote?.c?.toFixed(2) || "---"}</span>
                  <span className={`flex items-center text-sm font-black px-3 py-1 rounded-full ${quote && quote.d >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                    {quote && (quote.d >= 0 ? <TrendingUp size={14} className="mr-1" /> : <TrendingDown size={14} className="mr-1" />)}
                    {quote?.d?.toFixed(2)} ({quote?.dp?.toFixed(2)}%)
                  </span>
                </div>
              </div>
              
              <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200">
                 {(['1', '5', '15', '30', '60', 'D', 'W', 'M'] as Resolution[]).map(res => (
                   <button 
                      key={res} onClick={() => setResolution(res)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${resolution === res ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                   >
                     {t.resolutions[res]}
                   </button>
                 ))}
              </div>
            </div>

            <div className="relative h-[500px] w-full rounded-2xl overflow-hidden border border-slate-100 bg-slate-50">
              {loading && <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex items-center justify-center font-black text-slate-400 animate-pulse">{t.syncing}</div>}
              <StockChart data={candles} />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-8 pt-8 border-t border-slate-100">
                 {[
                   { label: t.stats.open, val: quote?.o },
                   { label: t.stats.high, val: quote?.h },
                   { label: t.stats.low, val: quote?.l },
                   { label: t.stats.prevClose, val: quote?.pc }
                 ].map((s, idx) => (
                   <div key={idx} className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
                      <p className="text-lg font-black text-slate-800">${s.val?.toFixed(2) || "---"}</p>
                   </div>
                 ))}
            </div>
          </div>
          
          {/* Bottom Search & Quick Actions */}
          <div className="flex flex-col md:flex-row gap-4 items-center">
             <form onSubmit={(e) => { e.preventDefault(); if(searchInput) setSymbol(searchInput.toUpperCase()); }} className="flex-1 w-full relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" placeholder={t.searchPlaceholder} value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full bg-white border border-slate-200 focus:border-indigo-500 rounded-2xl pl-12 pr-4 py-4 shadow-sm transition-all outline-none font-bold"
                />
             </form>
             <button onClick={() => fetchData(symbol, resolution)} className="h-full px-6 py-4 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all font-black flex items-center gap-2">
                <RefreshCcw size={18} className={loading ? "animate-spin" : ""} />
                RE-SYNC
             </button>
          </div>
        </div>
      </div>
    </main>
  );
}
