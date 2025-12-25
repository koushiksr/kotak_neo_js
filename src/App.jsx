import { useState, useEffect } from 'react';
import AuthGuard from './components/auth/AuthGuard';

import PlaceOrder from './components/tradeing/PlaceOrder';
import OrderBasket from './components/tradeing/OrderBasket';
import MarketDepth from './components/tradeing/MarketDepth';
import PortfolioDashboard from './components/tradeing/PortfolioDashboard';
// import searchCsvFiles from './api/test1';
function App() {
  const [basket, setBasket] = useState([]);
  const [views, setViews] = useState(['orders']);
  const [results, setResults] = useState([]);

  // useEffect(() => {
  //   const fetchCsv = async () => {
  //     const res = await searchCsvFiles({ searchString: "natgasmini", maxMatches: 10 });
  //     console.log("[ALL DONE] Total matches found:", res.length);
  //     setResults(res);
  //   };
  //   fetchCsv();
  // }, []);

  const depthData = {
    bids: [
      { price: 620.5, qty: 1200 },
      { price: 620.4, qty: 900 },
      { price: 620.3, qty: 600 },
    ],
    asks: [
      { price: 620.6, qty: 800 },
      { price: 620.7, qty: 1100 },
      { price: 620.8, qty: 1500 },
    ],
  };

  return (
    <AuthGuard>
      <div className="min-h-screen p-4 space-y-6 bg-gray-50">

        {/* ORDER ENTRY & BASKET */}
        <section className="bg-white border border-green-500 rounded-md shadow-sm p-4">
          <h2 className="font-semibold text-lg mb-3">Place Order</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <PlaceOrder onAdd={(o) => setBasket([...basket, o])} />
            </div>
            <OrderBasket
              items={basket}
              onRemove={(i) => setBasket(basket.filter((_, x) => x !== i))}
            />
          </div>
        </section>

        {/* MARKET DEPTH */}
        <section className="bg-white border border-red-500 rounded-md shadow-sm p-4">
          <h2 className="font-semibold text-lg mb-3">Market Depth</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <MarketDepth {...depthData} />
            <MarketDepth {...depthData} />
            <MarketDepth {...depthData} />
          </div>
        </section>

        {/* PORTFOLIO DASHBOARD */}
        <section className="bg-white border border-blue-500 rounded-md shadow-sm p-4">
          <h2 className="font-semibold text-lg mb-3">Portfolio</h2>
          <PortfolioDashboard views={views} setViews={setViews} />
        </section>

      </div>
    </AuthGuard>
  );
}

export default App;
