const express = require('express');
const router = express.Router();
const DetectionLog = require('../models/DetectionLog');
const DeviceStatus = require('../models/DeviceStatus');

// Log detection data
router.post('/', async (req, res) => {
  console.log('[ESP32] POST /api/detection received. Body:', JSON.stringify(req.body), 'Query:', req.query);
  try {
    // Accept from both body and query parameters
    let { detected, timestamp } = req.body.detected !== undefined ? req.body : req.query;

    // Convert string to boolean if needed
    if (typeof detected === 'string') {
      detected = detected.toLowerCase() === 'true';
    }

    console.log(`[DETECTION] Received: detected=${detected}`);

    const log = await DetectionLog.create({
      detected: Boolean(detected),
      timestamp: timestamp ? new Date(timestamp) : new Date()
    });

    // Update device status based on detection
    const deviceStatus = detected ? 'ON' : 'OFF';
    await DeviceStatus.findOneAndUpdate(
      { deviceId: 'ESP32_LED' },
      {
        status: deviceStatus,
        humanPresence: detected,
        lastUpdated: new Date(),
        presenceLastSeen: detected ? new Date() : null
      },
      { upsert: true, new: true }
    );

    console.log(`[DETECTION] Saved: detected=${log.detected}, Device Status: ${deviceStatus}`);
    res.json({ success: true, log });
  } catch (error) {
    console.error('[ESP32] Error processing detection data:', error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get latest detection
router.get('/latest', async (req, res) => {
  try {
    const latestLog = await DetectionLog.findOne()
      .sort({ timestamp: -1 })
      .lean();

    if (!latestLog) {
      return res.json({
        detected: false,
        timestamp: new Date()
      });
    }

    res.json(latestLog);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get detection history
router.get('/history', async (req, res) => {
  try {
    const hours = parseInt(req.query.hours) || 24;
    const startTime = new Date(Date.now() - hours * 60 * 60 * 1000);

    const logs = await DetectionLog.find({
      timestamp: { $gte: startTime }
    })
      .sort({ timestamp: 1 })
      .lean();

    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
