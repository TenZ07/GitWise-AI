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
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('❌ MONGO_URI is not defined in .env');
  process.exit(1);
}

// Ensure the URI has a database name
const ensureDbName = (uri) => {
  try {
    const url = new URL(uri);
    if (!url.pathname || url.pathname === '/') {
      url.pathname = '/gitwise';
    }
    return url.toString();
  } catch {
    return uri;
  }
};

// Build a direct (non-SRV) connection string as fallback
const buildDirectURI = () => {
  try {
    const url = new URL(MONGO_URI);
    const user = encodeURIComponent(url.username);
    const pass = encodeURIComponent(url.password);
    const host = url.hostname; // e.g. gitwisecluster.c2izct4.mongodb.net
    const dbName = (url.pathname && url.pathname !== '/') ? url.pathname.slice(1) : 'gitwise';
    
    // Extract the cluster domain from hostname
    const clusterMatch = host.match(/^([^.]+)\.([^.]+)\.mongodb\.net$/);
    if (!clusterMatch) return null;
    
    const clusterDomain = clusterMatch[2]; // e.g. c2izct4
    
    // Standard MongoDB Atlas shard pattern (resolved from SRV records)
    const shardHosts = [
      `ac-vygtnli-shard-00-00.${clusterDomain}.mongodb.net:27017`,
      `ac-vygtnli-shard-00-01.${clusterDomain}.mongodb.net:27017`,
      `ac-vygtnli-shard-00-02.${clusterDomain}.mongodb.net:27017`
    ].join(',');
    
    return `mongodb://${user}:${pass}@${shardHosts}/${dbName}?ssl=true&authSource=admin&retryWrites=true&w=majority`;
  } catch (err) {
    console.error('Failed to build direct URI:', err.message);
    return null;
  }
};

const connectMongoDB = async () => {
  const primaryURI = ensureDbName(MONGO_URI);
  console.log('🔗 Connecting to MongoDB...', primaryURI.replace(/\/\/[^@]+@/, '//***:***@'));
  
  try {
    // Try SRV connection first (works on most networks)
    await mongoose.connect(primaryURI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      family: 4,
    });
    console.log('✅ MongoDB Connected (SRV)');
    console.log(`🛡️ Allowed Client Origins: ${allowedOrigins.join(', ')}`);
  } catch (err) {
    // If SRV DNS lookup fails, try direct connection
    if (err.message.includes('querySrv') || err.message.includes('ECONNREFUSED') || err.message.includes('ENOTFOUND')) {
      console.warn('⚠️ SRV lookup failed, trying direct connection...');
      const directURI = buildDirectURI();
      
      if (directURI) {
        try {
          await mongoose.connect(directURI, {
            serverSelectionTimeoutMS: 15000,
            socketTimeoutMS: 45000,
            family: 4,
            tls: true,
          });
          console.log('✅ MongoDB Connected (Direct)');
          console.log(`🛡️ Allowed Client Origins: ${allowedOrigins.join(', ')}`);
          return;
        } catch (directErr) {
          console.error('❌ Direct connection also failed:', directErr.message);
        }
      }
    }
    
    console.error('❌ MongoDB Connection Error:', err.message);
    console.error('💡 Possible fixes:');
    console.error('   1. Check if your IP is whitelisted in MongoDB Atlas (Network Access → Add Current IP)');
    console.error('   2. Check your internet/firewall — SRV DNS records may be blocked');
    console.error('   3. Set your DNS to 8.8.8.8 or 1.1.1.1 in network settings');
    process.exit(1);
  }
};

connectMongoDB();

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