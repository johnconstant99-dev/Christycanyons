const express = require("express");
const router = express.Router();
const Deposit = require("../models/Deposit");
const User = require("../models/User");
const Transaction = require("../models/Transaction");
const { protect, adminOnly } = require("../middleware/auth");

// ─── GET /api/deposits/wallets — get deposit wallet addresses ─────────────────
router.get("/wallets", protect, (req, res) => {
  res.json({
    success: true,
    wallets: {
      BTC: process.env.WALLET_BTC,
      USDT: process.env.WALLET_USDT,
    },
  });
});

// ─── POST /api/deposits — submit a new deposit ────────────────────────────────
router.post("/", protect, async (req, res) => {
  try {
    const { amount, currency, txHash } = req.body;

    if (!amount || !currency || !txHash) {
      return res.status(400).json({ success: false, message: "Amount, currency, and tx hash required." });
    }

    if (!["BTC", "USDT"].includes(currency)) {
      return res.status(400).json({ success: false, message: "Currency must be BTC or USDT." });
    }

    // Check for duplicate tx hash
    const duplicate = await Deposit.findOne({ txHash });
    if (duplicate) {
      return res.status(409).json({ success: false, message: "Transaction hash already submitted." });
    }

    const deposit = await Deposit.create({
      user: req.user._id,
      amount,
      currency,
      txHash,
    });

    res.status(201).json({ success: true, deposit });
  } catch (err) {
    console.error("Deposit error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// ─── GET /api/deposits/mine — user's own deposit history ─────────────────────
router.get("/mine", protect, async (req, res) => {
  try {
    const deposits = await Deposit.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, deposits });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// ─── GET /api/deposits — admin: all deposits ─────────────────────────────────
router.get("/", protect, adminOnly, async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const deposits = await Deposit.find(filter)
      .populate("user", "name email")
      .sort({ createdAt: -1 });
    res.json({ success: true, deposits });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// ─── PATCH /api/deposits/:id/approve — admin: approve deposit ────────────────
router.patch("/:id/approve", protect, adminOnly, async (req, res) => {
  try {
    const deposit = await Deposit.findById(req.params.id).populate("user");
    if (!deposit) return res.status(404).json({ success: false, message: "Deposit not found." });
    if (deposit.status !== "pending") {
      return res.status(400).json({ success: false, message: "Deposit already processed." });
    }

    // Update deposit
    deposit.status = "confirmed";
    deposit.approvedBy = req.user._id;
    deposit.approvedAt = new Date();
    await deposit.save();

    // Credit user balance
    const user = await User.findById(deposit.user._id);
    const balanceBefore = user.balance;
    user.balance += deposit.amount;
    user.deposited += deposit.amount;
    await user.save();

    // Log transaction
    await Transaction.create({
      user: user._id,
      type: "deposit",
      amount: deposit.amount,
      balanceBefore,
      balanceAfter: user.balance,
      description: `${deposit.currency} deposit confirmed`,
      performedBy: req.user._id,
      reference: deposit._id.toString(),
    });

    res.json({ success: true, message: "Deposit approved and balance credited.", deposit });
  } catch (err) {
    console.error("Approve error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// ─── PATCH /api/deposits/:id/reject — admin: reject deposit ──────────────────
router.patch("/:id/reject", protect, adminOnly, async (req, res) => {
  try {
    const deposit = await Deposit.findById(req.params.id);
    if (!deposit) return res.status(404).json({ success: false, message: "Deposit not found." });

    deposit.status = "rejected";
    deposit.approvedBy = req.user._id;
    deposit.approvedAt = new Date();
    deposit.notes = req.body.reason || "Rejected by admin";
    await deposit.save();

    res.json({ success: true, message: "Deposit rejected.", deposit });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error." });
  }
});

module.exports = router;
