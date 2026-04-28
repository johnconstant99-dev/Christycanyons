const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Transaction = require("../models/Transaction");
const { protect, adminOnly } = require("../middleware/auth");

// All admin routes require auth + admin role
router.use(protect, adminOnly);

// ─── GET /api/admin/users — list all users ────────────────────────────────────
router.get("/users", async (req, res) => {
  try {
    const users = await User.find({ role: "user" }).sort({ createdAt: -1 });
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// ─── GET /api/admin/users/:id — get single user ───────────────────────────────
router.get("/users/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found." });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// ─── PATCH /api/admin/users/:id/balance — credit or debit user balance ────────
router.patch("/users/:id/balance", async (req, res) => {
  try {
    const { type, amount, description } = req.body;

    if (!["credit", "debit", "profit"].includes(type)) {
      return res.status(400).json({ success: false, message: "Type must be credit, debit, or profit." });
    }
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: "Valid amount required." });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found." });

    const balanceBefore = user.balance;
    const delta = type === "debit" ? -amount : amount;

    user.balance += delta;
    if (type === "profit") user.profit += amount;
    if (type === "debit" && user.balance < 0) user.balance = 0;

    await user.save();

    // Log the transaction
    await Transaction.create({
      user: user._id,
      type,
      amount,
      balanceBefore,
      balanceAfter: user.balance,
      description: description || `Admin ${type}`,
      performedBy: req.user._id,
    });

    res.json({
      success: true,
      message: `Balance ${type === "debit" ? "debited" : "credited"} successfully.`,
      user,
    });
  } catch (err) {
    console.error("Balance adjust error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// ─── PATCH /api/admin/users/:id/status — suspend or activate user ─────────────
router.patch("/users/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    if (!["active", "suspended"].includes(status)) {
      return res.status(400).json({ success: false, message: "Status must be active or suspended." });
    }

    const user = await User.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!user) return res.status(404).json({ success: false, message: "User not found." });

    res.json({ success: true, message: `User ${status}.`, user });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// ─── GET /api/admin/stats — platform overview ─────────────────────────────────
router.get("/stats", async (req, res) => {
  try {
    const users = await User.find({ role: "user" });
    const totalUsers = users.length;
    const activeUsers = users.filter((u) => u.status === "active").length;
    const totalDeposited = users.reduce((s, u) => s + u.deposited, 0);
    const totalBalance = users.reduce((s, u) => s + u.balance, 0);
    const totalProfit = users.reduce((s, u) => s + u.profit, 0);

    res.json({
      success: true,
      stats: { totalUsers, activeUsers, totalDeposited, totalBalance, totalProfit },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// ─── GET /api/admin/transactions — all transactions ───────────────────────────
router.get("/transactions", async (req, res) => {
  try {
    const transactions = await Transaction.find()
      .populate("user", "name email")
      .populate("performedBy", "name")
      .sort({ createdAt: -1 })
      .limit(100);
    res.json({ success: true, transactions });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error." });
  }
});

module.exports = router;
