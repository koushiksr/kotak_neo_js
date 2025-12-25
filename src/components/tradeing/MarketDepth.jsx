const MarketDepth = ({ bids = [], asks = [] }) => {
  return (
    <div className="max-w-md w-full border rounded-md p-3 shadow-sm">
      <h2 className="text-lg font-semibold mb-2">Market Depth</h2>

      <div className="grid grid-cols-2 gap-2 text-sm font-medium text-gray-600">
        <div>Bids</div>
        <div className="text-right">Asks</div>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-2">
        {/* BIDS */}
        <div className="space-y-1">
          {bids.map((b, i) => (
            <div
              key={i}
              className="flex justify-between p-1 rounded bg-green-50"
            >
              <span className="text-green-700">{b.price}</span>
              <span>{b.qty}</span>
            </div>
          ))}
        </div>

        {/* ASKS */}
        <div className="space-y-1">
          {asks.map((a, i) => (
            <div
              key={i}
              className="flex justify-between p-1 rounded bg-red-50"
            >
              <span>{a.qty}</span>
              <span className="text-red-700">{a.price}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MarketDepth;
