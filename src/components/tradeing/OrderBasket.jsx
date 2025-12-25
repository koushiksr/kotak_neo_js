const OrderBasket = ({ items, onRemove }) => (
    <div className="border rounded-md p-3 max-h-[320px] overflow-auto">
        <h3 className="font-semibold mb-2">Basket</h3>

        {items.length === 0 && (
            <p className="text-xs text-gray-500">No orders</p>
        )}

        {items.map((o, i) => (
            <div key={i} className="flex justify-between text-sm border p-2 rounded mb-1">
                <div>
                    <b>{o.trading_symbol}</b> • {o.quantity} • {o.order_type}
                </div>
                <button onClick={() => onRemove(i)} className="text-red-500">
                    ✕
                </button>
            </div>
        ))}
    </div>
);

export default OrderBasket;
