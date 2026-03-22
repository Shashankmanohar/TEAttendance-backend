const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors()); // Temporarily allow all origins to isolate CORS issues
app.use(express.json());

// Catch JSON parsing errors
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.error('Bad JSON request body:', err);
    return res.status(400).json({ message: 'Invalid JSON payload' });
  }
  next();
});

// Logger
const fs = require('fs');
const path = require('path');
const logFile = path.join(__dirname, 'server.log');

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logLine = `${new Date().toISOString()} | ${req.method} ${req.originalUrl} ${res.statusCode} | ${duration}ms\n`;
    fs.appendFileSync(logFile, logLine);
    console.log(logLine);
  });
  next();
});

// MongoDB Connection
let cachedDb = null;
const connectDB = async () => {
  if (cachedDb) return cachedDb;
  
  try {
    console.log('Connecting to MongoDB Atlas...');
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
    });
    cachedDb = conn;
    console.log('MongoDB connected successfully');
    return conn;
  } catch (err) {
    console.error('MongoDB connection error:', err);
    throw err;
  }
};

// Middleware to ensure DB connection is ready
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    res.status(500).json({ 
      message: 'Database Connection Error', 
      error: err.message 
    });
  }
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/students', require('./routes/students'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/staff', require('./routes/staff'));

// Basic Route
app.get('/', (req, res) => {
  res.send('Attendance System API is running (v2)');
});

// Health check route
app.get('/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';
  res.json({ status: 'OK', database: dbStatus });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  res.status(500).json({ 
    message: 'Internal Server Error', 
    error: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack 
  });
});

// Start Server
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

module.exports = app;
