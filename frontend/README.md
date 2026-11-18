# CopyGen — AI Copy Generator for Marketing Agencies

> **The AI-powered OS for modern marketing agencies.** CopyGen memorizes your clients' brand voices and generates on-brand marketing content in seconds.

[![Live](https://img.shields.io/badge/Live-copygen.in-gold)](https://copygen.in)
[![Backend](https://img.shields.io/badge/Backend-Railway-blueviolet)](https://railway.app)
[![Frontend](https://img.shields.io/badge/Frontend-Firebase%20Hosting-orange)](https://firebase.google.com)

---

## ✨ Features

- 🤖 **AI Copy Generation** — Blog posts, ad copy, social captions, email sequences, SEO briefs
- 🧠 **Brand Memory** — AI learns and remembers each client's tone, vocabulary, and style
- 📊 **Analytics** — Track generation performance and content metrics
- 🔍 **Fact Checker** — AI-powered fact verification for all generated content
- 🔎 **SEO Generator** — Auto-generate SEO briefs with LSI keywords
- 👥 **Client Management** — Manage multiple clients with zero context bleed
- 📋 **Templates** — Save and reuse high-performing content formats
- 💳 **Subscriptions** — Razorpay & Dodo Payments integration with plan tiers

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + Vite 8, Framer Motion, GSAP, Three.js |
| Backend | Node.js + Express 5, MongoDB + Mongoose |
| Auth | Firebase Auth (Email + Google OAuth) |
| AI | Gemini 1.5 Flash, OpenAI GPT-4, Claude (via LLM Router) |
| Payments | Razorpay + Dodo Payments |
| Cache | Redis (Upstash) |
| Email | Nodemailer (SMTP) |
| Hosting | Firebase Hosting (frontend) + Railway (backend) |

---

## 🚀 Local Development Setup

### Prerequisites
- Node.js 20+
- MongoDB Atlas account
- Firebase project
- Redis (Upstash free tier works)

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd "ai for marketing places"

# Install frontend dependencies
npm install

# Install backend dependencies
cd server && npm install && cd ..
```

### 2. Environment Variables

Copy `.env.example` to `.env` at the project root and fill in all values:

```bash
cp .env.example .env
```

Key variables required:

| Variable | Description |
|----------|-------------|
| `VITE_FIREBASE_*` | Firebase config (get from Firebase Console) |
| `VITE_API_URL` | Backend URL (e.g. `http://localhost:4000`) |
| `MONGODB_URI` | MongoDB Atlas connection string |
| `GEMINI_API_KEY` | Google Gemini API key |
| `OPENAI_API_KEY` | OpenAI API key |
| `RAZORPAY_KEY_ID` + `SECRET` | Razorpay credentials |
| `DODO_API_KEY` | Dodo Payments API key |
| `REDIS_URL` | Upstash Redis URL |
| `FIREBASE_*` | Firebase Admin SDK credentials |
| `ADMIN_SECRET` | Secret token for admin API endpoints |
| `SENTRY_DSN` | Sentry DSN for error monitoring |

### 3. Run Development Server

```bash
# Run both frontend and backend simultaneously
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:4000`

---

## 📦 Deployment

### Frontend (Firebase Hosting)

```bash
npm run build
firebase deploy --only hosting
```

### Backend (Railway)

Push to your Railway-connected Git branch. Railway auto-deploys using `nixpacks.toml`.

Set all environment variables in the Railway dashboard under **Variables**.

---

## 🏗 Project Structure

```
ai for marketing places/
├── src/                    # React frontend
│   ├── pages/              # All page components (21 pages)
│   ├── components/         # Reusable UI components
│   ├── context/            # React context (Auth)
│   ├── api/                # Axios API wrappers
│   └── utils/              # Utility functions
├── server/                 # Express backend
│   ├── routes/             # API route definitions (15 routes)
│   ├── controllers/        # Route handler logic
│   ├── services/           # Business logic (AI, payments, email)
│   ├── models/             # MongoDB/Mongoose schemas
│   ├── middleware/          # Auth, rate limiting, etc.
│   ├── jobs/               # Scheduled background jobs
│   └── config/             # DB, Redis, Firebase, Razorpay configs
├── public/                 # Static assets
├── firebase.json           # Firebase hosting config
└── vercel.json             # Vercel config (optional)
```

---

## 💳 Subscription Plans

| Plan | Generations/mo | Brand Voices | Price |
|------|---------------|--------------|-------|
| Free | 10 (lifetime) | 1 | ₹0 |
| Starter | 300 | 10 | ₹99/mo |
| Growth | 1,000 | 30 | ₹249/mo |
| Agency | 3,000 | 100 | ₹499/mo |

---

## 🔒 Security

- Firebase Auth + JWT for all protected routes
- Helmet.js security headers
- Rate limiting (general + strict tiers)
- MongoDB NoSQL injection sanitization
- CORS restricted to known origins
- Webhook signature verification (Razorpay HMAC + Dodo HMAC)

---

## 📧 Email Automation

Automated transactional emails triggered by:
- New subscription activation → invoice email
- Subscription cancellation → confirmation email
- Plan expiry/downgrade → downgrade notification
- Win-back campaign → scheduled re-engagement email

---

## 🧪 Running Tests

```bash
# Frontend tests (Vitest)
npm run test

# Lint check
npm run lint
```

---

## 📄 License

Proprietary — All rights reserved. © 2026 CopyGen.
