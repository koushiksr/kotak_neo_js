const PositionsPanel = ({ positions }) => {
    return (
        <section className="border rounded p-3">
            <h3 className="font-semibold mb-2">Positions</h3>

            <div className="overflow-auto max-h-[240px]">
                <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-gray-100">
                        <tr>
                            <th className="p-2 text-left">Symbol</th>
                            <th className="p-2 text-right">Qty</th>
                            <th className="p-2 text-right">Avg</th>
                            <th className="p-2 text-right">LTP</th>
                            <th className="p-2 text-right">P&L</th>
                        </tr>
                    </thead>
                    <tbody>
                        {positions.map((p, i) => {
                            const pnl = (p.ltp - p.avg) * p.qty;
                            return (
                                <tr key={i} className="border-b">
                                    <td className="p-2">{p.symbol}</td>
                                    <td className="p-2 text-right">{p.qty}</td>
                                    <td className="p-2 text-right">{p.avg}</td>
                                    <td className="p-2 text-right">{p.ltp}</td>
                                    <td className={`p-2 text-right ${pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {pnl.toFixed(2)}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </section>
    );
};

export default PositionsPanel;
