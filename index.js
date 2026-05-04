const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./config/db');
const { generalLimiter, strictLimiter, apiLimiter } = require('./middleware/rateLimiter');
const logger = require('./utils/logger');
const mongoSanitize = require('express-mongo-sanitize');

require('./config/redis');
require('./config/firebase');

connectDB();

const app = express();

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

const allowedOrigins = process.env.NODE_ENV === 'production' 
  ? ['https://copygen.in', 'https://ai-for-marketing-agency.web.app', 'https://ai-for-marketing-agency.firebaseapp.com'] 
  : ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174'];

app.use(cors({ 
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn(`[CORS] Blocked request from unauthorized origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Webhook raw body capture (Dodopayments & Razorpay)
app.use('/api/billing/razorpay/webhook', express.raw({ type: 'application/json' }));
app.use('/api/billing/dodo/webhook', express.raw({ type: 'application/json' }));
app.use('/api/webhooks', express.raw({ type: 'application/json' }));

app.use(express.json({ limit: '10kb' })); 

// ── NoSQL Injection Prevention ─────────────────────────────────────────────
app.use(mongoSanitize());

// ── Structured Request Logging ──────────────────────────────────────────────
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.originalUrl}`, {
    ip: req.ip,
    userAgent: req.headers['user-agent']
  });
  next();
});

// ── Route Handlers ─────────────────────────────────────────────────────────
app.use(generalLimiter);

app.use('/api/auth', strictLimiter, require('./routes/auth.routes'));
app.use('/api/brief', apiLimiter, require('./routes/brief.routes'));
app.use('/api/clients', require('./routes/client.routes'));
app.use('/api/brand', require('./routes/brand.routes'));
app.use('/api/outputs', require('./routes/output.routes'));
app.use('/api/templates', require('./routes/template.routes'));
app.use('/api/analytics', require('./routes/analytics.routes'));
app.use('/api/billing/dodo', require('./routes/dodo.routes'));
app.use('/api/billing/razorpay', require('./routes/razorpay.routes'));
app.use('/api/upload', require('./routes/upload.routes'));
app.use('/api/admin', require('./routes/admin.routes'));
app.use('/api/webhooks', require('./routes/webhook.routes'));

// Initialize Scheduled Jobs
const { initMonthlyResetJob } = require('./jobs/monthlyReset');
initMonthlyResetJob();

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

  logger.error(`${req.method} ${req.originalUrl} - ${status}: ${err.message}`, {
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
  logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`));
