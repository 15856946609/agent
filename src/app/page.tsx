"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Trash2,
  Info,
  LayoutGrid
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
  name: string;
  avgPrice: number;
  quantity: number;
  type: 'US' | 'CN';
}

type Language = 'en' | 'zh';
type Resolution = '1' | '5' | '15' | '30' | '60' | 'D' | 'W' | 'M';
type MarketTab = 'US' | 'CN';

// --- Mock Metadata ---
const STOCK_METADATA: Record<string, { name: string; sector: string }> = {
  "AAPL": { name: "Apple Inc.", sector: "Technology" },
  "NVDA": { name: "NVIDIA Corp.", sector: "Semiconductors" },
  "TSLA": { name: "Tesla, Inc.", sector: "Automotive" },
  "MSFT": { name: "Microsoft Corp.", sector: "Software" },
  "GOOGL": { name: "Alphabet Inc.", sector: "Internet" },
  "600519": { name: "贵州茅台 (Moutai)", sector: "Consumer" },
  "000001": { name: "平安银行 (Ping An)", sector: "Finance" },
  "300750": { name: "宁德时代 (CATL)", sector: "Energy" },
  "601318": { name: "中国平安 (Ping An)", sector: "Insurance" },
  "600036": { name: "招商银行 (CMB)", sector: "Finance" }
};

