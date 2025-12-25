const OrdersPanel = ({ orders }) => {
    return (
        <section className="border rounded p-3">
            <h3 className="font-semibold mb-2">Orders</h3>

            <div className="overflow-auto max-h-[240px]">
                <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-gray-100">
                        <tr>
                            <th className="p-2 text-left">Time</th>
                            <th className="p-2 text-left">Symbol</th>
                            <th className="p-2 text-right">Qty</th>
                            <th className="p-2 text-right">Price</th>
                            <th className="p-2 text-left">Type</th>
                            <th className="p-2 text-left">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map((o, i) => (
                            <tr key={i} className="border-b">
                                <td className="p-2">{o.time}</td>
                                <td className="p-2">{o.symbol}</td>
                                <td className="p-2 text-right">{o.qty}</td>
                                <td className="p-2 text-right">{o.price}</td>
                                <td className="p-2">{o.type}</td>
                                <td className="p-2">{o.status}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    );
};

export default OrdersPanel;
