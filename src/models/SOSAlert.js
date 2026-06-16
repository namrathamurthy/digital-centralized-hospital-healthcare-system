const mongoose = require('mongoose');
const { getDbMode } = require('../server-utils/db');
const { getCollection } = require('../server-utils/jsonDb');

let MongooseSOSAlert;
try {
  const SOSAlertSchema = new mongoose.Schema({
    patientId: { type: String },
    patientName: { type: String, required: true },
    symptoms: { type: String, required: true },
    location: { type: String, default: 'Emergency Ward / Triage' },
    status: { type: String, enum: ['active', 'dismissed'], default: 'active' },
    dismissedBy: { type: String }, // User ID of who dismissed it
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  });
  MongooseSOSAlert = mongoose.models.SOSAlert || mongoose.model('SOSAlert', SOSAlertSchema);
} catch (e) {
  MongooseSOSAlert = mongoose.models.SOSAlert;
}

const SOSAlertProxy = {
  async find(query = {}) {
    if (getDbMode() === 'mongo') return await MongooseSOSAlert.find(query);
    return await getCollection('sosalert').find(query);
  },
  async findOne(query = {}) {
    if (getDbMode() === 'mongo') return await MongooseSOSAlert.findOne(query);
    return await getCollection('sosalert').findOne(query);
  },
  async findById(id) {
    if (getDbMode() === 'mongo') return await MongooseSOSAlert.findById(id);
    return await getCollection('sosalert').findById(id);
  },
  async create(data) {
    if (getDbMode() === 'mongo') return await MongooseSOSAlert.create(data);
    return await getCollection('sosalert').create(data);
  },
  async findByIdAndUpdate(id, update, options) {
    if (getDbMode() === 'mongo') return await MongooseSOSAlert.findByIdAndUpdate(id, update, options);
    return await getCollection('sosalert').findByIdAndUpdate(id, update, options);
  },
  async updateOne(query, update) {
    if (getDbMode() === 'mongo') return await MongooseSOSAlert.updateOne(query, update);
    return await getCollection('sosalert').updateOne(query, update);
  },
  async deleteOne(query) {
    if (getDbMode() === 'mongo') return await MongooseSOSAlert.deleteOne(query);
    return await getCollection('sosalert').deleteOne(query);
  },
  async countDocuments(query = {}) {
    if (getDbMode() === 'mongo') return await MongooseSOSAlert.countDocuments(query);
    return await getCollection('sosalert').countDocuments(query);
  }
};

module.exports = SOSAlertProxy;
