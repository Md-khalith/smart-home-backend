const mongoose = require('mongoose');

const deviceStatusSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: true,
    unique: true,
    index: true, // MODIFIED
    default: 'ESP32_LED'
  },
  status: {
    type: String,
    enum: ['ON', 'OFF'],
    default: 'OFF'
  },
  humanPresence: {
    type: Boolean,
    default: false
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  presenceLastSeen: {
    type: Date,
    default: null
  }
});

// MODIFIED: auto refresh timestamp on update
deviceStatusSchema.pre('save', function (next) {
  this.lastUpdated = new Date();
  next();
});

module.exports = mongoose.model('DeviceStatus', deviceStatusSchema);
