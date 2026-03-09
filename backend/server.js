require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const repoRoutes = require('./routes/repo');

console.log('✅ Routes module loaded successfully');

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ 1. PRODUCTION-READY CORS CONFIGURATION
// Reads CLIENT_URL from environment variables (Render/Vercel)
const allowedOrigins = process.env.CLIENT_URL 
  ? process.env.CLIENT_URL.split(',').map(url => url.trim()).filter(url => url) 
  : ['http://localhost:5173', 'http://127.0.0.1:5173'];

console.log('🛡️ Allowed Client Origins:', allowedOrigins.join(', '));

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.error('❌ Blocked by CORS:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// ✅ 2. REQUEST LOGGER MIDDLEWARE (Debugging Tool)
app.use((req, res, next) => {
  console.log(`⚡ [${new Date().toLocaleTimeString()}] ${req.method} ${req.path} from ${req.ip}`);
  next();
});

// ✅ 3. BODY PARSING (Must be after CORS)
app.use(express.json({ limit: '10mb' })); // Increased limit for large repo data
app.use(express.urlencoded({ extended: true }));

// ✅ 4. DATABASE CONNECTION
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB Connected');
    console.log(`🛡️ Allowed Client Origins: ${allowedOrigins.join(', ')}`);
  })
  .catch(err => {
    console.error('❌ MongoDB Connection Error:', err.message);
    process.exit(1);
  });

// ✅ 5. ROUTES
app.use('/api/repo', repoRoutes);

// Health Check Route
app.get('/', (req, res) => {
  res.json({ 
    message: 'GitWise AI API is running', 
    timestamp: new Date().toISOString(),
    clientUrl: process.env.CLIENT_URL,
    allowedOrigins: allowedOrigins
  });
});

// ✅ 6. GLOBAL ERROR HANDLER
app.use((err, req, res, next) => {
  console.error('💥 Global Error:', err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!', 
    error: process.env.NODE_ENV === 'development' ? err.message : 'Server Error' 
  });
});

// ✅ 7. START SERVER
app.listen(PORT, () => {
  console.log(`🌍 Server running on port ${PORT}`);
  console.log(`🔗 Test URL: http://localhost:${PORT}/`);
  console.log(`🌐 Production URL: ${process.env.CLIENT_URL || 'Not set'}`);
});