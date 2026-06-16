const mongoose = require('mongoose');
const { getCollection } = require('./jsonDb');

// Define Log Schema for Mongo
let LogModel;
try {
  const LogSchema = new mongoose.Schema({
    action: { type: String, required: true },
    details: { type: String },
    userId: { type: String },
    userRole: { type: String },
    timestamp: { type: Date, default: Date.now }
  });
  LogModel = mongoose.models.Log || mongoose.model('Log', LogSchema);
} catch (e) {
  LogModel = mongoose.models.Log;
}

async function writeLog(action, details, userId = null, userRole = null) {
  const { getDbMode } = require('./db');
  const timestamp = new Date().toISOString();
  console.log(`[AUDIT] ${timestamp} | [${userRole || 'SYSTEM'}] User: ${userId || 'N/A'} | Action: ${action} | Details: ${details}`);

  try {
    if (getDbMode() === 'mongo') {
      await LogModel.create({ action, details, userId, userRole });
    } else {
      const col = getCollection('log');
      await col.create({ action, details, userId, userRole, timestamp });
    }
  } catch (err) {
    console.error('Failed to write audit log:', err.message);
  }
}

async function getLogs(query = {}) {
  const { getDbMode } = require('./db');
  if (getDbMode() === 'mongo') {
    return await LogModel.find(query).sort({ timestamp: -1 }).limit(100);
  } else {
    const col = getCollection('log');
    const logs = await col.find(query);
    return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 100);
  }
}

module.exports = {
  writeLog,
  getLogs
};
