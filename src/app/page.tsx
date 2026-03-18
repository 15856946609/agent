"use client";

import React, { useState, useEffect } from 'react';
import { StockChart } from '@/components/StockChart';
import { TrendingUp, TrendingDown, DollarSign, Activity } from 'lucide-react';

const mockData = [
  { time: '2025-01-01', open: 150.00, high: 155.50, low: 149.20, close: 153.40 },
  { time: '2025-01-02', open: 153.40, high: 158.00, low: 152.00, close: 156.80 },
  { time: '2025-01-03', open: 156.80, high: 160.20, low: 155.50, close: 159.10 },
  { time: '2025-01-04', open: 159.10, high: 161.00, low: 158.20, close: 160.50 },
  { time: '2025-01-05', open: 160.50, high: 162.50, low: 159.80, close: 161.20 },
  { time: '2025-01-06', open: 161.20, high: 163.00, low: 160.50, close: 162.10 },
  { time: '2025-01-07', open: 162.10, high: 165.00, low: 161.80, close: 164.30 },
  { time: '2025-01-08', open: 164.30, high: 166.80, low: 163.50, close: 165.90 },
];

export default function Home() {
  const [stock, setStock] = useState({
    symbol: "AAPL",
    price: 235.42,
    change: 2.34,
    changePercent: 1.02,
  });

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 p-8">
      <header className="max-w-7xl mx-auto mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Activity className="text-blue-600" />
            MarketPulse <span className="text-sm font-normal text-gray-500 bg-gray-200 px-2 py-1 rounded">BETA</span>
          </h1>
          <p className="text-gray-500">Real-time US Stock Market Intelligence</p>
        </div>
        <div className="flex gap-4">
          <input 
            type="text" 
            placeholder="Search Symbol (e.g. NVDA)" 
            className="border rounded-lg px-4 py-2 w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </header>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Market Summary Cards */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-2">
          <span className="text-gray-500 text-sm font-medium">S&P 500</span>
          <div className="flex justify-between items-end">
            <span className="text-2xl font-bold">5,842.47</span>
            <span className="text-green-500 flex items-center text-sm font-semibold">
              <TrendingUp size={16} /> +0.45%
            </span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-2">
          <span className="text-gray-500 text-sm font-medium">NASDAQ</span>
          <div className="flex justify-between items-end">
            <span className="text-2xl font-bold">18,673.21</span>
            <span className="text-green-500 flex items-center text-sm font-semibold">
              <TrendingUp size={16} /> +0.82%
            </span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-2">
          <span className="text-gray-500 text-sm font-medium">DOW JONES</span>
          <div className="flex justify-between items-end">
            <span className="text-2xl font-bold">42,863.86</span>
            <span className="text-red-500 flex items-center text-sm font-semibold">
              <TrendingDown size={16} /> -0.12%
            </span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-2">
          <span className="text-gray-500 text-sm font-medium">Market Status</span>
          <div className="flex justify-between items-center">
            <span className="text-lg font-bold">OPEN</span>
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          </div>
        </div>

        {/* Main Chart Section */}
        <div className="lg:col-span-3 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-baseline gap-4">
              <h2 className="text-4xl font-black">{stock.symbol}</h2>
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-gray-800">${stock.price}</span>
                <span className={`text-sm font-bold ${stock.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {stock.change >= 0 ? '+' : ''}{stock.change} ({stock.changePercent}%)
                </span>
              </div>
            </div>
            <div className="flex bg-gray-100 rounded-lg p-1">
              {['1D', '5D', '1M', '1Y', 'ALL'].map(t => (
                <button key={t} className={`px-4 py-1 rounded-md text-sm ${t === '1D' ? 'bg-white shadow-sm font-bold' : 'text-gray-500'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <StockChart data={mockData} />
        </div>

        {/* Watchlist Sidebar */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-blue-500" />
            Watchlist
          </h3>
          <div className="space-y-4">
            {[
              { s: "TSLA", p: "262.11", c: "+3.42%" },
              { s: "NVDA", p: "138.25", c: "+1.85%" },
              { s: "MSFT", p: "418.16", c: "-0.42%" },
              { s: "GOOGL", p: "164.82", c: "+0.12%" },
              { s: "AMZN", p: "186.42", c: "-1.10%" },
            ].map(item => (
              <div key={item.s} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer">
                <div>
                  <div className="font-bold">{item.s}</div>
                  <div className="text-xs text-gray-400">NASDAQ</div>
                </div>
                <div className="text-right">
                  <div className="font-bold">${item.p}</div>
                  <div className={`text-xs ${item.c.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>{item.c}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
