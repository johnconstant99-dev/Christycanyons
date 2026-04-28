# Canyon's Investment — Backend API

Node.js + Express + MongoDB backend for the Canyon's Investment platform.

---

## 🚀 Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Set up environment variables
```bash
cp .env.example .env
# Then edit .env with your real values
```

### 3. Run locally
```bash
npm run dev        # development (nodemon)
npm start          # production
```

---

## 🔑 Environment Variables

| Variable | Description |
|---|---|
| `MONGO_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Secret key for JWT signing (make it long & random) |
| `ALPACA_API_KEY` | Your Alpaca API key |
| `ALPACA_API_SECRET` | Your Alpaca API secret |
| `ALPACA_BASE_URL` | `https://paper-api.alpaca.markets` (paper) or `https://api.alpaca.markets` (live) |
| `ADMIN_EMAIL` | Admin login email |
| `ADMIN_PASSWORD` | Admin login password |
| `WALLET_BTC` | Your BTC receiving address |
| `WALLET_USDT` | Your USDT (TRC-20) receiving address |

---

## 📡 API Endpoints

### Auth
| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user (JWT required) |

### Deposits
| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/deposits/wallets` | User | Get wallet addresses |
| POST | `/api/deposits` | User | Submit deposit |
| GET | `/api/deposits/mine` | User | Your deposit history |
| GET | `/api/deposits` | Admin | All deposits |
| PATCH | `/api/deposits/:id/approve` | Admin | Approve deposit |
| PATCH | `/api/deposits/:id/reject` | Admin | Reject deposit |

### Admin
| Method | Route | Description |
|---|---|---|
| GET | `/api/admin/users` | List all users |
| PATCH | `/api/admin/users/:id/balance` | Credit / debit balance |
| PATCH | `/api/admin/users/:id/status` | Suspend / activate user |
| GET | `/api/admin/stats` | Platform stats |
| GET | `/api/admin/transactions` | All transactions |

### Alpaca (Live Data)
| Method | Route | Description |
|---|---|---|
| GET | `/api/alpaca/account` | Account info + portfolio value |
| GET | `/api/alpaca/positions` | Open positions |
| GET | `/api/alpaca/orders` | Filled orders/trades |
| GET | `/api/alpaca/history` | Portfolio performance history |

---

## 🌐 Deploy to Railway

1. Push to GitHub
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Add environment variables in Railway dashboard
4. Railway auto-detects Node.js and runs `npm start`

```bash
# Push to GitHub
git init
git add .
git commit -m "Initial Canyon's Investment backend"
git remote add origin https://github.com/johnconstant99-dev/canyons-investment-backend
git push -u origin main
```

---

## 🔒 Security Notes

- All passwords are bcrypt hashed (12 rounds)
- JWT tokens expire in 7 days
- Rate limiting: 100 requests / 15 min per IP
- Admin routes require `role: "admin"` in JWT
- Passwords never returned in API responses

---

## 📁 Project Structure

```
canyons-backend/
├── server.js              # Entry point
├── .env.example           # Environment template
├── models/
│   ├── User.js            # User schema
│   ├── Deposit.js         # Deposit schema
│   └── Transaction.js     # Transaction log schema
├── routes/
│   ├── auth.js            # Register / login
│   ├── deposits.js        # Deposit management
│   ├── admin.js           # Admin controls
│   └── alpaca.js          # Live Alpaca data
├── middleware/
│   └── auth.js            # JWT protect + adminOnly
└── config/
    └── alpaca.js          # Alpaca API helper
```
