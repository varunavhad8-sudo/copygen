const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// ── Sentry Error Monitoring (init FIRST) ────────────────────────────────────
const Sentry = require('@sentry/node');
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: 0.1,
  });
}

// ── Global Error Logging (Debug 502s) ────────────────────────────────────────
process.on('uncaughtException', (err) => {
  console.error('FATAL: Uncaught Exception:', err);
  if (Sentry) Sentry.captureException(err);
  // Keep alive for Railway health checks if possible, or exit gracefully
  setTimeout(() => process.exit(1), 1000);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('FATAL: Unhandled Rejection at:', promise, 'reason:', reason);
  if (Sentry) Sentry.captureException(reason);
});

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { connectDB, getDbStatus } = require('./config/db');
const { generalLimiter, strictLimiter, apiLimiter } = require('./middleware/rateLimiter');

const mongoSanitize = require('express-mongo-sanitize');

require('./config/redis');
require('./config/firebase');

connectDB();


const app = express();

// ── CORS Configuration ──────────────────────────────────────────────────────
const corsOptions = {
  origin: function(origin, callback) {
    const allowed = [
      'http://localhost:5173', 
      'http://localhost:5174', 
      'http://localhost:5175', 
      'http://localhost:5176',
      'http://localhost:3000', 
      'http://localhost:4000', 
      'https://copygen.in', 
      'https://www.copygen.in'
    ];
    if (!origin || allowed.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`[CORS] Blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'admin-secret'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));


// 1. Log Environment Variables Presence
console.log('--- Environment Check ---');
const requiredVars = ['MONGODB_URI', 'DODO_API_KEY', 'ADMIN_SECRET'];
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

// Webhook raw body capture
app.use((req, res, next) => {
  if (req.originalUrl === '/api/razorpay/webhook' || req.originalUrl === '/api/dodo/webhook') {
    let data = '';
    req.setEncoding('utf8');
    req.on('data', (chunk) => { data += chunk; });
    req.on('end', () => {
      req.rawBody = data;
      next();
    });
  } else {
    next();
  }
});
app.use('/api/webhooks', express.raw({ type: 'application/json' }));

app.use(express.json({ limit: '2mb' })); 
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

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

// ── Prioritized Health Check (Prioritize for Railway) ───────────────────────
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString()
  });
});

// ── Temporary Debug Route for Environment Variables ──────────────────────────
app.get('/api/debug-env', (req, res) => {
  const key = process.env.GEMINI_API_KEY;
  res.status(200).json({
    exists: !!key,
    prefix: key ? key.substring(0, 8) : null,
    length: key ? key.length : 0
  });
});

// ── Routes ────────────────────────────────────────────────────────────
app.use(generalLimiter);

app.use('/api/auth', strictLimiter, require('./routes/auth.routes'));
app.use('/api/briefs', apiLimiter, require('./routes/brief.routes'));
app.use('/api/clients', require('./routes/client.routes'));
app.use('/api/brand', require('./routes/brand.routes'));
app.use('/api/outputs', require('./routes/output.routes'));
app.use('/api/templates', require('./routes/template.routes'));
app.use('/api/analytics', require('./routes/analytics.routes'));
app.use('/api/seo', apiLimiter, require('./routes/seo.routes'));
app.use('/api/dodo', require('./routes/dodo.routes'));
app.use('/api/razorpay', require('./routes/razorpay.routes'));
app.use('/api/upload', require('./routes/upload.routes'));
app.use('/api/admin', require('./routes/admin.routes'));
app.use('/api/factcheck', require('./routes/factChecker.routes'));
app.use('/api/google', require('./routes/googleAuth.routes'));
app.use('/api/webhooks', require('./routes/webhook.routes'));
app.use('/api/transactions', require('./routes/transaction.routes'));

// Initialize Scheduled Jobs
const { initMonthlyResetJob } = require('./jobs/monthlyReset');
const { initEmailJobs } = require('./jobs/emailJobs');
initMonthlyResetJob();
initEmailJobs();

// ── 404 Catch-all (for API routes) ──────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.originalUrl} not found`,
    code: 'NOT_FOUND'
  });
});

// ── Standardized Error Handling (10/10) ─────────────────────────────────────
app.use((err, req, res, next) => {
  const status = err.status || 500;
  const message = status === 500 && process.env.NODE_ENV === 'production' 
    ? 'Internal Server Error' 
    : err.message;

  // Strip sensitive fields before logging
  const safeBody = { ...req.body };
  const sensitiveFields = ['token', 'password', 'authorization', 'secret', 'key', 'signature', 'razorpaySignature'];
  sensitiveFields.forEach(field => {
    if (safeBody[field]) safeBody[field] = '[REDACTED]';
  });

  console.error(`${req.method} ${req.originalUrl} - ${status}: ${err.message}`, {
    stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
    body: safeBody,
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
const server = app.listen(PORT, () => 
  console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`));

// ── Global Server Timeout (Set to 150s for long AI generations) ───────────────
server.timeout = 150000;
server.keepAliveTimeout = 155000; 
server.headersTimeout = 160000;
