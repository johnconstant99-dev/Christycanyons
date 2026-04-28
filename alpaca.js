const axios = require("axios");

const alpacaClient = axios.create({
  baseURL: process.env.ALPACA_BASE_URL || "https://paper-api.alpaca.markets",
  headers: {
    "APCA-API-KEY-ID": process.env.ALPACA_API_KEY,
    "APCA-API-SECRET-KEY": process.env.ALPACA_API_SECRET,
    "Content-Type": "application/json",
  },
});

// ─── Get account info ─────────────────────────────────────────────────────────
exports.getAccount = async () => {
  const { data } = await alpacaClient.get("/v2/account");
  return {
    totalValue: parseFloat(data.portfolio_value),
    cash: parseFloat(data.cash),
    buyingPower: parseFloat(data.buying_power),
    equity: parseFloat(data.equity),
    status: data.status,
    currency: data.currency,
  };
};

// ─── Get open positions ───────────────────────────────────────────────────────
exports.getPositions = async () => {
  const { data } = await alpacaClient.get("/v2/positions");
  return data.map((p) => ({
    symbol: p.symbol,
    qty: parseFloat(p.qty),
    avgEntry: parseFloat(p.avg_entry_price),
    currentPrice: parseFloat(p.current_price),
    marketValue: parseFloat(p.market_value),
    unrealizedPnl: parseFloat(p.unrealized_pl),
    unrealizedPnlPct: parseFloat(p.unrealized_plpc) * 100,
    side: p.side,
  }));
};

// ─── Get recent orders/trades ────────────────────────────────────────────────
exports.getOrders = async (limit = 20) => {
  const { data } = await alpacaClient.get(`/v2/orders?status=filled&limit=${limit}&direction=desc`);
  return data.map((o) => ({
    id: o.id,
    symbol: o.symbol,
    side: o.side,
    qty: parseFloat(o.qty),
    filledQty: parseFloat(o.filled_qty),
    filledAvgPrice: parseFloat(o.filled_avg_price),
    status: o.status,
    createdAt: o.created_at,
    filledAt: o.filled_at,
  }));
};

// ─── Get portfolio history ────────────────────────────────────────────────────
exports.getPortfolioHistory = async (period = "1M", timeframe = "1D") => {
  const { data } = await alpacaClient.get(
    `/v2/account/portfolio/history?period=${period}&timeframe=${timeframe}`
  );
  return {
    timestamps: data.timestamp,
    equity: data.equity,
    profitLoss: data.profit_loss,
    profitLossPct: data.profit_loss_pct,
    baseValue: data.base_value,
  };
};
