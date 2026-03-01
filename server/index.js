const express = require('express');
const dns = require('dns');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Prefer IPv4 on hosts where IPv6 egress can be unreliable (common on some PaaS)
if (typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('ipv4first');
}

const surveyRoutes = require('./routes/survey');
const analyticsRoutes = require('./routes/analytics');
const emailRoutes = require('./routes/email');
const adminRoutes = require('./routes/admin');

const app = express();

// If running behind something that sets X-Forwarded-For (some tools / proxies)
app.set('trust proxy', 1);

const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
const corsOriginRaw = process.env.CORS_ORIGIN;
const corsOrigins = corsOriginRaw
  ? corsOriginRaw.split(',').map((s) => s.trim()).filter(Boolean)
  : null;

app.use(
  cors({
    origin: corsOrigins || true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'x-admin-key'],
    credentials: false
  })
);
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cep-survey', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ Connected to MongoDB successfully');
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  // Temporary: keep server running so we can see API errors instead of Network Error
  // Remove process.exit once Atlas is stable
  // process.exit(1);
});

// Routes
app.use('/api/survey', surveyRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
