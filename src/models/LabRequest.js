const mongoose = require('mongoose');
const { getDbMode } = require('../server-utils/db');
const { getCollection } = require('../server-utils/jsonDb');

let MongooseLabRequest;
try {
  const LabRequestSchema = new mongoose.Schema({
    appointmentId: { type: String, required: true },
    patientId: { type: String, required: true },
    patientName: { type: String, required: true },
    doctorId: { type: String, required: true },
    doctorName: { type: String, required: true },
    testType: { type: String, required: true },
    status: { type: String, enum: ['pending', 'completed'], default: 'pending' },
    result: { type: String }, // filled by lab technician
    notes: { type: String },
    requestAttachmentData: { type: String }, // photocopied request from doctor
    requestAttachmentMimeType: { type: String },
    requestAttachmentName: { type: String },
    attachmentData: { type: String },
    attachmentMimeType: { type: String },
    attachmentName: { type: String },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  });
  MongooseLabRequest = mongoose.models.LabRequest || mongoose.model('LabRequest', LabRequestSchema);
} catch (e) {
  MongooseLabRequest = mongoose.models.LabRequest;
}

const LabRequestProxy = {
  async find(query = {}) {
    if (getDbMode() === 'mongo') return await MongooseLabRequest.find(query);
    return await getCollection('labrequest').find(query);
  },
  async findOne(query = {}) {
    if (getDbMode() === 'mongo') return await MongooseLabRequest.findOne(query);
    return await getCollection('labrequest').findOne(query);
  },
  async findById(id) {
    if (getDbMode() === 'mongo') return await MongooseLabRequest.findById(id);
    return await getCollection('labrequest').findById(id);
  },
  async create(data) {
    if (getDbMode() === 'mongo') return await MongooseLabRequest.create(data);
    return await getCollection('labrequest').create(data);
  },
  async findByIdAndUpdate(id, update, options) {
    if (getDbMode() === 'mongo') return await MongooseLabRequest.findByIdAndUpdate(id, update, options);
    return await getCollection('labrequest').findByIdAndUpdate(id, update, options);
  },
  async updateOne(query, update) {
    if (getDbMode() === 'mongo') return await MongooseLabRequest.updateOne(query, update);
    return await getCollection('labrequest').updateOne(query, update);
  },
  async deleteOne(query) {
    if (getDbMode() === 'mongo') return await MongooseLabRequest.deleteOne(query);
    return await getCollection('labrequest').deleteOne(query);
  },
  async countDocuments(query = {}) {
    if (getDbMode() === 'mongo') return await MongooseLabRequest.countDocuments(query);
    return await getCollection('labrequest').countDocuments(query);
  }
};

module.exports = LabRequestProxy;
