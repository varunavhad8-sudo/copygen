const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./config/db');
const { generalLimiter, strictLimiter, apiLimiter } = require('./middleware/rateLimiter');

require('./config/redis');
require('./config/firebase');

connectDB();

const app = express();

app.use(helmet());
app.set('trust proxy', 1);

if (process.env.NODE_ENV === 'production' && !process.env.CLIENT_URL) {
  throw new Error('FATAL: CLIENT_URL environment variable is not set in production');
}

const allowedOrigins = process.env.NODE_ENV === 'production' 
  ? ['https://copygen.in'] 
  : ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174'];

app.use(cors({ 
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Capture raw body for webhook routes
app.use((req, res, next) => {
  if (req.originalUrl.includes('/webhook')) {
    let rawBody = ''
    req.on('data', chunk => { rawBody += chunk.toString() })
    req.on('end', () => {
      req.rawBody = rawBody
      next()
    })
  } else {
    next()
  }
})

app.use(express.json());

// ── NoSQL Injection Prevention ─────────────────────────────────────────────
// Strips keys containing '$' or '.' from req.body, req.params, req.query
// Must be applied AFTER body parsing and BEFORE route handlers
const mongoSanitize = require('express-mongo-sanitize');
app.use((req, res, next) => {
  if (req.body) mongoSanitize.sanitize(req.body);
  if (req.params) mongoSanitize.sanitize(req.params);
  if (req.query) mongoSanitize.sanitize(req.query);
  if (req.headers) mongoSanitize.sanitize(req.headers);
  next();
});

// Apply global rate limiter (Tier 3)
app.use(generalLimiter);

// Route Handlers with specific limiters
app.use('/api/auth', strictLimiter, require('./routes/auth.routes')); // Tier 1
app.use('/api/brief', apiLimiter, require('./routes/brief.routes'));   // Tier 2

// Other routes (covered by global generalLimiter)
app.use('/api/clients', require('./routes/client.routes'));
app.use('/api/brand', require('./routes/brand.routes'));
app.use('/api/outputs', require('./routes/output.routes'));
app.use('/api/templates', require('./routes/template.routes'));
app.use('/api/analytics', require('./routes/analytics.routes'));
app.use('/api/billing/dodo', require('./routes/dodo.routes'));
app.use('/api/billing/razorpay', require('./routes/razorpay.routes'));
app.use('/api/upload', require('./routes/upload.routes'));
app.use('/api/admin', require('./routes/admin.routes'));
// ── Webhook routes (use their own express.raw() body parser) ────────────────
app.use('/api/webhooks', require('./routes/webhook.routes'));

// Initialize Scheduled Jobs
const { initMonthlyResetJob } = require('./jobs/monthlyReset');
initMonthlyResetJob();

app.get('/api/health', (req, res) => 
  res.json({ 
    status: 'ok', 
    message: 'Copygen backend running' 
  }));

app.use(require('./middleware/errorHandler'));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => 
  console.log(`Server running on port ${PORT}`));


