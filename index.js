const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// ── Sentry Error Monitoring (init FIRST, before any other imports) ──────────
const Sentry = require('@sentry/node');
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: 0.1,
  });
}

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./config/db');
const { generalLimiter, strictLimiter, apiLimiter } = require('./middleware/rateLimiter');

const mongoSanitize = require('express-mongo-sanitize');

require('./config/redis');
require('./config/firebase');

connectDB();


const app = express();

// ── EMERGENCY CORS FIX (Must be FIRST) ──────────────────────────────────────
app.use(cors({ 
  origin: [
    'https://copygen.in', 
    'https://www.copygen.in', 
    'https://ai-for-marketing-agency.web.app', 
    'https://ai-for-marketing-agency.firebaseapp.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// 1. Log Environment Variables Presence
console.log('--- Environment Check ---');
const requiredVars = ['MONGODB_URI', 'DODO_API_KEY'];
requiredVars.forEach(v => {
  console.log(`${v}: ${process.env[v] ? '✅ CONFIGURED' : '❌ MISSING'}`);
});
console.log('-------------------------');

// ── Hardened Security Headers (10/10) ───────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://checkout.razorpay.com"],
      connectSrc: ["'self'", "https://api.razorpay.com", "https://lumberjack.razorpay.com"],
      frameSrc: ["'self'", "https://api.razorpay.com"],
      imgSrc: ["'self'", "data:", "https://*.razorpay.com", "https://*.googleusercontent.com"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

app.set('trust proxy', 1);

const allowedOrigins = [
  'https://copygen.in',
  'https://www.copygen.in',
  'https://ai-for-marketing-agency.web.app',
  'https://ai-for-marketing-agency.firebaseapp.com',
  'http://localhost:5173',
  'http://localhost:5174',
  ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [])
];

// Webhook raw body capture
app.use('/api/billing/razorpay/webhook', express.raw({ type: 'application/json' }));
app.use('/api/billing/dodo/webhook', express.raw({ type: 'application/json' }));
app.use('/api/webhooks', express.raw({ type: 'application/json' }));

app.use(express.json({ limit: '10mb' })); 
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── NoSQL Injection Prevention (Express 5 Compatible) ──────────────────────
// Express 5 makes req.query a read-only getter, so we sanitize in-place.
app.use((req, res, next) => {
  if (req.body) mongoSanitize.sanitize(req.body);
  if (req.params) mongoSanitize.sanitize(req.params);
  if (req.query) mongoSanitize.sanitize(req.query);
  next();
});

// ── Structured Request Logging ──────────────────────────────────────────────
app.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl}`, {
    ip: req.ip,
    userAgent: req.headers['user-agent']
  });
  next();
});

// ── Route Handlers ─────────────────────────────────────────────────────────
app.use(generalLimiter);

app.use('/api/auth', strictLimiter, require('./routes/auth.routes'));
app.use('/api/brief', apiLimiter, require('./routes/brief.routes'));
app.use('/api/seo', apiLimiter, require('./routes/seo.routes'));
app.use('/api/clients', require('./routes/client.routes'));
app.use('/api/brand', require('./routes/brand.routes'));
app.use('/api/outputs', require('./routes/output.routes'));
app.use('/api/templates', require('./routes/template.routes'));
app.use('/api/analytics', require('./routes/analytics.routes'));
app.use('/api/google', require('./routes/googleAuth.routes'));
app.use('/api/billing/dodo', require('./routes/dodo.routes'));
app.use('/api/billing/razorpay', require('./routes/razorpay.routes'));
app.use('/api/upload', require('./routes/upload.routes'));
app.use('/api/admin', require('./routes/admin.routes'));
app.use('/api/factcheck', require('./routes/factChecker.routes'));
app.use('/api/webhooks', require('./routes/webhook.routes'));

// Initialize Scheduled Jobs
const { initMonthlyResetJob } = require('./jobs/monthlyReset');
const { initEmailJobs } = require('./jobs/emailJobs');
initMonthlyResetJob();
initEmailJobs();

app.get('/api/health', (req, res) => 
  res.json({ 
    status: 'ok', 
    message: 'Copygen backend running' 
  }));

// ── Standardized Error Handling (10/10) ─────────────────────────────────────
app.use((err, req, res, next) => {
  const status = err.status || 500;
  const message = status === 500 && process.env.NODE_ENV === 'production' 
    ? 'Internal Server Error' 
    : err.message;

  console.error(`${req.method} ${req.originalUrl} - ${status}: ${err.message}`, {
    stack: err.stack,
    body: req.body,
    params: req.params,
    query: req.query
  });

  res.status(status).json({
    success: false,
    error: message,
    code: err.code || 'SERVER_ERROR'
  });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => 
  console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`));
