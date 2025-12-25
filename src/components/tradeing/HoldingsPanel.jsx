const HoldingsPanel = ({ holdings }) => {
    return (
        <section className="border rounded p-3">
            <h3 className="font-semibold mb-2">Holdings</h3>

            <div className="overflow-auto max-h-[260px]">
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
                        {holdings.map((h, i) => {
                            const pnl = (h.ltp - h.avg) * h.qty;
                            return (
                                <tr key={i} className="border-b">
                                    <td className="p-2">{h.symbol}</td>
                                    <td className="p-2 text-right">{h.qty}</td>
                                    <td className="p-2 text-right">{h.avg}</td>
                                    <td className="p-2 text-right">{h.ltp}</td>
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

export default HoldingsPanel;
