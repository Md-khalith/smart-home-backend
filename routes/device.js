const express = require('express');
const router = express.Router();
const axios = require('axios');
const DeviceStatus = require('../models/DeviceStatus');

// Get current device status
router.get('/status', async (req, res) => {
  try {
    let status = await DeviceStatus.findOne({ deviceId: 'ESP32_LED' });
    if (!status) status = await DeviceStatus.create({ deviceId: 'ESP32_LED' });
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" }); // MODIFIED
  }
});

// Control device
router.post('/control', async (req, res) => {
  try {
    const { action } = req.body;

    if (!action || !['ON', 'OFF'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action. Use ON or OFF' });
    }

    // MODIFIED: sanitize ESP32 URL
    const ESP32_BASE = process.env.ESP32_IP?.replace(/\/$/, "");
    const esp32Url = `${ESP32_BASE}/${action.toLowerCase()}`;

    if (process.env.NODE_ENV !== "production") { // MODIFIED
      console.log(`Sending request to ESP32: ${esp32Url}`);
    }

    try {
      await axios.get(esp32Url, { timeout: 5000 });
    } catch (error) {
      return res.status(503).json({
        error: 'Could not communicate with ESP32',
        details: error.message
      });
    }

    let status = await DeviceStatus.findOne({ deviceId: 'ESP32_LED' });
    if (!status) status = await DeviceStatus.create({ deviceId: 'ESP32_LED' });

    status.status = action;
    status.mode = 'MANUAL';
    status.lastUpdated = new Date();
    await status.save();

    res.json({ success: true, status: action, message: `Device turned ${action}` });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" }); // MODIFIED
  }
});

// Presence
router.post('/presence', async (req, res) => {
  try {
    const { present } = req.body;

    let status = await DeviceStatus.findOne({ deviceId: 'ESP32_LED' });
    if (!status) status = await DeviceStatus.create({ deviceId: 'ESP32_LED' });

    status.humanPresence = present;
    if (present) status.presenceLastSeen = new Date();
    status.lastUpdated = new Date();
    await status.save();

    res.json({ success: true, presence: present });
  } catch {
    res.status(500).json({ error: "Internal server error" }); // MODIFIED
  }
});

// Mode
router.post('/mode', async (req, res) => {
  try {
    const { mode } = req.body;

    if (!mode || !['MANUAL', 'AUTO'].includes(mode)) {
      return res.status(400).json({ error: 'Invalid mode. Use MANUAL or AUTO' });
    }

    let status = await DeviceStatus.findOne({ deviceId: 'ESP32_LED' });
    if (!status) status = await DeviceStatus.create({ deviceId: 'ESP32_LED' });

    status.mode = mode;
    status.lastUpdated = new Date();
    await status.save();

    res.json({ success: true, mode });
  } catch {
    res.status(500).json({ error: "Internal server error" }); // MODIFIED
  }
});

module.exports = router;