// --- Translations ---
const TRANSLATIONS = {
  en: {
    title: "MarketPulse Pro",
    tabs: { us: "US Market", cn: "A-Shares" },
    user: { login: "Login", logout: "Logout", profile: "LeiLei" },
    portfolio: { title: "Portfolio", profit: "Profit/Loss", estValue: "Total Value", add: "Add Asset" },
    watchlist: { title: "Favorites", empty: "No favorites" },
    stats: { open: "Open", high: "High", low: "Low", prevClose: "Prev Close" },
    resolutions: { '1': '1m', '5': '5m', '15': '15m', '30': '30m', '60': '1h', 'D': '1D', 'W': '1W', 'M': '1M' },
    syncing: "Syncing...",
    overview: "Market Overview",
    currency: { US: "$", CN: "¥" },
    placeholder: "Search Symbol or Name..."
  },
  zh: {
    title: "行情脉搏 Pro",
    tabs: { us: "美股市场", cn: "A股市场" },
    user: { login: "登录", logout: "退出", profile: "磊磊" },
    portfolio: { title: "持仓管理", profit: "当日盈亏", estValue: "资产总值", add: "添加记录" },
    watchlist: { title: "自选关注", empty: "暂无自选" },
    stats: { open: "今开", high: "最高", low: "最低", prevClose: "昨收" },
    resolutions: { '1': '1分', '5': '5分', '15': '15分', '30': '30分', '60': '1时', 'D': '日线', 'W': '周线', 'M': '月线' },
    syncing: "行情同步中...",
    overview: "行情全览",
    currency: { US: "$", CN: "¥" },
    placeholder: "搜索股票代码或名称..."
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

  // User State
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);

  const t = TRANSLATIONS[lang];
  const currency = t.currency[marketTab];
  const stockName = STOCK_METADATA[symbol]?.name || symbol;

  const FINNHUB_API_KEY = "sandbox_c8r4v1iad3if4n8m9j1g";

  // --- Persistence ---
  useEffect(() => {
    const w = localStorage.getItem('watchlist');
    const p = localStorage.getItem('positions');
    if (w) setWatchlist(JSON.parse(w));
    if (p) setPositions(JSON.parse(p));
  }, []);

  useEffect(() => {
    localStorage.setItem('watchlist', JSON.stringify(watchlist));
    localStorage.setItem('positions', JSON.stringify(positions));
  }, [watchlist, positions]);

  // --- Fetching Logic ---
  const fetchData = useCallback(async (targetSymbol: string, res: Resolution) => {
    setLoading(true);
    setError(false);
    try {
      if (marketTab === 'US') {
        const qRes = await fetch(`https://finnhub.io/api/v1/quote?symbol=${targetSymbol}&token=${FINNHUB_API_KEY}`);
        const qData = await qRes.json();
        if (qData.c) setQuote(qData);

        const to = Math.floor(Date.now() / 1000);
        let from = to - (['D', 'W', 'M'].includes(res) ? 100 : 500) * 86400;
        const cRes = await fetch(`https://finnhub.io/api/v1/stock/candle?symbol=${targetSymbol}&resolution=${res}&from=${from}&to=${to}&token=${FINNHUB_API_KEY}`);
        const cData = await cRes.json();

        if (cData.s === "ok" && cData.t) {
          setCandles(cData.t.map((ts: number, i: number) => ({
            time: (['D', 'W', 'M'].includes(res)) ? new Date(ts * 1000).toISOString().split('T')[0] : ts,
            open: cData.o[i], high: cData.h[i], low: cData.l[i], close: cData.c[i],
          })));
        } else throw new Error("API Limit");
      } else {
        // CN Market Mock
        setQuote({ c: 3200 + Math.random() * 100, d: 15.2, dp: 0.45, h: 3250, l: 3180, o: 3190, pc: 3185 });
        setCandles(generateMockData(res));
      }
    } catch (err) {
      setError(true);
      setCandles(generateMockData(res));
    } finally {
      setLoading(false);
    }
  }, [marketTab]);

  const generateMockData = (res: Resolution) => {
    const d = []; let p = 150;
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
  };

  useEffect(() => {
    fetchData(symbol, resolution);
  }, [symbol, resolution, fetchData]);

  const formatCurrency = (val: number | undefined) => {
    if (val === undefined) return "---";
    return `${currency}${val.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  };

  // --- Actions ---
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput) {
      const up = searchInput.toUpperCase();
      setSymbol(up);
      setSearchInput("");
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 pb-12">
      {/* Dynamic Header with Integrated Search */}
      <nav className="bg-white border-b sticky top-0 z-50 px-4 h-16 flex items-center justify-between shadow-sm backdrop-blur-md bg-white/90">
        <div className="flex items-center gap-8 flex-1">
          <div className="flex items-center gap-2 shrink-0">
            <div className="bg-gradient-to-tr from-indigo-600 to-blue-500 p-2 rounded-xl shadow-lg shadow-indigo-100">
              <Activity className="text-white" size={20} />
            </div>
            <h1 className="text-xl font-black tracking-tighter hidden sm:block">{t.title}</h1>
          </div>

          <form onSubmit={handleSearch} className="flex-1 max-w-2xl relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" placeholder={t.placeholder} value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
              className="w-full bg-slate-100 border-none focus:bg-white focus:ring-2 focus:ring-indigo-500 rounded-2xl pl-12 pr-4 py-2.5 transition-all outline-none font-bold text-sm"
            />
          </form>
        </div>

        <div className="flex items-center gap-4 ml-4">
          <div className="bg-slate-100 p-1 rounded-xl hidden md:flex border border-slate-200">
            {(['US', 'CN'] as MarketTab[]).map(tab => (
              <button 
                key={tab} onClick={() => { setMarketTab(tab); setSymbol(tab === 'US' ? 'AAPL' : '600519'); }}
                className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${marketTab === tab ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                {t.tabs[tab.toLowerCase() as keyof typeof t.tabs]}
              </button>
            ))}
          </div>
          <button onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')} className="p-2.5 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"><Globe size={18}/></button>
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-black text-xs">L</div>
            <span className="text-sm font-black hidden sm:block">{t.user.profile}</span>
          </div>
        </div>
      </nav>

      <div className="max-w-[1700px] mx-auto p-4 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Sidebar: Market Overview & Favorites */}
        <aside className="lg:col-span-3 space-y-8">
          {/* Portfolio & Assets */}
          <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-black text-xs text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <PieChart size={14} className="text-indigo-600" /> {t.portfolio.title}
              </h3>
              <PlusCircle size={20} className="text-slate-300 hover:text-indigo-600 cursor-pointer transition-colors" />
            </div>
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-5 rounded-2xl text-white shadow-xl shadow-indigo-100">
                <p className="text-[10px] font-black opacity-70 uppercase mb-1">{t.portfolio.estValue}</p>
                <p className="text-2xl font-black tracking-tight">{formatCurrency(245800.00)}</p>
                <div className="mt-4 flex items-center gap-2 text-[10px] font-bold bg-white/10 w-fit px-2 py-1 rounded-full">
                  <TrendingUp size={12}/> +12.5%
                </div>
              </div>
            </div>
          </section>

          {/* Favorites List */}
          <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <h3 className="font-black text-xs text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-6">
              <Star size={14} className="text-amber-400 fill-amber-400" /> {t.watchlist.title}
            </h3>
            <div className="space-y-3">
              {(watchlist.length > 0 ? watchlist : ["AAPL", "NVDA", "600519"]).map(s => (
                <button 
                  key={s} onClick={() => setSymbol(s)}
                  className={`w-full group flex justify-between items-center p-4 rounded-2xl border transition-all ${symbol === s ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-slate-50 border-transparent hover:border-indigo-200'}`}
                >
                  <div className="text-left">
                    <p className="font-black tracking-tight leading-none mb-1">{s}</p>
                    <p className={`text-[10px] font-bold ${symbol === s ? 'text-indigo-200' : 'text-slate-400'}`}>
                      {STOCK_METADATA[s]?.name || "Stock Market"}
                    </p>
                  </div>
                  <TrendingUp size={16} className={symbol === s ? "text-indigo-200" : "text-emerald-500"} />
                </button>
              ))}
            </div>
          </section>
        </aside>

        {/* Main Workspace */}
        <div className="lg:col-span-9 space-y-8">
          {/* Analysis View */}
          <article className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-10">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <h2 className="text-6xl font-black tracking-tighter text-slate-900">{symbol}</h2>
                  <div className="h-10 w-px bg-slate-200 mx-2 hidden md:block"></div>
                  <div className="flex flex-col justify-center">
                    <p className="text-xl font-black text-slate-400 leading-none">{stockName}</p>
                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mt-1">
                      {STOCK_METADATA[symbol]?.sector || "Market Asset"}
                    </p>
                  </div>
                </div>
                <div className="flex items-baseline gap-4">
                  <span className="text-5xl font-black tracking-tighter text-slate-900">{formatCurrency(quote?.c)}</span>
                  <span className={`flex items-center text-base font-black px-4 py-1.5 rounded-2xl ${quote && quote.d >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                    {quote && (quote.d >= 0 ? <TrendingUp size={18} className="mr-1.5" /> : <TrendingDown size={18} className="mr-1.5" />)}
                    {quote?.d?.toFixed(2)} ({quote?.dp?.toFixed(2)}%)
                  </span>
                </div>
              </div>
              
              {/* Resolution Controls */}
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

            {/* Chart Container */}
            <div className="relative h-[550px] w-full rounded-3xl overflow-hidden bg-slate-50 border border-slate-100">
              {loading && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-md z-10 flex flex-col items-center justify-center gap-4">
                  <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-xs font-black text-slate-400 tracking-widest uppercase">{t.syncing}</span>
                </div>
              )}
              <StockChart data={candles} />
            </div>

            {/* Market Data Grid */}
            <footer className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-10 pt-10 border-t border-slate-50">
                 {[
                   { label: t.stats.open, val: quote?.o },
                   { label: t.stats.high, val: quote?.h },
                   { label: t.stats.low, val: quote?.l },
                   { label: t.stats.prevClose, val: quote?.pc }
                 ].map((s, idx) => (
                   <div key={idx} className="space-y-2 group">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] group-hover:text-indigo-500 transition-colors">{s.label}</p>
                      <p className="text-2xl font-black text-slate-800">{formatCurrency(s.val)}</p>
                   </div>
                 ))}
            </footer>
          </article>

          {/* Quick Info Grid / Market Overview */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                <div className="bg-amber-50 p-3 rounded-2xl text-amber-500"><Info size={24}/></div>
                <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Market Status</p>
                   <p className="text-sm font-black text-emerald-500 flex items-center gap-2">
                     <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span> OPEN
                   </p>
                </div>
             </div>
             <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                <div className="bg-indigo-50 p-3 rounded-2xl text-indigo-500"><LayoutGrid size={24}/></div>
                <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Indices</p>
                   <p className="text-sm font-black">S&P 500: <span className="text-emerald-500">+0.8%</span></p>
                </div>
             </div>
             <div className="bg-indigo-900 p-6 rounded-3xl shadow-xl text-white flex flex-col justify-between">
                <h4 className="text-xs font-black uppercase tracking-widest opacity-60">LeiLei's Insight</h4>
                <p className="text-sm font-bold mt-2">"Market volatility remains high, monitor key levels."</p>
             </div>
          </section>
        </div>
      </div>
    </main>
  );
}
