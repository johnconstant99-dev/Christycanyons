const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const alpaca = require("../config/alpaca");

// All routes require auth
router.use(protect);

// ─── GET /api/alpaca/account ──────────────────────────────────────────────────
router.get("/account", async (req, res) => {
  try {
    const account = await alpaca.getAccount();
    res.json({ success: true, account });
  } catch (err) {
    console.error("Alpaca account error:", err.message);
    res.status(502).json({ success: false, message: "Could not reach Alpaca API." });
  }
});

// ─── GET /api/alpaca/positions ────────────────────────────────────────────────
router.get("/positions", async (req, res) => {
  try {
    const positions = await alpaca.getPositions();
    res.json({ success: true, positions });
  } catch (err) {
    console.error("Alpaca positions error:", err.message);
    res.status(502).json({ success: false, message: "Could not fetch positions." });
  }
});

// ─── GET /api/alpaca/orders ───────────────────────────────────────────────────
router.get("/orders", async (req, res) => {
  try {
    const orders = await alpaca.getOrders(req.query.limit || 20);
    res.json({ success: true, orders });
  } catch (err) {
    console.error("Alpaca orders error:", err.message);
    res.status(502).json({ success: false, message: "Could not fetch orders." });
  }
});

// ─── GET /api/alpaca/history ──────────────────────────────────────────────────
router.get("/history", async (req, res) => {
  try {
    const { period = "1M", timeframe = "1D" } = req.query;
    const history = await alpaca.getPortfolioHistory(period, timeframe);
    res.json({ success: true, history });
  } catch (err) {
    console.error("Alpaca history error:", err.message);
    res.status(502).json({ success: false, message: "Could not fetch portfolio history." });
  }
});

module.exports = router;
