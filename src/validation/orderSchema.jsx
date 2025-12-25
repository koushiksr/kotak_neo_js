import { z } from 'zod';

export const orderSchema = z.object({
    exchange_segment: z.enum(['nse_cm', 'bse_cm']),
    trading_symbol: z.string().min(1, 'Symbol required'),
    quantity: z.coerce.number().positive('Qty must be > 0'),
    price: z.coerce.number().optional(),
    product: z.enum(['MIS', 'CNC', 'NRML']),
    order_type: z.enum(['MKT', 'L']),
    transaction_type: z.enum(['B', 'S']),
});
