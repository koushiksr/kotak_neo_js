import { useState } from 'react';

import OrdersPanel from './OrdersPanel';
import PositionsPanel from './PositionsPanel';
import HoldingsPanel from './HoldingsPanel';

const PortfolioDashboard = () => {
    const [visible, setVisible] = useState({
        orders: true,
        positions: false,
        holdings: false,
    });

    // Mock data (API-ready)
    const ordersData = [
        { time: '10:21', symbol: 'SBIN', qty: 100, price: 620.5, type: 'LIMIT', status: 'COMPLETE' },
        { time: '10:24', symbol: 'INFY', qty: 50, price: 'MKT', type: 'MARKET', status: 'OPEN' },
    ];

    const positionsData = [
        { symbol: 'SBIN', qty: 100, avg: 618.4, ltp: 620.5 },
        { symbol: 'INFY', qty: -50, avg: 1562, ltp: 1568.3 },
    ];

    const holdingsData = [
        { symbol: 'TCS', qty: 20, avg: 3120, ltp: 3380 },
    ];

    const toggle = (key) =>
        setVisible((v) => ({ ...v, [key]: !v[key] }));

    return (
        <div className="rounded-md p-4 min-h-[260px] max-h-[70vh] overflow-auto space-y-4">

            {/* TOGGLES */}
            <div className="flex gap-2 sticky top-0 bg-white z-10 pb-2">
                {['orders', 'positions', 'holdings'].map((k) => (
                    <button
                        key={k}
                        onClick={() => toggle(k)}
                        className={`px-4 py-1.5 text-sm rounded border transition
              ${visible[k]
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                            }`}
                    >
                        {k.toUpperCase()}
                    </button>
                ))}
            </div>

            {/* PANELS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {visible.orders && <OrdersPanel orders={ordersData} />}
                {visible.positions && <PositionsPanel positions={positionsData} />}
                {visible.holdings && (
                    <div className="md:col-span-2">
                        <HoldingsPanel holdings={holdingsData} />
                    </div>
                )}
            </div>

        </div>
    );
};

export default PortfolioDashboard;
