require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const repoRoutes = require('./routes/repo');

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Use CLIENT_URL for CORS
const allowedOrigin = process.env.CLIENT_URL || 'http://localhost:5173';

app.use(cors({
  origin: allowedOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log(`✅ MongoDB Connected`))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// Routes
app.use('/api/repo', repoRoutes);

// Health Check
app.get('/', (req, res) => {
  res.json({ message: 'GitWise AI API is running', clientUrl: allowedOrigin });
});

app.listen(PORT, () => {
  console.log(`🌍 Server running on port ${PORT}`);
  console.log(`🔗 Allowed Client Origin: ${allowedOrigin}`);
});