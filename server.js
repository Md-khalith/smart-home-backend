require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const deviceRoutes = require('./routes/device');
const powerRoutes = require('./routes/power');
const detectionRoutes = require('./routes/detection');
const authRoutes = require('./routes/auth');
const errorHandler = require('./middleware/errorHandler');
const { protect } = require('./middleware/authMiddleware');

const app = express();

// MODIFIED: crash on DB failure so Railway restarts
connectDB().catch(err => {
  console.error("MongoDB connection failed:", err.message);
  process.exit(1);
});

// MODIFIED: open CORS for GitHub Pages
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Public Routes
app.use('/api/auth', authRoutes);
app.use('/api/device', deviceRoutes);
app.use('/api/power', powerRoutes);
app.use('/api/detection', detectionRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Error handler
app.use(errorHandler);

// MODIFIED: Railway dynamic port
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);

  // MODIFIED: log only in dev
  if (process.env.NODE_ENV !== "production") {
    console.log(`ESP32 IP: ${process.env.ESP32_IP}`);
    console.log(`Raspberry Pi IP: ${process.env.RASPBERRY_PI_IP}`);
  }
});
