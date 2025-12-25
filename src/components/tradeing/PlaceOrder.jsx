import { useState, useRef } from 'react';
import {
  TextField,
  Autocomplete,
  Button,
  ToggleButton,
  ToggleButtonGroup,
  CircularProgress,
  MenuItem,
  Select,
  Box,
  Typography,
} from '@mui/material';

import { orderSchema } from '../../validation/orderSchema';
import { EXCHANGE, PRODUCT, ORDER_TYPE, SIDE } from '../../constants/tradingEnums';
import searchCsvFiles, { loadMasterData } from './../../services/searchSymbols';
import { clearCache } from '../../services/symbolStore';

const PlaceOrder = ({ onAdd }) => {
  const [form, setForm] = useState({
    exchange_segment: EXCHANGE.NSE,
    trading_symbol: '',
    quantity: '',
    price: '',
    product: PRODUCT.MIS,
    order_type: ORDER_TYPE.MARKET,
    transaction_type: SIDE.BUY,
  });

  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const debounceRef = useRef(null);
  const abortRef = useRef(null);
  const lockedRef = useRef(false); // 🔒 stop searching after select

  /* ---------------- SYMBOL SEARCH ---------------- */
  const searchSymbols = (value) => {
    if (!value || lockedRef.current) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      if (abortRef.current) abortRef.current.abort();
      abortRef.current = new AbortController();

      setLoading(true);
      try {
        const res = await searchCsvFiles({
          searchString: value,
          maxMatches: 10,
        });

        // 🔑 FIX: use r.s instead of r.row
        setOptions(
          res.map(r => r.s).filter(Boolean)
        );
      } catch (e) {
        if (e.name !== 'AbortError') console.error(e);
      } finally {
        setLoading(false);
      }
    }, 250);
  };

  function clearAndLoadData() {
    console.log('Clearing cache and reloading data...');
    clearCache();
    console.log('Cache cleared. Reloading master data...');
    loadMasterData();
    console.log('Master data reload initiated.');
  }

  /* ---------------- SUBMIT ---------------- */
  const submit = () => {
    const symbol = form.trading_symbol.trim().toUpperCase();

    if (!symbol) {
      setError('Trading symbol required');
      return;
    }

    const parsed = orderSchema.safeParse({
      ...form,
      trading_symbol: symbol,
      quantity: Number(form.quantity),
      price: form.price ? Number(form.price) : undefined,
    });

    if (!parsed.success) {
      setError(parsed.error.errors[0].message);
      return;
    }

    setError('');
    onAdd(parsed.data);
    setForm(p => ({ ...p, quantity: '', price: '' }));
  };

  return (
    <Box p={2} borderRadius={2} boxShadow={1} bgcolor="white">
      <Typography variant="h6" mb={1}>Order Entry</Typography>
      <Button
        variant="contained"
        sx={{ mt: 2 }}
        onClick={clearAndLoadData}
      >
        clear cache
      </Button>

      {/* BUY / SELL */}
      <ToggleButtonGroup
        fullWidth
        value={form.transaction_type}
        exclusive
        onChange={(_, v) => v && setForm(p => ({ ...p, transaction_type: v }))}
        sx={{ mb: 2 }}
      >
        <ToggleButton value={SIDE.BUY} color="success">BUY</ToggleButton>
        <ToggleButton value={SIDE.SELL} color="error">SELL</ToggleButton>
      </ToggleButtonGroup>

      {/* SYMBOL SEARCH */}
      <Autocomplete
        freeSolo
        options={options}
        loading={loading}
        inputValue={form.trading_symbol}
        onInputChange={(_, v) => {
          lockedRef.current = false;
          setForm(p => ({ ...p, trading_symbol: v }));
          searchSymbols(v);
        }}
        onChange={(_, v) => {
          if (v) {
            lockedRef.current = true; // 🔒 stop searching
            setForm(p => ({ ...p, trading_symbol: v }));
          }
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Trading Symbol"
            placeholder="NATGASMINI…"
            margin="dense"
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {loading && <CircularProgress size={18} />}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
      />

      {/* QTY / PRICE */}
      <Box display="flex" gap={1} mt={1}>
        <TextField
          label="Quantity"
          type="number"
          fullWidth
          value={form.quantity}
          onChange={e => setForm(p => ({ ...p, quantity: e.target.value }))}
        />
        <TextField
          label="Price"
          type="number"
          fullWidth
          disabled={form.order_type === ORDER_TYPE.MARKET}
          value={form.price}
          onChange={e => setForm(p => ({ ...p, price: e.target.value }))}
        />
      </Box>

      {/* ORDER TYPE / PRODUCT */}
      <Box display="flex" gap={1} mt={1}>
        <Select
          fullWidth
          value={form.order_type}
          onChange={e => setForm(p => ({ ...p, order_type: e.target.value }))}
        >
          {Object.entries(ORDER_TYPE).map(([k, v]) => (
            <MenuItem key={k} value={v}>{k}</MenuItem>
          ))}
        </Select>

        <Select
          fullWidth
          value={form.product}
          onChange={e => setForm(p => ({ ...p, product: e.target.value }))}
        >
          {Object.entries(PRODUCT).map(([k, v]) => (
            <MenuItem key={k} value={v}>{k}</MenuItem>
          ))}
        </Select>
      </Box>

      {error && <Typography color="error" variant="caption">{error}</Typography>}

      <Button
        fullWidth
        variant="contained"
        sx={{ mt: 2 }}
        onClick={submit}
      >
        Add to Basket
      </Button>
    </Box>
  );
};

export default PlaceOrder;
