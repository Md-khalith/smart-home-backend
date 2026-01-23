const mongoose = require('mongoose');

const powerLogSchema = new mongoose.Schema({
  power: {
    type: Number,
    required: true,
    default: 0
  },
  voltage: {
    type: Number,
    default: 220
  },
  current: {
    type: Number,
    default: 0
  },
  energy: {
    type: Number,
    default: 0
  },
  deviceStatus: {
    type: String,
    enum: ['ON', 'OFF'],
    default: 'OFF'
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// MODIFIED: compound index for faster cloud queries
powerLogSchema.index({ timestamp: -1, deviceStatus: 1 });

module.exports = mongoose.model('PowerLog', powerLogSchema);
