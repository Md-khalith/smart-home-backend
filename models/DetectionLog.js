const mongoose = require('mongoose');

const detectionLogSchema = new mongoose.Schema({
  detected: {
    type: Boolean,
    required: true,
    default: false
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('DetectionLog', detectionLogSchema);
