const express = require('express');
const router = express.Router();
const PowerLog = require('../models/PowerLog');
const DeviceStatus = require('../models/DeviceStatus');

// Log power data
router.post('/log', async (req, res) => {
  try {
    const { power, voltage, current, energy } = req.body;

    const status = await DeviceStatus.findOne({ deviceId: 'ESP32_LED' });
    const deviceStatus = status ? status.status : 'OFF';

    const log = await PowerLog.create({
      power: power || 0,
      voltage: voltage || 220,
      current: current || 0,
      energy: energy || 0,
      deviceStatus
    });

    res.json({ success: true, log });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" }); // MODIFIED
  }
});

// Get current power consumption
router.get('/current', async (req, res) => {
  try {
    const latestLog = await PowerLog.findOne()
      .sort({ timestamp: -1 })
      .lean(); // MODIFIED

    if (!latestLog) {
      return res.json({
        power: 0,
        voltage: 220,
        current: 0,
        energy: 0,
        timestamp: new Date()
      });
    }

    res.json(latestLog);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" }); // MODIFIED
  }
});

// Get power history
router.get('/history', async (req, res) => {
  try {
    const hours = parseInt(req.query.hours) || 24;
    const startTime = new Date(Date.now() - hours * 60 * 60 * 1000);

    const logs = await PowerLog.find({
      timestamp: { $gte: startTime }
    })
      .sort({ timestamp: 1 })
      .lean(); // MODIFIED

    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" }); // MODIFIED
  }
});

// Monthly statistics
router.get('/monthly', async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const logs = await PowerLog.find({
      timestamp: { $gte: startDate, $lte: endDate }
    }).lean(); // MODIFIED

    const totalEnergy = logs.reduce((sum, log) => sum + log.energy, 0);
    const avgPower = logs.length
      ? logs.reduce((sum, log) => sum + log.power, 0) / logs.length
      : 0;
    const maxPower = logs.length
      ? Math.max(...logs.map(log => log.power))
      : 0;

    const dailyData = {};
    logs.forEach(log => {
      const day = log.timestamp.getDate();
      if (!dailyData[day]) dailyData[day] = { energy: 0, count: 0 };
      dailyData[day].energy += log.energy;
      dailyData[day].count++;
    });

    const dailyStats = Object.keys(dailyData).map(day => ({
      day: parseInt(day),
      energy: dailyData[day].energy,
      avgPower: dailyData[day].energy / dailyData[day].count
    }));

    res.json({
      year,
      month,
      totalEnergy: totalEnergy.toFixed(2),
      totalEnergyKWh: (totalEnergy / 1000).toFixed(3),
      avgPower: avgPower.toFixed(2),
      maxPower: maxPower.toFixed(2),
      dataPoints: logs.length,
      dailyStats
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" }); // MODIFIED
  }
});

// Yearly overview
router.get('/yearly', async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const monthlyData = [];

    for (let month = 1; month <= 12; month++) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);

      const logs = await PowerLog.find({
        timestamp: { $gte: startDate, $lte: endDate }
      }).lean(); // MODIFIED

      const totalEnergy = logs.reduce((sum, log) => sum + log.energy, 0);

      monthlyData.push({
        month,
        energy: totalEnergy,
        energyKWh: totalEnergy / 1000
      });
    }

    const yearTotal = monthlyData.reduce((sum, m) => sum + m.energy, 0);

    res.json({
      year,
      totalEnergy: yearTotal.toFixed(2),
      totalEnergyKWh: (yearTotal / 1000).toFixed(3),
      monthlyData
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" }); // MODIFIED
  }
});

module.exports = router;
